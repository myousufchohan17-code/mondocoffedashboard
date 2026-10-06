# MondoCoffee — Restaurant Kitchen Dashboard

Staff dashboard for the **MondoCoffee** brand. Customer home + digital menu live in a
separate project; this app is the kitchen/staff side and talks to the same
PostgreSQL database so menu orders land on the dashboard.

## Stack

- **Next.js 16** (App Router) — UI + API routes, no separate backend
- **Auth.js v5** — credentials login with JWT sessions
- **Prisma 6** + **Neon PostgreSQL**
- **Tailwind CSS v4**

## Run locally

```bash
npm install
cp frontend/.env.example frontend/.env      # set DATABASE_URL
npm run dev                                 # http://localhost:3001
```

Database setup:

```bash
npm run db:push     # sync schema
npm run db:seed     # demo restaurant, admin user, tables, menu
```

To provision the requested admin account without clearing or adding demo data,
set the password in your shell and run:

```powershell
$env:ADMIN_PASSWORD="mondo123"
npm run db:admin
```

This updates or creates `admin@mondo.com` for the existing `MondoCoffee`
restaurant. Set `ADMIN_RESTAURANT_SLUG` if the restaurant uses a different
slug. Do not use `db:seed` on an existing database: that command resets its
data.

## Admin login

| Email               | Password    |
| ------------------- | ----------- |
| `admin@mondo.com`   | `mondo123` |

The admin password is bcrypt-hashed in PostgreSQL. Run `db:admin` once against
the target database before signing in.

Production: **https://MondoCoffee-soft.vercel.app**

## Environment

`frontend/.env` holds `DATABASE_URL` so both the Prisma CLI and Next.js resolve
the same value. `frontend/.env.local` holds the rest.

| Variable              | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | Neon PostgreSQL connection string                     |
| `AUTH_SECRET`         | Session JWT signing secret (`npx auth secret`)        |
| `AUTH_URL`            | Canonical app URL (Vercel sets this automatically)    |
| `AUTH_TRUST_HOST`     | Trust `X-Forwarded-Host` behind Vercel                |
| `REPORTS_PIN`         | PIN guarding the Reports page                         |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app                                |
| `NEXT_PUBLIC_DIGITAL_MENU_URL` | Deployed Digital Menu URL                    |

The dashboard and Prisma use the PostgreSQL `DATABASE_URL` only on the server.
Set it in `frontend/.env` for local development and in Vercel Project Settings
for deployment. The URL must start with `postgresql://` or `postgres://`;
percent-encode reserved characters in the username or password. Do not use a
`NEXT_PUBLIC_` prefix for database credentials.

## Notes

- `DATABASE_URL` omits `channel_binding=require` — Prisma's Postgres connector
  does not implement channel binding and fails with `P1001`.
- `connect_timeout` / `pool_timeout` are raised above Prisma's 10s defaults
  because the TLS handshake through the Neon pooler regularly exceeds it.
- `src/lib/prisma.ts` retries transient connection errors
  (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`, `P2028`) and
  `src/instrumentation.ts` opens the pool at boot, so serverless cold starts do
  not fail the first request.
- Printer configurations are restaurant-scoped in PostgreSQL. Run `npm run
  db:push` when deploying schema changes. Browser printing opens the system
  print dialog; this web app and its desktop wrapper do not expose a local USB
  or network-printer bridge, and browsers do not allow installed-printer
  discovery from ordinary web pages.

## Desktop

`desktop/` packages the dashboard as a Windows Electron app.
`npm run icons` in `desktop/` regenerates the Windows icons from `frontend/public/logo.png`.
