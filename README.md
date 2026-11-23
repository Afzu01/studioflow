<div align="center">

# ✨ StudioFlow

### Your studio, in sync.

A studio management dashboard for appointments, clients, and the everyday rhythm of a service business.

**React · Express · SQLite**

</div>

---

## Product preview

StudioFlow brings a studio's daily operations into one workspace—from the appointment schedule to a quick overview of bookings, revenue, and clients.

### Overview dashboard

<!-- Add the dashboard screenshot at docs/images/dashboard.png -->
![StudioFlow overview dashboard](docs/images/dashboard.png)

### Appointment management

<!-- Add the appointments screenshot at docs/images/appointments.png -->
![StudioFlow appointment management](docs/images/appointments.png)

## What StudioFlow does

- **Daily overview** — see today's bookings, revenue, client count, and appointment activity.
- **Appointment management** — create bookings, search clients and services, filter by status, and export appointments.
- **Client management** — keep client information and booking history together.
- **Studio-focused workspace** — organize the day-to-day work of a small service business in one place.

## Built with

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express |
| Database | SQLite |

## Run locally

**Requirements:** Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the Vite address shown in your terminal (usually `http://localhost:5173`). The Express API runs at `http://localhost:4000`. SQLite creates `server/data/studioflow.sqlite` on first run and seeds sample clients and appointments.

To build the frontend:

```bash
npm run build
```

To serve only the API:

```bash
npm start
```

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

## Development notes

The project demonstrates a responsive React dashboard, an Express REST API, a relational data model for clients and appointments, appointment creation and validation, search and status filtering, CSV export, and a Vite development proxy.

For a real studio deployment, the next areas to address include authentication and role-based permissions, timezone-aware scheduling and conflict checks, request rate limiting, automated backups, database migrations, and payment processing. Secrets should be kept in environment variables and the application served over HTTPS.

---

<div align="center">

**StudioFlow** · Made with care for studios.

</div>
