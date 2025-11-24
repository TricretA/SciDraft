## Goal
Initialize and launch the frontend (Vite) and backend (Express) servers locally, then verify startup by inspecting logs and endpoints.

## Preflight
- Ensure Node.js ≥ 18 is installed
- Install deps: `npm install`
- Confirm `.env` contains required vars without exposing values:
  - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`

## Start Servers (Dev)
- Start backend API (nodemon + tsx): `npm run server:dev`
  - Expected log: `Server ready on port 3001` (api/server.js:11)
- Start frontend (Vite): `npm run client:dev`
  - Or run both concurrently: `npm run dev`
  - Expected Vite log: local URL (e.g., `http://localhost:5173`)
- Dev proxy: `/api/*` requests are routed to `http://localhost:3001` (vite.config.ts:19–37) with request/response logs

## Verify Startup
- Frontend:
  - Open `http://localhost:5173/` and check console for `App component rendering...` (src/App.tsx:178)
  - Navigate to a few routes (e.g., `/lab-report-guide`, `/signup`) to ensure router works
- Backend:
  - Hit health endpoint: `GET http://localhost:3001/api/health` → `{ success: true, message: 'ok' }` (api/app.ts:33–38)
  - Check terminal for proxy logs: `Sending Request...` and `Received Response...`

## Log Review Criteria
- Errors: missing env vars (Supabase/Gemini), port conflicts, proxy failures
- Warnings: large payload limits, CORS issues, deprecations
- Specific red flags:
  - Backend: `GEMINI_API_KEY environment variable is required` (api/generate-draft.ts:10–12)
  - Backend: Supabase service role missing (api/generate-draft.ts:16–22)
  - Frontend: `Root element not found!` (src/main.tsx:9–11)

## Production Notes (Heads-up)
- `server:prod` expects a server build (`dist/server.js`), and `api/index.js` expects `dist/api/app.js`
- `tsconfig.server.json` appears missing; if you want a production start locally, we’ll add/adjust the server build to produce `dist/api/app.js` and `dist/server.js`
- For Vercel, `vercel.json` routes `/api/*` to serverless handler `api/index.js` (vercel.json:3–7)

## Next Action
On approval, I will run the above commands, monitor logs in real time, and report any errors/warnings with fixes.