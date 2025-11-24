## Compliance Check
- This change removes pages explicitly present in SciDraft_plan.txt: Landing, Auth (Signup/Login/Reset), and Dashboard.
- It also removes Supabase authentication across the app. This diverges from the plan’s current flows.
- Assumption: You approve deprecating those plan sections. I will update documentation and leave admin/data features intact.

## Approach Overview
- Switch the default route to `"/new-report"` and make `"/"` redirect to `"/new-report"`.
- Remove Landing, Dashboard, and Auth routes/components and their references.
- Eliminate all usages of `supabase.auth.*`, auth contexts, hooks, route guards, and admin login flows.
- Preserve non-auth functionality and styling; keep Supabase data operations that do not depend on auth.
- Update navigation links, sitemap, and robots to reflect `new-report` as the canonical entry.

## Files to Update
- `src/App.tsx`: React Router route table — remove `"/"` landing, `"/dashboard"`, `"/login"`, `"/signup"`, `"/reset-password"`; add `"/" → Navigate to "/new-report"`; ensure `"/new-report"` loads without guards.
- `src/pages/LandingPage.tsx`: remove file and any landing-only sections/assets usage.
- `src/pages/Dashboard.tsx`: remove file; purge links/actions (e.g., `to="/new-report"`, `to="/my-reports"`).
- `src/pages/auth/LoginPage.tsx`, `SignupPage.tsx`, `ResetPasswordPage.tsx`, `admin/AdminLogin.tsx`: remove files and route references.
- `src/components/ProtectedRoute.tsx`, `src/components/AdminProtectedRoute.tsx`: remove and strip usage in `src/App.tsx`.
- `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`: remove.
- `src/contexts/AdminAuthContext.tsx`: remove (admin auth).
- `src/middleware/sessionValidation.ts`: remove server-side auth validation.
- `src/pages/admin/AdminLayout.tsx`: adjust topbar/sidebar links; remove sign-out; ensure navigation doesn’t reference removed pages.
- `public/sitemap.xml`: remove URLs for deleted pages; set root to `/new-report` as primary.
- `public/robots.txt`: if referencing deleted routes, adjust only as needed (keep general allowances).
- `src/hooks/usePageTitle.ts`: set default title/description for New Report; remove titles for deleted pages.
- `api/pages/api/admin/auth.ts` (or similar auth handlers): remove auth endpoints.

## Supabase Auth Cleanup
- Remove all calls to `supabase.auth.*` across the app (sign-in/out, session, updateUser, reset).
- Remove `AuthContext` subscriptions `onAuthStateChange` and any email confirmation logic.
- Preserve non-auth Supabase operations for data (e.g., `supabase.from('...')`) where still used.
- Environment variables:
  - Remove client/public auth envs only used for login flows (e.g., `NEXT_PUBLIC_*` used solely for auth contexts).
  - Preserve `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` if required for non-auth data operations; preserve server `SUPABASE_SERVICE_ROLE_KEY` for backend data.
  - I will annotate and remove only variables that are strictly auth-related.

## Redirects and Navigation
- All internal links that previously pointed to Landing, Dashboard, Login, Signup, or Reset will redirect or be changed to `"/new-report"`.
- `src/pages/LandingPage.tsx` header/footer links (e.g., `"/signup"`, `"/see-scidraft-in-action"`) will be removed or repointed per copy guidance.
- `AdminLayout` sign-out actions will be removed; admin pages remain accessible without auth.

## Assets
- Keep official assets under `/gallery` per project rules; do not delete/modify.
- Remove landing-specific assets under `public/` that are not part of `/gallery` and not referenced elsewhere.

## SEO & Sitemap
- Update `public/sitemap.xml`: make `/new-report` the canonical root; remove deleted routes.
- Keep `public/robots.txt` largely intact; ensure it doesn’t reference removed routes.
- Ensure `document.title` defaults to New Report via `usePageTitle`; add a `<meta name="description">` in `index.html` if needed to support description updates.

## Documentation
- Update README or documentation to:
  - Describe `new-report` as the default entry point.
  - Remove references to landing/auth/dashboard.
  - Document removed env variables and updated setup.

## Verification
- Start dev and open root `/` → confirm redirect to `/new-report`.
- Direct navigation to removed routes (landing, dashboard, login, signup, reset) → confirm 404.
- Run app, check console for errors related to removed code.
- Build with `vite build`; ensure compile succeeds.
- Spot-check remaining pages (reports, admin screens) for functional navigation and no auth dependencies.

## Assumptions
- Admin pages will remain but without authentication; they will be publicly accessible unless we later add a different guard.
- Supabase data operations are retained; only auth code is removed. If you prefer removing client Supabase entirely, I can also refactor data fetches to backend-only.
