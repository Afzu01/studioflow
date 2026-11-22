# StudioFlow

StudioFlow is an appointment and client-management workspace for independent salons and beauty studios.

## Current development status

The `production-foundation` branch contains the first authenticated multi-studio implementation:

- Salon-owner registration and sign-in.
- Password hashing with bcrypt.
- Server-side sessions stored in PostgreSQL; browser cookies are HTTP-only.
- Studio-scoped customer and appointment queries.
- PostgreSQL data model with tenant-aware foreign keys and indexes.
- Appointment overlap checks serialized per studio.
- Studio-local date/time handling for the dashboard, booking form, and monthly metrics.
- PostgreSQL-backed integration tests for registration, session enforcement, tenant isolation, malformed dates, and booking conflicts.
- Studio-local appointment scheduling and daily summaries (new studios default to Asia/Kolkata).
- Basic security headers, same-origin checks and sign-in rate limiting.

This is a development foundation, not a production launch. CI runs syntax checks, validation unit tests and a Vite production build, but the app has not yet been exercised against a provisioned PostgreSQL database. Do not use it with real customer data until the test and launch checklist below is complete.

## Requirements

- Node.js 20.6 or newer
- PostgreSQL 15 or newer (a managed PostgreSQL service such as Neon is suitable)
- npm

## Run locally

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your database connection string.
4. Generate a session secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Put the generated value in `SESSION_SECRET`. Never commit the real `.env` file.
5. Keep `APP_ORIGIN=http://localhost:5173` for local Vite development.
6. Apply the schema:

   ```bash
   psql "$DATABASE_URL" -f server/schema.postgres.sql
   ```

7. Install dependencies and start the app:

   ```bash
   npm install
   npm test
   npm run dev
   ```

Open the Vite URL shown in your terminal (normally `http://localhost:5173`). For a production-style run, execute `npm run build` and then `npm start`; Express serves the compiled frontend from `dist/`. Create a studio account from the registration screen. The generated studio slug is shown in the workspace sidebar; keep it safe because it is required for sign-in.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random secret, at least 32 characters |
| `APP_ORIGIN` | Exact browser origin allowed to make API mutations |
| `PORT` | API port; defaults to 4000 |
| `NODE_ENV` | Set to `production` in the hosted environment |

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database-backed health check |
| `POST` | `/api/auth/register` | Create a studio and its owner account |
| `POST` | `/api/auth/login` | Sign in using studio slug, email and password |
| `GET` | `/api/auth/me` | Return the current signed-in account |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/summary` | Studio dashboard metrics (authentication required) |
| `GET` | `/api/appointments` | Studio appointments (authentication required) |
| `POST` | `/api/appointments` | Create a studio appointment (authentication required) |
| `PATCH` | `/api/appointments/:id/status` | Update a studio appointment (authentication required) |
| `GET` | `/api/customers` | Studio customers (authentication required) |

## Before any public or commercial launch

- Run dependency installation, production build, linting and automated API tests (the CI workflow provisions a temporary PostgreSQL instance and runs the API integration suite).
- Test registration, login, logout, session expiry and password handling.
- Prove tenant isolation with two separate studios and attempt cross-studio reads and writes.
- Test appointment overlaps, simultaneous booking requests, invalid inputs and timezone boundaries.
- Add email verification, password reset, staff invitations and role-based permissions.
- Add a studio timezone setting and use it consistently for calendar display and reporting.
- Add database backups, restore drills, monitoring, error reporting and a migration process.
- Configure HTTPS, production secrets, trusted proxy settings, database connection limits and a permitted commercial hosting plan.
- Review privacy policy, terms, data retention and applicable customer-data obligations.

## Project structure

```text
src/App.jsx             React dashboard and owner authentication screens
src/styles.css          Responsive dashboard and authentication styles
server/index.js         Authenticated PostgreSQL API
server/auth.js          Registration, login, sessions and auth middleware
server/schema.postgres.sql PostgreSQL schema and session table
```
