import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureAuth, requireAuth } from './auth.js';
import { isValidDateOnly, isValidEmail, isValidLocalDateTime } from './validation.js';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

const app = express();
app.locals.db = pool;
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
configureAuth(app, pool);

app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!process.env.APP_ORIGIN || origin !== process.env.APP_ORIGIN) {
    return res.status(403).json({ error: 'Request origin could not be verified.' });
  }
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api', requireAuth);

app.get('/api/appointments', async (req, res, next) => {
  const { status = 'all', search = '', day } = req.query;
  if (!['all', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid appointment status.' });
  }
  try {
    const values = [req.user.studio_id];
    const conditions = ['a.studio_id = $1'];
    if (status !== 'all') {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }
    if (day) {
      if (!isValidDateOnly(day)) return res.status(400).json({ error: 'Choose a valid calendar date.' });
      values.push(req.user.timezone, day);
      conditions.push(`(a.starts_at AT TIME ZONE ${values.length - 1})::date = ${values.length}::date`);
    }
    if (search) {
      values.push(`%${String(search).slice(0, 100)}%`);
      conditions.push(`(c.name ILIKE $${values.length} OR a.service ILIKE $${values.length} OR COALESCE(c.email, '') ILIKE $${values.length})`);
    }
    const result = await pool.query(
      `SELECT a.id, a.customer_id AS "customerId", c.name AS customer, c.email, c.phone,
              a.service, a.starts_at AS "startsAt", a.duration_minutes AS "durationMinutes",
              a.amount::float AS amount, a.status, a.notes
       FROM appointments a JOIN customers c
         ON c.id = a.customer_id AND c.studio_id = a.studio_id
       WHERE ${conditions.join(' AND ')} ORDER BY a.starts_at ASC`,
      values,
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

app.get('/api/customers', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.created_at AS "createdAt",
              COUNT(a.id)::int AS bookings,
              COALESCE(SUM(a.amount) FILTER (WHERE a.status = 'completed'), 0)::float AS "lifetimeValue"
       FROM customers c
       LEFT JOIN appointments a ON a.customer_id = c.id AND a.studio_id = c.studio_id
       WHERE c.studio_id = $1
       GROUP BY c.id ORDER BY c.name`,
      [req.user.studio_id],
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

app.get('/api/summary', async (req, res, next) => {
  try {
    const result = await pool.query(
      `WITH studio_clock AS (
         SELECT
           (now() AT TIME ZONE $2)::date AS today,
           date_trunc('month', now() AT TIME ZONE $2) AS month_start,
           date_trunc('month', now() AT TIME ZONE $2) + interval '1 month' AS next_month_start
       )
       SELECT
         COUNT(*) FILTER (WHERE (a.starts_at AT TIME ZONE $2)::date = clock.today AND a.status <> 'cancelled')::int AS "todayBookings",
         COALESCE(SUM(a.amount) FILTER (WHERE (a.starts_at AT TIME ZONE $2)::date = clock.today AND a.status <> 'cancelled'), 0)::float AS "todayRevenue",
         COUNT(DISTINCT a.customer_id)::int AS "totalCustomers",
         COUNT(*) FILTER (WHERE a.status = 'completed' AND a.starts_at >= (clock.month_start AT TIME ZONE $2) AND a.starts_at < (clock.next_month_start AT TIME ZONE $2))::int AS "completedThisMonth",
         COALESCE(SUM(a.amount) FILTER (WHERE a.status = 'completed' AND a.starts_at >= (clock.month_start AT TIME ZONE $2) AND a.starts_at < (clock.next_month_start AT TIME ZONE $2)), 0)::float AS "monthRevenue",
         COUNT(*) FILTER (WHERE a.starts_at >= now() AND a.status = 'confirmed')::int AS "upcomingBookings"
       FROM appointments a CROSS JOIN studio_clock clock
       WHERE a.studio_id = $1`,
      [req.user.studio_id, req.user.timezone],
    );
    const customers = await pool.query('SELECT COUNT(*)::int AS count FROM customers WHERE studio_id = $1', [req.user.studio_id]);
    res.json({ ...result.rows[0], totalCustomers: customers.rows[0].count });
  } catch (error) { next(error); }
});

app.post('/api/appointments', async (req, res, next) => {
  const {
    name, email, phone = '', service, startsAt,
    durationMinutes = 60, amount = 0, notes = '',
  } = req.body ?? {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const duration = Number(durationMinutes);
  const price = Number(amount);
  if (![name, cleanEmail, service, startsAt].every((value) => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Name, email, service and appointment time are required.' });
  }
  if (!isValidEmail(cleanEmail) || !isValidLocalDateTime(startsAt) ||
      !Number.isInteger(duration) || duration < 15 || duration > 720 ||
      !Number.isFinite(price) || price < 0 || price > 1_000_000 ||
      String(name).trim().length > 120 || String(service).trim().length > 120) {
    return res.status(400).json({ error: 'Check the client details, date, duration and price.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize booking writes per studio so simultaneous requests cannot double-book a slot.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [req.user.studio_id]);
    const conflict = await client.query(
      `SELECT id FROM appointments
       WHERE studio_id = $1 AND status = 'confirmed'
         AND starts_at < ($2::timestamp AT TIME ZONE $4) + ($3 * interval '1 minute')
         AND starts_at + (duration_minutes * interval '1 minute') > ($2::timestamp AT TIME ZONE $4)
       LIMIT 1`,
      [req.user.studio_id, startsAt, duration, req.user.timezone],
    );
    if (conflict.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This time overlaps another confirmed appointment.' });
    }

    const customer = await client.query(
      `INSERT INTO customers (studio_id, name, email, phone)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (studio_id, (lower(email))) WHERE email IS NOT NULL AND email <> ''
       DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone
       RETURNING id`,
      [req.user.studio_id, String(name).trim(), cleanEmail, String(phone).slice(0, 40)],
    );
    const appointment = await client.query(
      `INSERT INTO appointments
       (studio_id, customer_id, service, starts_at, duration_minutes, amount, notes)
       VALUES ($1, $2, $3, ($4::timestamp AT TIME ZONE $8), $5, $6, $7)
       RETURNING id, customer_id AS "customerId", service, starts_at AS "startsAt",
                 duration_minutes AS "durationMinutes", amount::float AS amount, status, notes`,
      [req.user.studio_id, customer.rows[0].id, String(service).trim(),
       startsAt, duration, price, String(notes).slice(0, 1000), req.user.timezone],
    );
    await client.query('COMMIT');
    const result = await pool.query(
      `SELECT a.id, a.customer_id AS "customerId", c.name AS customer, c.email, c.phone,
              a.service, a.starts_at AS "startsAt", a.duration_minutes AS "durationMinutes",
              a.amount::float AS amount, a.status, a.notes
       FROM appointments a JOIN customers c ON c.id = a.customer_id AND c.studio_id = a.studio_id
       WHERE a.id = $1 AND a.studio_id = $2`,
      [appointment.rows[0].id, req.user.studio_id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

app.patch('/api/appointments/:id/status', async (req, res, next) => {
  const { status } = req.body ?? {};
  if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid appointment status.' });
  }
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = $1
       WHERE id = $2 AND studio_id = $3
       RETURNING id`,
      [status, req.params.id, req.user.studio_id],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Appointment not found.' });
    const appointment = await pool.query(
      `SELECT a.id, a.customer_id AS "customerId", c.name AS customer, c.email, c.phone,
              a.service, a.starts_at AS "startsAt", a.duration_minutes AS "durationMinutes",
              a.amount::float AS amount, a.status, a.notes
       FROM appointments a JOIN customers c ON c.id = a.customer_id AND c.studio_id = a.studio_id
       WHERE a.id = $1 AND a.studio_id = $2`,
      [req.params.id, req.user.studio_id],
    );
    res.json(appointment.rows[0]);
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error('StudioFlow API error:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '../dist');
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
  res.sendFile(path.join(distDir, 'index.html'), (error) => error && next(error));
});

const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, () => console.log(`StudioFlow API listening on port ${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
