# Production foundation

## Current status

The `production-foundation` branch now replaces the original SQLite demo backend with PostgreSQL and connects the dashboard to salon-owner registration and sign-in.

Implemented in this branch:
- PostgreSQL schema for studios, users, customers, appointments and server-side sessions.
- Owner registration, login, logout and current-session endpoints.
- Password hashing, HTTP-only cookies, session rotation and rate limiting.
- Tenant-scoped API reads and writes using the authenticated user's studio ID.
- Appointment overlap checks protected by a per-studio transaction lock.
- Security headers, same-origin checks and basic input validation.
- A CI workflow for syntax checks and the frontend production build.

This work is **not production-ready yet**. A PostgreSQL instance has not been provisioned or tested, and database-backed automated tests, timezone configuration, account recovery and launch operations remain incomplete. Do not use real customer data.

## Target first release

- React + Vite frontend
- Node.js + Express API
- PostgreSQL database (a managed service can be used for development)
- One studio account per tenant, with every record scoped by `studio_id`
- Password hashes only; never store plaintext passwords
- Secure, HTTP-only server-side sessions
- Same-origin protection for state-changing requests
- Cloud hosting with HTTPS and secrets stored as environment variables

## Database

Apply `server/schema.postgres.sql` to a new PostgreSQL database. The schema uses composite foreign keys to prevent appointments from referencing customers belonging to another studio.

## Remaining before production

1. Provision PostgreSQL and run the app end-to-end.
2. Confirm the GitHub Actions build succeeds.
3. Add automated API tests for registration, login, logout, session expiry, validation and booking conflicts.
4. Prove tenant isolation with two studios and cross-tenant attack tests.
5. Add email verification, password reset, staff invitations and role-based permissions.
6. Add studio timezone settings and test date boundaries and daylight-saving transitions.
7. Add audit logs, automated backups, restore drills, monitoring and error reporting.
8. Review privacy policy, terms and applicable customer-data obligations.

## Deployment

The Vercel Hobby account is not the recommended commercial hosting target. Use a hosting plan that permits commercial use. Free tiers have usage limits and can change; monitor usage before onboarding customers.

Do not merge or deploy as a public commercial service until the test, security and operational checklist is complete.
