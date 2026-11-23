# StudioFlow

I'm building StudioFlow to make it easier to manage clients, appointments, and the work around them.

The project started with client and appointment management. I want to build on that by bringing calendars, notes, tasks, and follow-ups into one place. Later, I'd like to explore automation and an AI assistant. The goal is to make it useful for different kinds of service businesses, not only salons.

StudioFlow is still a work in progress. The ideas in this README are not all finished features.

## What I'm building

- Client profiles and appointment management.
- Notes, tasks, and follow-ups connected to client activity.
- Calendar connections, starting with services such as Google Calendar and Outlook.
- Automation for routine reminders and follow-up work.
- An AI assistant that can help with everyday work while keeping important actions under the user's control.

I don't want to build another calendar or CRM that tries to replace every tool. I want StudioFlow to connect a person's schedule with the client information and work that comes with it.

## Current progress

The `production-foundation` branch contains the backend and authentication work I'm doing now.

So far, it includes:

- Owner registration and sign-in.
- Password hashing with bcrypt.
- Server-side sessions stored in PostgreSQL.
- Studio-scoped customer and appointment API routes.
- A PostgreSQL schema with tenant-aware relationships and indexes.
- Appointment overlap checks to prevent double-booking.
- Studio-local date and time handling in the dashboard and booking flow.
- Basic security headers, same-origin checks, and sign-in rate limiting.
- API integration tests using a temporary PostgreSQL database.

I've tested the initial signup and database setup on the hosted preview. The dashboard and some workflows are still incomplete. This is an early development version, not a production-ready application. Please don't use it with real customer data.

## What I'm learning

While building StudioFlow, I'm working through backend development, authentication, PostgreSQL database design, keeping each studio's data separate, appointment scheduling, time zones, and API testing. I'm learning these by implementing them in the project rather than treating them as separate exercises.

## What's next

My next focus is to finish the basic client and appointment workflows, make the dashboard more useful on mobile, and add client notes and follow-ups. After that, I want to work on external calendar connections. Automation and AI will come later, once the core workflows are reliable.

## Tech stack

- React and Vite
- Node.js and Express
- PostgreSQL
- JavaScript

## Requirements

- Node.js 20.6 or newer
- PostgreSQL 15 or newer (a managed PostgreSQL service such as Neon is suitable)
- npm

## Run locally

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your database connection string.
4. Generate a session secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Put the generated value in `SESSION_SECRET`. Never commit your real `.env` file.
5. Keep `APP_ORIGIN=http://localhost:5173` for local Vite development.
6. Apply the database schema:

   ```bash
   psql "$DATABASE_URL" -f server/schema.postgres.sql
   ```

7. Install dependencies, run the tests, and start the app:

   ```bash
   npm install
   npm test
   npm run dev
   ```

Open the Vite URL shown in your terminal (normally `http://localhost:5173`). To run the production build locally, use `npm run build` followed by `npm start`.

Create a studio account from the registration screen. The generated studio slug is shown in the workspace sidebar and is needed when signing in.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random secret, at least 32 characters |
| `APP_ORIGIN` | Exact browser origin allowed to make API mutations |
| `PORT` | API port; defaults to 4000 |
| `NODE_ENV` | Set to `production` in the hosted environment |

## API routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Database-backed health check |
| `POST` | `/api/auth/register` | Create a studio and its owner account |
| `POST` | `/api/auth/login` | Sign in using studio slug, email, and password |
| `GET` | `/api/auth/me` | Return the current signed-in account |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/summary` | Studio dashboard metrics (authentication required) |
| `GET` | `/api/appointments` | Studio appointments (authentication required) |
| `POST` | `/api/appointments` | Create a studio appointment (authentication required) |
| `PATCH` | `/api/appointments/:id/status` | Update a studio appointment (authentication required) |
| `GET` | `/api/customers` | Studio customers (authentication required) |

## Before a real launch

There's still important work before I can ask businesses to rely on StudioFlow:

- Finish and test the client and appointment workflows.
- Test that studios cannot access each other's data.
- Test simultaneous bookings and time zone edge cases.
- Add account recovery, email verification, staff invitations, and permissions.
- Set up database backups, monitoring, and restore testing.
- Review hosting, security, privacy, and data handling.
- Test the full booking and client workflows.
- Review calendar permissions and sync behaviour before enabling integrations.
- Add permission checks and confirmations before an AI assistant can take actions.

The GitHub Actions workflow runs the API integration tests against PostgreSQL and builds the frontend.

## Project structure

```text
src/App.jsx                  React dashboard and owner authentication screens
src/styles.css               Dashboard and authentication styles
server/index.js              Authenticated PostgreSQL API
server/auth.js               Registration, login, sessions and auth middleware
server/schema.postgres.sql   PostgreSQL schema and session table
```

## Hosted preview

A `render.yaml` Blueprint is included for a preview deployment on the `production-foundation` branch.

1. Create a Neon PostgreSQL project for testing and copy its connection string.
2. In Render, create a Blueprint using this repository and the `production-foundation` branch.
3. Set `DATABASE_URL` to the Neon connection string. Render generates `SESSION_SECRET`.
4. After the service is created, set `APP_ORIGIN` to the Render service URL exactly, including `https://` and without a trailing slash. Then redeploy.
5. Open the service URL and create a test studio account.

This is only a preview. Render Free services can sleep after inactivity, so the first request may take a while. Use test data only; don't enter real customer information.

---

I'm building StudioFlow in public. I'll keep updating this README as the code and the project change.
