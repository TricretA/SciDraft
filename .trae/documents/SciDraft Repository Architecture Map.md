## Framework Used

* Frontend: `React + TypeScript` with `Vite` and `react-router-dom`

* Styling: `Tailwind CSS` with custom keyframes; supplemental `App.css`

* Backend: `Express` server under `api/` (serverless entry + local dev)

* Data: `Supabase` client on frontend; Supabase Service Role on backend

* Utilities: `zod`, `zustand`, `lucide-react`, `html2pdf.js`, `pdfjs-dist`

## Main Entry Points

* `index.html`: HTML shell and script bootstrap (index.html:20)

* `src/main.tsx`: React root render and global CSS import (src/main.tsx:3–5)

* `src/App.tsx`: Router, providers, and route table (src/App.tsx:124–174)

* Backend: `api/app.ts` wires routers (api/app.ts:24–27), `api/server.js` local start, `api/index.js` Vercel handler

* Dev proxy: `vite.config.ts` proxies `/api` to `localhost:3001` (vite.config.ts:19–37)

## Components Directory (Key Roles)

* `src/components/ProtectedRoute.tsx`: user route guard

* `src/components/AdminProtectedRoute.tsx`: admin route guard

* `src/components/ReportRenderer.tsx`: render structured report JSON

* `src/components/LoadingSpinner.tsx`: animated spinner

* `src/components/ErrorBoundary.tsx`: top-level error containment

* `src/components/FeedbackButton.tsx`, `FeedbackOverlay.tsx`, `SuccessNotification.tsx`, `Empty.tsx`: UI/UX helpers

## Routing Structure

* SPA routes in `src/App.tsx` using `react-router-dom`

  * Public: `/`, `/about`, `/terms`, `/privacy-policy`, `/lab-report-guide`, `/see-scidraft-in-action`, `/contact`

  * Auth: `/login`, `/signup`, `/reset-password` guarded by `PublicRoute`

  * Protected: `/dashboard`, `/new-report`, `/my-reports`, `/report/:id`, `/draft-viewer/:sessionId`, `/report-viewer/:id`, `/feedback`, `/payments`, `/settings`, `/support`

  * Admin: `/admin` with `AdminLayout` and children: `dashboard`, `users`, `reports`, `reports/:reportId`, `payments`, `feedback`, `prompts`, `notifications`, `admins`, `system` (src/App.tsx:160–172)

* Route guards implemented inline: `ProtectedRoute`, `PublicRoute`, `AdminRoute` (src/App.tsx:42–121)

* Vercel SPA fallback and API routing in `vercel.json` (vercel.json:3–19)

## Styling System Overview

* Tailwind directives in `src/index.css` (src/index.css:1–3)

* Custom animations in `tailwind.config.js` (tailwind.config.js:9–34)

* Global CSS utilities and accessibility in `src/App.css` (src/App.css:22–27, 98–109)

* Tailwind utility classes applied across pages and components (e.g., `LandingPage.tsx`)

## Assets and Utility Folders

* Assets: `public/` contains logos and favicon (public/\*)

* Hooks: `src/hooks/` common UI/effects (e.g., `usePageTitle`)

* Lib: `src/lib/` Supabase client and types (src/lib/supabase.ts)

* Utils: `src/utils/` security, sanitization, lazy loading helpers

* Middleware-like: `src/middleware/sessionValidation.ts`

## Global States or Configs

* Auth: `src/contexts/AuthContext.tsx` (Supabase-backed; email confirmation enforced)

* Admin Auth: `src/contexts/AdminAuthContext.tsx` (role gating, secure cookie, inactivity timeout)

* Report state: `src/stores/reportStore.ts` (Zustand persist, sessionStorage backup)

* Env: `import.meta.env.VITE_*` used in Supabase client (src/lib/supabase.ts:3–5)

## Animation and State Management

* Animations: `framer-motion` used in `LandingPage.tsx` for hero/background/icon motion; Tailwind keyframes for global effects

* State: React Contexts + `zustand` for report data; UI state in pages/components

## Data Fetching and API Connections

* Supabase reads/writes in `DraftViewer.tsx` (e.g., drafts/reports tables) and contexts

* Full report generation: client POST to `/api/generate-full-report` (src/pages/DraftViewer.tsx:636–643)

* Backend routes: `api/generate-draft.ts`, `api/generate-full-report.js`, `api/routes/adminAuth.ts`, `api/routes/auth.js` mounted in `api/app.ts`

* Dev proxy ensures `/api/*` calls hit local Express (vite.config.ts:19–37)

## Layout, Navbar, Footer, Global Styles

* User-facing nav and footer are implemented in `LandingPage.tsx` (navigation at top, footer at bottom)

* Admin layout and topbar: `src/pages/admin/AdminLayout.tsx` controls sidebar, topbar, content via `Outlet`

* Global styles: `src/index.css` (Tailwind), `src/App.css` (accessibility, animations

