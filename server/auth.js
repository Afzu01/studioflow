import { Router } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'studio';
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => error ? reject(error) : resolve());
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => error ? reject(error) : resolve());
  });
}

export function configureAuth(app, pool) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
  }

  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

  const PgSession = connectPgSimple(session);
  app.use(session({
    name: 'studioflow.sid',
    store: new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    },
  }));

  const router = Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
  });

  router.use((req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const expectedOrigin = process.env.APP_ORIGIN;
    const requestOrigin = req.get('origin');
    if (!expectedOrigin || !requestOrigin || requestOrigin !== expectedOrigin) {
      return res.status(403).json({ error: 'Request origin could not be verified.' });
    }
    next();
  });

  router.post('/register', authLimiter, async (req, res, next) => {
    const studioName = String(req.body?.studioName ?? '').trim();
    const ownerName = String(req.body?.ownerName ?? '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');

    if (studioName.length < 2 || studioName.length > 120 ||
        ownerName.length < 2 || ownerName.length > 120 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        password.length < 12 || password.length > 128) {
      return res.status(400).json({
        error: 'Enter a valid studio name, owner name and email. Passwords must be 12–128 characters.',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const studioId = randomUUID();
      const slug = `${slugify(studioName)}-${randomUUID().slice(0, 8)}`;
      const studio = await client.query(
        'INSERT INTO studios (id, name, slug) VALUES ($1, $2, $3) RETURNING id, name, slug',
        [studioId, studioName, slug],
      );
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await client.query(
        `INSERT INTO users (studio_id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'owner')
         RETURNING id, name, email, role, studio_id`,
        [studioId, ownerName, email, passwordHash],
      );
      await client.query('COMMIT');
      await regenerateSession(req);
      req.session.userId = user.rows[0].id;
      await saveSession(req);
      res.status(201).json({
        user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email, role: user.rows[0].role },
        studio: studio.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      if (error.code === '23505') return res.status(409).json({ error: 'An account could not be created with those details.' });
      next(error);
    } finally {
      client.release();
    }
  });

  router.post('/login', authLimiter, async (req, res, next) => {
    const studioSlug = String(req.body?.studioSlug ?? '').trim().toLowerCase();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');
    if (!studioSlug || !email || !password || password.length > 128) {
      return res.status(400).json({ error: 'Enter your studio address, email and password.' });
    }

    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.password_hash, s.id AS studio_id, s.name AS studio_name, s.slug, s.timezone
         FROM users u JOIN studios s ON s.id = u.studio_id
         WHERE s.slug = $1 AND u.email = $2 LIMIT 1`,
        [studioSlug, email],
      );
      const account = result.rows[0];
      const valid = account ? await bcrypt.compare(password, account.password_hash) : false;
      if (!valid) return res.status(401).json({ error: 'Studio address, email or password is incorrect.' });

      await regenerateSession(req);
      req.session.userId = account.id;
      await saveSession(req);
      res.json({
        user: { id: account.id, name: account.name, email: account.email, role: account.role },
        studio: { id: account.studio_id, name: account.studio_name, slug: account.slug, timezone: account.timezone },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', async (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not signed in.' });
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, s.id AS studio_id, s.name AS studio_name, s.slug
         FROM users u JOIN studios s ON s.id = u.studio_id WHERE u.id = $1 LIMIT 1`,
        [req.session.userId],
      );
      const account = result.rows[0];
      if (!account) {
        await destroySession(req);
        return res.status(401).json({ error: 'Session is no longer valid.' });
      }
      res.json({
        user: { id: account.id, name: account.name, email: account.email, role: account.role },
        studio: { id: account.studio_id, name: account.studio_name, slug: account.slug, timezone: account.timezone },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      await destroySession(req);
      res.clearCookie('studioflow.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', router);
}

export async function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    const result = await req.app.locals.db.query(
      'SELECT u.id, u.studio_id, u.name, u.email, u.role, s.timezone FROM users u JOIN studios s ON s.id = u.studio_id WHERE u.id = $1 LIMIT 1',
      [req.session.userId],
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'Please sign in to continue.' });
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
