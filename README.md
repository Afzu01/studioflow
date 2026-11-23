# StudioFlow

StudioFlow is a client and appointment management project I'm developing. I started with the idea of keeping client details and appointments in one place. I want to build it further so that calendars, notes, tasks, and follow-ups can work together too.

The longer-term idea is to make StudioFlow useful for different kinds of service businesses, not just salons. Calendar integrations, automation, and AI assistance are part of that direction, but they are not finished features yet.

## What the project is aiming for

- Manage client profiles and appointments.
- Keep notes, tasks, and follow-ups connected to client activity.
- Connect external calendars such as Google Calendar and Outlook.
- Automate routine reminders and follow-up tasks.
- Explore an AI assistant for everyday business tasks, with users staying in control of important actions.

I don't want StudioFlow to replace every calendar or CRM. I want it to connect the schedule with the client information and work around it.

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

- React and Vite
- Node.js and Express
- PostgreSQL
- JavaScript

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
| `PATCH` | `/api/appointments/:id/status` | Update a studio appointment (authentication required) |
| `GET` | `/api/customers` | Studio customers (authentication required) |

## Next steps

- Finish the client and appointment workflows.
- Improve the dashboard and mobile experience.
- Add client notes, history, tasks, and follow-ups.
- Make the setup work for different kinds of service businesses.
- Work on external calendar connections and sync handling.
- Explore workflow automation and AI assistance after the core features are reliable.

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

## Hosted preview

A `render.yaml` Blueprint is included for a preview deployment on the `production-foundation` branch.

1. Create a Neon PostgreSQL project for testing and copy its connection string.
2. In Render, create a Blueprint using this repository and the `production-foundation` branch.
3. Set `DATABASE_URL` to the Neon connection string. Render generates `SESSION_SECRET`.
4. After the service is created, set `APP_ORIGIN` to the Render service URL exactly, including `https://` and without a trailing slash. Then redeploy.
5. Open the service URL and create a test studio account.

This is a preview deployment, not production hosting. Render Free services can sleep after inactivity, so the first request may take a while. Use test data only; don't enter real customer information.
