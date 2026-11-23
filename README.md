# StudioFlow

StudioFlow is a project I'm building to make it easier to manage clients, appointments, and the work that happens around them.

I started with appointment and client management. Over time, I want to bring calendars, notes, tasks, follow-ups, and useful automation into the same workspace. The aim is to make StudioFlow useful for different kinds of service businesses, not just salons.

This project is still a work in progress. Some of the ideas below are plans, not finished features.

## What I want to build

- Manage clients and keep their information in one place.
- Create and manage appointments.
- Connect appointments with client notes, tasks, and follow-ups.
- Connect calendars people already use, such as Google Calendar and Outlook.
- Add automation for routine reminders and follow-up work.
- Explore an AI assistant that can help with everyday tasks, with the user in control of important actions.

I don't want StudioFlow to become another calendar or CRM that tries to replace every tool. I want it to connect the schedule with the client information and work that comes with it.

## What's working so far

The `production-foundation` branch is where I'm building the backend and authentication foundation.

Current implementation includes:

- Owner registration and sign-in.
- Password hashing with bcrypt.
- Server-side sessions stored in PostgreSQL.
- Studio-scoped customer and appointment API routes.
- A PostgreSQL schema with tenant-aware relationships and indexes.
- Appointment overlap checks to prevent double-booking.
- Studio-local date and time handling in the dashboard and booking flow.
- Basic security headers, same-origin checks, and sign-in rate limiting.
- API integration tests using a temporary PostgreSQL database.

The first signup and database setup have been tested on the hosted preview. The app is still early: not every dashboard screen or workflow is complete, and this is not ready for real customer data or production use.

## What I'm working towards

These are the next areas I want to work on. They are not all implemented yet.

1. Finish the basic client and appointment workflows.
2. Make the dashboard and booking experience more useful on mobile.
3. Add client notes, history, tasks, and follow-ups.
4. Make StudioFlow work for different types of service businesses.
5. Connect external calendars and handle sync conflicts properly.
6. Add workflow automation and, later, an AI assistant.

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

Open the Vite URL shown in your terminal (normally `http://localhost:5173`). For a production-style run, execute `npm run build` and then `npm start`; Express serves the compiled frontend from `dist/`.

Create a studio account from the registration screen. The generated studio slug is shown in the workspace sidebar; keep it safe because it is required for sign-in.

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

## Before using this with real businesses

There is still work to do before a public or commercial launch:

- Finish and test the main client and appointment workflows.
- Test registration, login, logout, session expiry, and password handling.
- Test that one studio cannot access another studio's data.
- Test simultaneous bookings and timezone edge cases.
- Add email verification, password reset, staff invitations, and permissions.
- Set up database backups and test restoring them.
- Add monitoring and error reporting.
- Review hosting, HTTPS, secrets, and database settings.
- Prepare a privacy policy and terms.
- Test the complete booking and client workflows.
- Review calendar permissions and sync behaviour before adding calendar integrations.
- Add permission checks and confirmations before an AI assistant can take actions.

The CI workflow runs the API integration tests against PostgreSQL and builds the frontend.

## Project structure

```text
src/App.jsx                  React dashboard and owner authentication screens
src/styles.css               Responsive dashboard and authentication styles
server/index.js              Authenticated PostgreSQL API
server/auth.js               Registration, login, sessions and auth middleware
server/schema.postgres.sql   PostgreSQL schema and session table
```

## Hosted preview

A `render.yaml` Blueprint is included for a preview deployment on the `production-foundation` branch.

1. Create a Neon PostgreSQL project for testing and copy its connection string.
2. In Render, create a new Blueprint and select this repository and the `production-foundation` branch.
3. Set `DATABASE_URL` to the Neon connection string. Render generates `SESSION_SECRET`.
4. After Render creates the service, copy its `onrender.com` URL into `APP_ORIGIN` exactly (include `https://`, with no trailing slash), then redeploy.
5. Open the service URL and create a test studio account.

This is a preview deployment, not production hosting. Render Free services can sleep after inactivity, and the preview should only be used with test data. Don't enter real customer information.

---

I'm building StudioFlow in public and will update this README as the project changes.
