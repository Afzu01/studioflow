import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'studioflow.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    service TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','completed','cancelled')),
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
`);

function isoDay(offset = 0, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const customerCount = db.prepare('SELECT COUNT(*) AS count FROM customers').get().count;
if (!customerCount) {
  const insertCustomer = db.prepare('INSERT INTO customers (name,email,phone) VALUES (?,?,?)');
  const insertAppointment = db.prepare(`INSERT INTO appointments
    (customer_id,service,starts_at,duration_minutes,amount,status,notes) VALUES (?,?,?,?,?,?,?)`);
  const seed = db.transaction(() => {
    const customers = [
      ['Olivia Rhye', 'olivia@example.com', '+91 98765 43210'],
      ['Phoenix Baker', 'phoenix@example.com', '+91 98765 43211'],
      ['Lana Steiner', 'lana@example.com', '+91 98765 43212'],
      ['Demi Wilkinson', 'demi@example.com', '+91 98765 43213'],
      ['Candice Wu', 'candice@example.com', '+91 98765 43214'],
      ['Natali Craig', 'natali@example.com', '+91 98765 43215'],
    ].map((c) => insertCustomer.run(...c).lastInsertRowid);
    const rows = [
      [0, 'Signature haircut', 0, 10, 1800, 'confirmed', 'First-time client'],
      [1, 'Color & gloss', 0, 11, 4200, 'confirmed', 'Patch test completed'],
      [2, 'Blowout', 0, 13, 1200, 'confirmed', ''],
      [3, 'Signature haircut', 0, 15, 1800, 'confirmed', ''],
      [4, 'Deep conditioning', 1, 10, 2200, 'confirmed', ''],
      [5, 'Color & gloss', 2, 12, 4200, 'completed', ''],
      [1, 'Blowout', -1, 14, 1200, 'completed', ''],
      [4, 'Signature haircut', 3, 11, 1800, 'confirmed', ''],
      [2, 'Deep conditioning', 4, 15, 2200, 'confirmed', ''],
    ];
    rows.forEach(([person, service, day, hour, amount, status, notes]) =>
      insertAppointment.run(customers[person], service, isoDay(day, hour), 60, amount, status, notes));
  });
  seed();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const appointmentSelect = `SELECT a.id, a.customer_id AS customerId, c.name AS customer,
  c.email, c.phone, a.service, a.starts_at AS startsAt, a.duration_minutes AS durationMinutes,
  a.amount, a.status, a.notes FROM appointments a JOIN customers c ON c.id = a.customer_id`;

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/appointments', (req, res) => {
  const { status, search, day } = req.query;
  let sql = appointmentSelect;
  const conditions = [];
  const params = [];
  if (status && status !== 'all') { conditions.push('a.status = ?'); params.push(status); }
  if (day) { conditions.push("date(a.starts_at, 'localtime') = date(?)"); params.push(day); }
  if (search) {
    conditions.push('(c.name LIKE ? OR a.service LIKE ? OR c.email LIKE ?)');
    const term = `%${search}%`; params.push(term, term, term);
  }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY a.starts_at ASC';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/customers', (_req, res) => {
  res.json(db.prepare(`SELECT c.id,c.name,c.email,c.phone,c.created_at AS createdAt,
    COUNT(a.id) AS bookings, COALESCE(SUM(CASE WHEN a.status='completed' THEN a.amount ELSE 0 END),0) AS lifetimeValue
    FROM customers c LEFT JOIN appointments a ON a.customer_id=c.id
    GROUP BY c.id ORDER BY c.name`).all());
});

app.get('/api/summary', (_req, res) => {
  const today = db.prepare(`SELECT COUNT(*) AS bookings, COALESCE(SUM(amount),0) AS revenue
    FROM appointments WHERE date(starts_at,'localtime')=date('now','localtime') AND status != 'cancelled'`).get();
  const customers = db.prepare('SELECT COUNT(*) AS count FROM customers').get().count;
  const completed = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS revenue
    FROM appointments WHERE status='completed' AND starts_at >= datetime('now','-30 days')`).get();
  const upcoming = db.prepare(`SELECT COUNT(*) AS count FROM appointments
    WHERE starts_at >= datetime('now','localtime') AND status='confirmed'`).get().count;
  res.json({ todayBookings: today.bookings, todayRevenue: today.revenue, totalCustomers: customers,
    completedThisMonth: completed.count, monthRevenue: completed.revenue, upcomingBookings: upcoming });
});

app.post('/api/appointments', (req, res) => {
  const { name, email, phone = '', service, startsAt, durationMinutes = 60, amount = 0, notes = '' } = req.body ?? {};
  if (![name, email, service, startsAt].every((v) => typeof v === 'string' && v.trim()))
    return res.status(400).json({ error: 'Name, email, service, and appointment time are required.' });
  if (Number.isNaN(Date.parse(startsAt))) return res.status(400).json({ error: 'Choose a valid appointment time.' });
  if (!Number.isFinite(Number(amount)) || Number(amount) < 0) return res.status(400).json({ error: 'Amount must be zero or more.' });
  try {
    let customer = db.prepare('SELECT id FROM customers WHERE email = ?').get(email.trim().toLowerCase());
    if (!customer) {
      const info = db.prepare('INSERT INTO customers (name,email,phone) VALUES (?,?,?)')
        .run(name.trim(), email.trim().toLowerCase(), phone.trim());
      customer = { id: info.lastInsertRowid };
    }
    const info = db.prepare(`INSERT INTO appointments (customer_id,service,starts_at,duration_minutes,amount,notes)
      VALUES (?,?,?,?,?,?)`).run(customer.id, service.trim(), new Date(startsAt).toISOString(),
      Math.max(15, Number(durationMinutes) || 60), Number(amount), notes.trim());
    res.status(201).json(db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(info.lastInsertRowid));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'That email address already exists with another customer.' });
    res.status(500).json({ error: 'Could not create the appointment.' });
  }
});

app.patch('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body ?? {};
  if (!['confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Choose a valid appointment status.' });
  const result = db.prepare('UPDATE appointments SET status=? WHERE id=?').run(status, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Appointment not found.' });
  res.json(db.prepare(`${appointmentSelect} WHERE a.id = ?`).get(req.params.id));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`StudioFlow API listening on http://localhost:${port}`));
