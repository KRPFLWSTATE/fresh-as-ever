# Vercel deployment — Fresh As Ever (web / PWA)

This repo (`fresh-as-ever`) is the Next.js app that belongs on Vercel. Mobile (`fresh-as-ever-mobile`) is **not** deployed to Vercel; it only calls this host via `API_BASE_URL`.

## Current account state

| Item | Value |
|------|--------|
| Vercel team | `krpflwstates-projects` (`team_KxCEyLOfZ97GN8gTIM21W0rN`) |
| Vercel projects | **None yet** — first deploy creates `fresh-as-ever` (or your chosen name) |
| Local link | No `.vercel/` directory in repo yet |

The Vercel MCP can list teams/projects and inspect deployments **after** a project exists. It does not create projects or set environment variables by itself; use the dashboard or CLI below.

## Option A — Git integration (recommended)

1. Push `fresh-as-ever` to GitHub (or connect the monorepo with **Root Directory** = `fresh-as-ever`).
2. [vercel.com/new](https://vercel.com/new) → Import repository → Framework **Next.js** (auto-detected).
3. **Settings → Environment Variables** — add every variable from [`.env.example`](../.env.example) for **Production** and **Preview** (see table below).
4. Deploy. Note the URLs:
   - Production: `https://fresh-as-ever.vercel.app` or your custom domain (e.g. `https://freshasever.com`)
   - Preview: `https://fresh-as-ever-<branch>-<team>.vercel.app`

## Option B — Vercel CLI

```bash
cd fresh-as-ever
npx vercel@latest login    # one-time browser auth
npx vercel@latest link       # pick team krpflwstates-projects
npx vercel@latest env pull   # optional: pull dashboard vars to .env.local
npx vercel@latest --prod     # production deploy
```

## Environment variables (Vercel dashboard)

| Variable | Environments | Secret? | Used by |
|----------|----------------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | No | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | No | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Yes** | PayHere webhook, staff invite API |
| `GOOGLE_MAPS_API_KEY` | Production, Preview | **Yes** | `/api/location/*` |
| `NEXT_PUBLIC_PAYHERE_MERCHANT_ID` | Production, Preview | No | `/api/payhere/hash` |
| `PAYHERE_SECRET` | Production, Preview | **Yes** | PayHere hash + webhook |

**Do not** set `TESTING_ENV` in Production.

**Dev vs prod Supabase:** Today `.env.local` points at project `odkbpeelvcdmlimdflbr` (treat as **dev**). Before public launch, create a **production** Supabase project and use those URLs/keys only on Vercel **Production**. See [`agent-launch-continuity.md`](./agent-launch-continuity.md).

Legacy names in old `.env.local` files (`PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`) still work via fallbacks in API routes, but prefer the names in `.env.example`.

## After first production URL exists

Replace `YOUR_LIVE_DOMAIN` with the real HTTPS origin (no trailing slash).

### 1. Supabase → Authentication → URL configuration

| Field | Value |
|-------|--------|
| Site URL | `https://YOUR_LIVE_DOMAIN` |
| Redirect URLs | `https://YOUR_LIVE_DOMAIN/auth/callback` |
| | `http://localhost:3000/auth/callback` (dev) |
| | `freshasever://auth/callback` (mobile) |

### 2. PayHere merchant dashboard

| Setting | Value |
|---------|--------|
| Notify URL | `https://YOUR_LIVE_DOMAIN/api/payhere/webhook` |
| Return / cancel URLs | As required by PayHere (often web checkout pages on same host) |

### 3. Mobile `.env`

```bash
API_BASE_URL=https://YOUR_LIVE_DOMAIN
```

Rebuild the app after changing. See `fresh-as-ever-mobile/docs/migration/HOSTED_API.md`.

### 4. Google Cloud (Maps + OAuth)

- Restrict the Maps API key to your Vercel domain(s) + localhost.
- OAuth authorized redirect URIs must include Supabase callback and app redirects (see `docs/SOCIAL_AUTH_SETUP.md` on mobile).

## Verify deployment

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://YOUR_LIVE_DOMAIN/
curl -sS "https://YOUR_LIVE_DOMAIN/api/location/search?q=Colombo" -H "Authorization: Bearer <token>"
```

Use Vercel MCP or dashboard: **Deployments** → build logs if the build fails.

## Custom domain

1. Vercel → Project → **Domains** → Add `freshasever.com` (and `www` if needed).
2. DNS records per Vercel instructions.
3. Re-run the Supabase / PayHere / mobile steps with the final domain.

## What Vercel hosts in this stack

- Customer, merchant, and admin web UI + PWA (Serwist)
- `/auth/callback` (OAuth code exchange)
- `/api/payhere/hash`, `/api/payhere/webhook`
- `/api/location/search`, `/api/location/reverse`
- `/api/merchant/invite-staff`

Supabase stays on Supabase; the mobile app stays on App Store / Play (Expo); Twilio (if enabled) is configured inside Supabase Auth, not in this repo.
