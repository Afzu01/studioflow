# StudioFlow

A full-stack appointment and client management dashboard for a boutique beauty studio. StudioFlow gives a small service business a clear daily schedule, client history, and a lightweight view of studio performance.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the Vite address shown in your terminal (usually `http://localhost:5173`). The Express API runs at `http://localhost:4000`. SQLite creates `server/data/studioflow.sqlite` on first run and seeds a handful of sample clients and appointments. To build the frontend, run `npm run build`. To serve only the API, run `npm start`.

## What it demonstrates

- Responsive React dashboard with overview, appointment, and client views.
- Express REST API for dashboard metrics, clients, bookings, and booking status updates.
- SQLite relational data model for clients and appointments, with indexed dates and foreign keys.
- Appointment creation with client lookup by email, validation, and useful API errors.
- Search, status filtering, CSV export, and appointment completion.
- Vite development proxy so the UI can call the API at `/api` without extra setup.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health |
| `GET` | `/api/summary` | Dashboard metrics |
| `GET` | `/api/appointments?status=confirmed&search=Olivia` | Search and filter bookings |
| `POST` | `/api/appointments` | Add a booking and create or reuse its client |
| `PATCH` | `/api/appointments/:id/status` | Mark a booking confirmed, completed, or cancelled |
| `GET` | `/api/customers` | Client list and lifetime booking value |

`POST /api/appointments` accepts `name`, `email`, `service`, and `startsAt`; `phone`, `durationMinutes`, `amount`, and `notes` are optional. `startsAt` should be an ISO date-time string.

## Project structure

```text
src/                 React application and responsive styles
server/index.js      Express API, SQLite schema, demo data
vite.config.js       React plugin and local API proxy
```

## Interview walkthrough

Start with the dashboard: it combines small-business KPIs with the actual day schedule. Add an appointment to show the full request path from a React form through Express validation into SQLite. Then complete a booking and show how the refreshed summary and client history are derived from relational data. The project is intentionally small enough to explain in a short interview while covering the job description’s frontend, backend, API, database, and deployment fundamentals.

## Production next steps

For a real studio: add sign-in and role-based permissions, timezone-aware scheduling and conflict checks, request rate limiting, automated backups, migrations, and payment processing. Keep secrets in environment variables and serve behind HTTPS.
