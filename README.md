<div align="center">

# StudioFlow

### Your studio, in sync.

A management app for businesses that work with appointments, clients, and services.

**React · Vite · Express · SQLite**

</div>

---

## About the project

I started StudioFlow as a way to build a practical booking and client-management application. I wanted the core workflow to work for different appointment-based businesses, rather than tying it to one industry.

The current app brings appointment scheduling, client records, and a business overview into one interface. The examples and seeded records are for demonstration.

## What is implemented

- **Overview** — dashboard metrics for bookings, revenue, clients, and upcoming appointments.
- **Appointments** — create bookings, search and filter records, and update appointment status.
- **Clients** — view client details, booking counts, and completed booking value.
- **Local persistence** — store clients and appointments in SQLite.
- **CSV export** — export appointment data from the interface.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express |
| Database | SQLite through better-sqlite3 |
| UI icons | lucide-react |

## Run locally

**Requirements:** Node.js 20 or newer.

Install dependencies:

```bash
npm install
```

Start the frontend and API together:

```bash
npm run dev
```

Open the Vite address shown in the terminal (usually http://localhost:5173). The API runs at http://localhost:4000.

The SQLite database is created at `server/data/studioflow.sqlite` on first run. The server seeds sample clients and appointments when the database has no clients.

Build the frontend:

```bash
npm run build
```

Start only the API:

```bash
npm start
```

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health response |
| `GET` | `/api/summary` | Dashboard metrics |
| `GET` | `/api/appointments` | List appointments; supports status, search, and day filters |
| `POST` | `/api/appointments` | Create an appointment and create or reuse its client |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status |
| `GET` | `/api/customers` | List clients with booking and completed-value totals |

For appointment creation, the API accepts `name`, `email`, `service`, and `startsAt`. Optional fields include `phone`, `durationMinutes`, `amount`, and `notes`. Use an ISO date-time string for `startsAt`.

## Project structure

```text
src/                 React application and styles
server/index.js      Express API, SQLite schema, and sample data
vite.config.js       Vite configuration and local API proxy
```

## Development notes

The code includes a local SQLite data store and sample data. This is currently a local application setup; authentication, role-based permissions, timezone-aware scheduling, booking conflict checks, backups, and payment processing are not implemented as production safeguards.

I have not recorded automated test results or a production deployment for this repository.

## Possible next steps

- Add authentication and role-based access.
- Add timezone-aware booking and availability conflict checks.
- Add database migrations and automated backups.
- Add API and UI tests.
- Review security and deployment configuration before using real customer data.

---

<div align="center">

**StudioFlow** · Built by Afzal Hussain

</div>
