# Production foundation

## Current status

The existing app is a prototype: it uses a local SQLite file, seeds sample salon data, and has no authentication or tenant isolation. Do not expose it to real customers or store real customer information yet.

## Target first production release

- React + Vite frontend
- Node.js + Express API
- PostgreSQL database (Neon free tier for development / early validation)
- One studio account per tenant, with users and records scoped by `studio_id`
- Password hashes only; never store plaintext passwords
- Secure, HTTP-only session cookies; CSRF protection for state-changing requests
- Cloud hosting with HTTPS and secrets stored as environment variables

## Database

`server/schema.postgres.sql` is the initial multi-tenant PostgreSQL schema. It uses composite foreign keys to prevent an appointment from referencing a customer belonging to another studio.

Before production, implement and test:
1. Registration, login, logout, session expiry and password reset.
2. Authentication middleware and mandatory studio scoping on every data query.
3. Appointment overlap/conflict checks using the studio's timezone.
4. Input validation, rate limiting, security headers and audit logging.
5. A migration/import path for any real data (do not import demo seed records).
6. Automated backups and a restore test.

## Deployment

The Vercel Hobby account is not the recommended commercial hosting target. Use a commercial-permitted free-tier hosting provider for the first public release. Hosting and database free tiers have usage limits and can change; monitor usage before onboarding customers.

Do not mark the app production-ready until auth, tenant isolation, persistence, backups and API tests pass.
