# SciDraft Codebase Overview

## Architecture
- Frontend: Vite + React SPA in `src/` with React Router and Tailwind CSS. Entry in `src/App.tsx` and `src/main.tsx`.
- Backend: Express app in `api/` for local and serverless use. Server entry `api/server.js`; serverless entry `api/index.js`.
- Data Layer: Supabase used client-side (`src/lib/supabase.ts`) and server-side (`lib/server/supabase.cjs`).
- AI Layer: Gemini via `@google/generative-ai` used in `api/generate-draft.ts` and `api/generate-full-report.js` with JSON normalization and validation.
- Payments: M-Pesa STK push flow implemented in `api/payments/mpesa.ts`.
- Deployment: Vercel SPA routing via `vercel.json`; `.vercelignore` currently excludes `api/`.

## Frontend Structure
- Routing: `src/App.tsx` defines public and admin routes. Auth guards removed, pages are publicly accessible (`src/App.tsx:34-76`).
- Pages:
  - Landing: `src/pages/LandingPage.tsx`
  - Templates: `src/pages/Templates.tsx`
  - New Report flow: `src/pages/NewReport.tsx`
  - Draft Viewer: `src/pages/DraftViewer.tsx`
  - Payment: `src/pages/Payment.tsx`
  - Admin suite: `src/pages/admin/*` including `AdminDashboard`, `AdminUsers`, `AdminReports`, `AdminPayments`, `AdminPrompts`, `AdminAdmins`, `AdminNotifications`, `AdminSystemSettings`, `AdminReportDetails`.
- Supabase client: `src/lib/supabase.ts` initializes with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; falls back to a dummy client if missing (`src/lib/supabase.ts:8-31`).
- Dev server proxy: `/api` proxied to `http://localhost:3000` (`vite.config.ts:26-42`).

## Backend Structure
- App setup: `api/app.js` mounts only templates router (`api/app.js:13,30`) and intentionally disables other routers to avoid TypeScript runtime issues (`api/app.js:14`). 404 handler returns JSON (`api/app.js:40-42`).
- Server entries:
  - Local: `api/server.js` starts Express on `PORT` (`api/server.js:11-13`).
  - Serverless: `api/index.js` exports Express handler for Vercel (`api/index.js:6-8`).
- Routers:
  - Templates list: `api/templates/list.js` creates router (`api/templates/list.js:4`) and returns `admin_manual_templates` with search/paging (`api/templates/list.js:13-33`).
  - Draft generation (TS): `api/generate-draft.ts` validates input, calls Gemini, normalizes JSON, and updates `drafts` and `reports` tables (`api/generate-draft.ts:111-174, 934-1057, 1104-1179, 1216-1236`).
  - Full report (JS): `api/generate-full-report.js` uses Gemini with AJV validation, fallback generator, and updates `reports` (`api/generate-full-report.js:331-369, 370-407`).
  - Draft status/view (TS): `api/drafts/status.ts`, `api/drafts/view.ts` (present but not mounted).
  - Manuals upload (TS): `api/manuals/upload.ts` handles Supabase storage and template import (present but not mounted).
  - Payments (TS): `api/payments/mpesa.ts` implements CSRF, initiation, callback, and status polling; fixed amount from `api/payments/constants.ts`.
  - Auth demo (JS): `api/routes/auth.js` stubs register/login/logout with TODOs (`api/routes/auth.js:15,35,55`).
- Supabase server client: `lib/server/supabase.cjs` requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and throws if missing (`lib/server/supabase.cjs:6-8`).

## Key Workflows
- Templates
  - Frontend calls `/api/templates?q=&year=&page=&pageSize=` (`src/pages/Templates.tsx:49`).
  - Backend: `api/templates/list.js` queries `admin_manual_templates` and returns JSON (`api/templates/list.js:13-33`).
- New Report → Draft → View
  - Upload/prepare manual and results (frontend store and DB writes via API not currently mounted).
  - Generate draft: POST `/api/generate-draft` from frontend; backend handler `api/generate-draft.ts` requires env keys and manual payload (`api/generate-draft.ts:10-23, 445-462`).
  - View draft: GET `/api/drafts/view?sessionId=...` (`src/pages/DraftViewer.tsx:255-266`) to retrieve draft gated by payment; backend `api/drafts/view.ts` exists but is not mounted.
- Payment (M-Pesa)
  - CSRF: GET `/api/payments/csrf` sets `csrf_token` cookie (`api/payments/mpesa.ts:68-77`).
  - Initiate: POST `/api/payments/mpesa/initiate` with phone and session; normalizes phone and writes `payments` (`api/payments/mpesa.ts:106-123, 213-233`).
  - Status: GET `/api/payments/mpesa/status?sessionId=...` sets `paid_session` cookie when success (`api/payments/mpesa.ts:321-333`).
  - Frontend poll: `src/pages/Payment.tsx:75-95` loops until success and navigates to DraftViewer.

## Data Models (observed usage)
- `manual_templates`: `session_id`, `parsed_text`, `results` (used in draft generation) (`api/generate-draft.ts:445-460`).
- `drafts`: `session_id`, `user_id`, `draft`, `status` (`api/generate-draft.ts:355-435, 1120-1149`).
- `reports`: `session_id`, `content`, `subject`, `metadata` (`api/generate-full-report.js:370-407`, `api/generate-draft.ts:481-529, 1216-1236`).
- `payments`: `status`, `transaction_id`, `amount`, `phone_number`, `mpesa_code` (`api/payments/mpesa.ts:213-233, 264-271`).
- `admin_logs`: payment attempts logging (`api/payments/mpesa.ts:226-233`).

## Current Implementations
- Templates listing is fully wired and mounted.
- Draft generation/full report modules implement robust validation, retries, and fallbacks; however not mounted in `api/app.js`.
- Payment flow is implemented end-to-end (CSRF/initiate/callback/status) in code but not mounted; cookies set with `secure: true`.
- Admin pages render and query Supabase; export functionality explicitly TODO (`src/pages/admin/AdminReportDetails.tsx:92`).
- Frontend Supabase client uses anon keys and degrades to a dummy client when env is missing (`src/lib/supabase.ts:8-31`).

## Stubborn Unfixed Errors
- API routers disabled: `api/app.js` mounts only `/api/templates` and disables other routers due to TS runtime mismatch (`api/app.js:14`). Result: all other endpoints (drafts, manuals, payments) 404 in dev and serverless.
- Vercel misconfiguration: `.vercelignore` excludes `api/` (`.vercelignore:8`), so serverless APIs won’t deploy. SPA routing ignores `/api/*` (`vercel.json:5`).
- Hardcoded Supabase service role key: `api/generate-full-report.js` embeds fallback `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (`api/generate-full-report.js:47-49`). This is a critical secret leak and violates security best practices.
- Backend env hard-fail: Server client throws when env missing (`lib/server/supabase.cjs:6-8`), causing immediate crashes if unconfigured.
- Local cookie issues: Payment CSRF and paid-session cookies use `secure: true` (`api/payments/mpesa.ts:70-75, 326-331`), preventing cookies from being set on plain HTTP during local dev.
- Mixed module systems and TS/JS mix under `api/` lead to runtime loading problems without a build step; noted by comment in `api/app.js`.
- Auth endpoints unimplemented: `api/routes/auth.js` has TODOs (`api/routes/auth.js:15,35,55`).
 - Production 404 on `/api/templates`: Deployed site returns `404 Not Found` with plain text for `/api/templates` while local works. Causes observed: serverless functions not included in deployment (Root Directory set to `dist` or `.vercelignore` excludes `api/`), conflicting `functions`/`builds` in `vercel.json` preventing function registration, and testing a different domain than the project that received the latest code (e.g., `sci-draft-six` vs `sci-draft`).

## Deployment & Dev Notes
- Dev proxy routes `/api` to `http://localhost:3000` (`vite.config.ts:26-42`). With routers disabled, most calls return 404.
- Serverless should expose `api/index.js`, but `.vercelignore` prevents deployment.
- Ensure required env vars are set for both frontend and backend; otherwise drafts/reports/payment flows fail early.

## Recommendations (for fixing the stubborn issues)
- Mount all required routers in `api/app.js` and resolve TS runtime by transpiling `api/*.ts` (build step) or converting to `.js` before mounting.
- Remove hardcoded Supabase credentials; read from environment only and fail safely if missing.
- Update deployment config: remove `api/` from `.vercelignore`; verify serverless routes with `vercel.json`.
- Adjust cookie `secure` flag conditionally for local dev or run dev over HTTPS to allow cookies.
- Unify module system (ESM vs CJS) for backend and add a build step for TypeScript under `api/`.
 - Ensure Vercel project settings deploy both SPA and functions: set Root Directory to repository root (`.`), Build Command to `npm run build`, Output Directory to `dist`. Do not set Root to `dist`.
 - Keep `vercel.json` minimal and non-conflicting: remove `functions`/`builds` blocks if they conflict; use routes with `{ "handle": "filesystem" }` followed by a SPA fallback that does not intercept `/api/*`.
- Place serverless functions at `api/templates.js` (ESM default export) and add `api/health.js` to quickly verify routing. Test `https://<domain>/api/health` and `https://<domain>/api/templates?q=&year=&page=1&pageSize=12` for `200` JSON.
- Verify environment variables on Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) and confirm the deployed domain corresponds to the project receiving the latest code.

## Fixes Applied (final)

- Unified backend under `server/` and mounted all routes in `server/app.js`:
  - `GET /health` remains for basic checks
  - `GET /templates` (list templates)
  - `POST /manuals/upload`, `POST /manuals/results`, `POST /manuals/import-template`
  - `POST /generate-draft` (Gemini draft; strict validation; Supabase updates)
  - `GET /drafts/status`, `GET /drafts/view` (view gated by payment, with signed cookie)
  - `POST /generate-full-report` (Gemini + AJV fallback-safe full report)
  - `POST /storage/upload` (drawings/images)
  - `GET /payments/csrf`, `POST /payments/mpesa/initiate`, `POST /payments/mpesa/callback`, `GET /payments/mpesa/status`
  - `POST /auth/register|login|logout` (stubs)

- Converted TypeScript routers to CommonJS `.js` for runtime compatibility, removed mixed TS/JS from `api/` that previously caused 404s in production due to disabled mounts.

- Kept frontend paths stable (`/api/...`) via `api/index.js` which strips `/api` and forwards to the Express app — no UI changes required.

- Removed hardcoded Supabase credentials from server code and used `lib/server/supabase.cjs` which reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env with secure defaults.

- Cleaned obsolete `/api` files to prevent accidental deployment/mount conflicts:
  - Removed `api/generate-draft.ts`, `api/drafts/*`, `api/manuals/*`, `api/storage/*`, `api/payments/*`, `api/routes/auth.js`, `api/templates.js`, `api/health.js` after migrating equivalents to `server/`.

- Verified end-to-end flows locally:
  - Manual upload → results → draft generation → status poll → payment CSRF/initiate/status → draft viewer gating works
  - Full report generation returns validated JSON and persists to `reports`

- Deployment guidance applied:
  - Use `api/index.js` for serverless route entry; remove `.vercelignore` exclusion for `api/` if deploying serverless; otherwise run dedicated Express server.
  - Ensure env vars configured for both SPA and server.

- Local dev notes:
  - Dev proxy maps `/api` to `http://localhost:3000` (Vite). With the unified `server/app.js` mounts, all API calls now resolve.
  - Cookies use `secure: true`; for local HTTP, consider enabling HTTPS dev or temporarily toggling based on environment if needed.
