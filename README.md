<div align="center">

# ✨ StudioFlow

### Your studio, in sync.

A studio management platform for keeping appointments, clients, and daily operations connected.

**React · Vite · Node.js · Express · PostgreSQL**

</div>

---

## The product

StudioFlow is a client and appointment management project I'm developing. It brings the day-to-day work of a service business into one workspace, starting with studio appointments and client management.

The longer-term goal is to connect schedules, client context, notes, tasks, and follow-ups—so studio owners can spend less time coordinating their work and more time looking after their clients.

## Product preview

StudioFlow currently includes an overview dashboard and an appointment management workspace.

> **Screenshots:** The dashboard and appointments screenshots are being prepared for this repository. They will be added here as committed image assets so the preview displays directly on GitHub.

## What I'm building

| Area | Direction |
| --- | --- |
| **Appointments** | Create and manage studio bookings, with safeguards against overlapping appointments. |
| **Clients** | Keep customer information connected to studio activity. |
| **Studio dashboard** | Surface daily bookings, revenue, client totals, and appointment activity. |
| **Reports** | Give studio owners a clearer view of business activity. |
| **Connected workflows** | Explore notes, tasks, reminders, and follow-ups alongside client and appointment information. |

Calendar integrations, workflow automation, and AI assistance are part of the longer-term direction; they are not finished features yet.

## Current development

The `production-foundation` branch contains the current backend and authentication foundation.

Implemented in this branch:

- Owner registration and sign-in.
- Password hashing with bcrypt.
- Server-side sessions stored in PostgreSQL.
- Studio-scoped customer and appointment API routes.
- PostgreSQL schema with tenant-aware relationships and indexes.
- Appointment overlap checks to prevent double-booking.
- Studio-local date and time handling in the dashboard and booking flow.
- Basic security headers, same-origin checks, and sign-in rate limiting.
- API integration tests using a temporary PostgreSQL database.

The dashboard and some client and appointment workflows still need work. This is an early development version and is not ready for real customer data or production use.

## Tech stack

- **Frontend:** React, Vite, JavaScript
- **Backend:** Node.js, Express
- **Database:** PostgreSQL

## Getting started

### Requirements

- Node.js 20.6 or newer
- PostgreSQL 15 or newer (a managed PostgreSQL service such as Neon is suitable)
- npm

### Run locally

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

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). To run the production build locally, use `npm run build` followed by `npm start`.

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
| `PATCH` | `/api/appointments/:id/status` | Update an appointment status (authentication required) |
| `GET` | `/api/customers` | Studio customers (authentication required) |

## Hosted preview

A Render Blueprint is included for deploying a preview of StudioFlow from the `production-foundation` branch.

1. Create a separate PostgreSQL database for preview testing with a managed provider such as [Neon](https://neon.tech/).
2. In Render, create a Blueprint using this repository and the `production-foundation` branch.
3. Configure `DATABASE_URL` with the preview database connection string. Render generates `SESSION_SECRET`.
4. After the service is created, set `APP_ORIGIN` to the exact Render service URL, including `https://` and without a trailing slash. Then redeploy.
5. Open the service URL and create a test studio account.

This is a preview deployment, not production hosting. Render Free services can sleep after inactivity, so the first request may take a while. Use test data only; don't enter real customer information.

## Development and testing

The GitHub Actions workflow runs the API integration tests against PostgreSQL and builds the frontend.

Before using StudioFlow with real businesses, the remaining work includes more complete workflow and tenant-isolation testing, account recovery, staff permissions, database backups and restore testing, monitoring, and privacy and security reviews. Calendar integrations and AI actions will also need permission handling and appropriate safeguards.

## Project structure

```text
src/App.jsx                  React dashboard and owner authentication screens
src/styles.css               Dashboard and authentication styles
server/index.js              Authenticated PostgreSQL API
server/auth.js               Registration, login, sessions and auth middleware
server/schema.postgres.sql   PostgreSQL schema and session table
```

## What's next

- Finish the client and appointment workflows.
- Improve the dashboard and mobile experience.
- Add client notes, history, tasks, and follow-ups.
- Make the setup work for different kinds of service businesses.
- Work on external calendar connections and sync handling.
- Explore workflow automation and AI assistance after the core features are reliable.

---

<div align="center">

**StudioFlow** · Built with care for studios.

</div>
