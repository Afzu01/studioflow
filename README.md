# StudioFlow

StudioFlow is being developed as a **client-centric operations platform** that brings together client relationships, scheduling, tasks, follow-ups and automation in one workspace.

**Product vision:** one place where your calendar, clients, communications and workflows work together.

StudioFlow is intended for appointment- and relationship-driven professionals and small teams across industries—not only salons. Potential users include freelancers, consultants, agencies, coaches, tutors, clinics, wellness providers and other service businesses.

## Product direction

StudioFlow's long-term direction combines three capabilities:

1. **Client operations:** client profiles, relationship history, meetings, notes, tasks and follow-ups.
2. **Universal calendar:** a central scheduling experience that can connect to existing calendars rather than requiring users to replace them.
3. **AI operating layer:** natural-language assistance and permission-controlled automation across StudioFlow workflows.

The goal is to become the client-centric layer connecting a user's schedule with the people and business activities behind it.

### What StudioFlow aims to do

- Keep client and contact records connected to meetings and appointments.
- Manage appointments, tasks, availability and follow-up actions.
- Connect external calendars, with Google Calendar, Apple Calendar and Microsoft Outlook as intended integration targets.
- Provide workflow automation for reminders, follow-ups and routine operations.
- Add an AI assistant that can answer questions and carry out authorised actions.
- Support different business types through configurable services, fields, roles and workflows.
- Evolve toward international use with multiple time zones, locales and currencies.

**Important:** These are product goals, not claims that all features are currently implemented. Calendar synchronisation, Siri/voice actions, AI automation, payments and multi-industry templates are planned capabilities.

## Product principles and differentiation

StudioFlow is not intended to replace every calendar, CRM or automation platform. Its intended differentiation is the relationship context connecting them:

- **Client-centric context:** events can be associated with client records, notes, history and next steps.
- **Calendar interoperability:** integrate with calendars people already use.
- **Connected workflows:** turn meetings and client activity into reminders, tasks and follow-ups.
- **Actionable AI:** allow an assistant to work with real business data under explicit permissions and appropriate confirmation.
- **Configurable core:** support multiple service industries without creating a separate product for each one.
- **Open integrations:** provide APIs and webhooks so StudioFlow can work with other tools.

## Competitive landscape

StudioFlow operates across several established software categories. These companies are useful competitive benchmarks; they are not all direct, identical competitors.

| Category | Products to study | Relevant capabilities |
| --- | --- | --- |
| Calendar and scheduling | [Calendly](https://calendly.com/), [Motion](https://www.usemotion.com/), [Reclaim](https://reclaim.ai/), [Morgen](https://www.morgen.so/) | Scheduling, availability, calendar aggregation and planning |
| CRM and client operations | [HubSpot](https://www.hubspot.com/), [Zoho](https://www.zoho.com/), [Salesforce](https://www.salesforce.com/), [Dubsado](https://www.dubsado.com/) | Client records, relationship history, sales and business workflows |
| AI and automation | [Lindy](https://www.lindy.ai/), [Zapier](https://zapier.com/), [Make](https://www.make.com/) | AI agents, integrations and multi-step automation |
| Productivity ecosystems | [Google Workspace](https://workspace.google.com/), [Microsoft 365](https://www.microsoft.com/microsoft-365), [Apple](https://www.apple.com/) | Calendars, communication, identity and assistant experiences |

The initial strategy is not to out-feature large CRM or productivity suites. It is to deliver an excellent end-to-end workflow for independent professionals and small teams: connect a calendar, maintain a client profile, schedule a meeting and reliably manage the follow-up.

## Roadmap

The following is a proposed sequence. Dates and durations are planning estimates, not delivery commitments.

### Phase 1 — Functional core

- Complete client create, read, update and delete workflows.
- Complete appointment creation, editing, cancellation and status management.
- Add services, staff profiles and working hours.
- Implement availability checks and robust double-booking prevention.
- Build a useful dashboard and client-facing booking experience.
- Verify that all workflows persist correctly in PostgreSQL.

**Milestone:** a small business can manage its everyday client and appointment workflow.

### Phase 2 — Pilot readiness

- Add booking confirmations and configurable reminders.
- Build client history and follow-up tracking.
- Add basic business reports and CSV export.
- Improve mobile usability, error handling and accessibility.
- Establish backups, monitoring and operational support.

**Milestone:** a small group of pilot businesses can use StudioFlow with test or consented data and provide feedback.

### Phase 3 — Client operations platform

- Add tasks, notes and a unified client activity timeline.
- Add staff roles, permissions and resource availability.
- Support configurable business profiles, services and custom fields.
- Add multiple locations where needed.
- Define stable APIs and webhooks.

**Milestone:** different kinds of service businesses can configure the same platform without bespoke application code.

### Phase 4 — Calendar interoperability and global readiness

- Integrate Google Calendar.
- Investigate Apple Calendar interoperability and supported iOS integrations.
- Integrate Microsoft Outlook Calendar.
- Design reliable two-way synchronisation, conflict handling and event ownership.
- Support time zones, daylight-saving transitions, locale formats and multiple currencies.
- Review privacy, data export, deletion and regional compliance requirements.

**Milestone:** users can connect their existing calendars and manage client context through StudioFlow.

### Phase 5 — Automation and AI

- Build a workflow engine with triggers, conditions and actions.
- Add authorised reminders and follow-up automation.
- Introduce a natural-language assistant for StudioFlow data.
- Add approval steps for consequential actions.
- Explore Siri Shortcuts/App Intents, voice interfaces and other assistant integrations.
- Add analytics and useful business insights.

**Milestone:** StudioFlow can safely automate useful client and scheduling workflows, with users retaining control.

## Current development status

The `production-foundation` branch contains the first authenticated multi-studio implementation:

- Salon-owner registration and sign-in (the initial onboarding language is salon-oriented and will need to become industry-neutral).
- Password hashing with bcrypt.
- Server-side sessions stored in PostgreSQL; browser cookies are HTTP-only.
- Studio-scoped customer and appointment queries.
- PostgreSQL data model with tenant-aware foreign keys and indexes.
- Appointment overlap checks serialized per studio.
- Studio-local date/time handling for the dashboard, booking form, and monthly metrics.
- PostgreSQL-backed integration tests for registration, session enforcement, tenant isolation, malformed dates, and booking conflicts.
- Studio-local appointment scheduling and daily summaries (new studios default to Asia/Kolkata).
- Basic security headers, same-origin checks and sign-in rate limiting.

The project is an early development foundation and hosted preview, **not a production-ready launch**. The initial schema has been applied to the Neon preview database and a test studio account was successfully created. That does not constitute a complete production security, reliability or end-to-end validation review. Do not use the preview with real customer data.

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
- Complete end-to-end tests of the real booking and client workflows.
- Review external calendar OAuth scopes, token storage, synchronisation conflicts and revocation before enabling calendar integrations.
- Add clear AI permissions, audit logs, confirmation steps and safeguards before AI can perform business actions.

## Project structure

```text
src/App.jsx             React dashboard and owner authentication screens
src/styles.css          Responsive dashboard and authentication styles
server/index.js         Authenticated PostgreSQL API
server/auth.js          Registration, login, sessions and auth middleware
server/schema.postgres.sql PostgreSQL schema and session table
```

## Optional hosted preview (not production)

A `render.yaml` Blueprint is included for a free preview service on the `production-foundation` branch.

1. Create a Neon PostgreSQL project for testing and copy its pooled or direct connection string.
2. In Render, create a new Blueprint and select this repository and the `production-foundation` branch.
3. When prompted, set `DATABASE_URL` to the Neon connection string. Render generates `SESSION_SECRET`.
4. After Render creates the service, copy its `onrender.com` URL into `APP_ORIGIN` exactly (scheme included, no trailing slash), then redeploy.
5. Open the service URL and create a test studio account.

This is only a preview. Render Free web services sleep after 15 minutes of inactivity and Render explicitly says not to use Free instances for production applications. Do not put real customer data into the preview. A production launch needs a suitable paid hosting plan, managed database safeguards, backups, and a final security review.
