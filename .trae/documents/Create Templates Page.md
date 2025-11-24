## Overview
- Add a new public page "Templates" listing available manual templates with search, filters, preview, and selection.
- Use existing Supabase table `manual_templates` (no `admin_manual_templates` found) for data.
- Integrate with the current New Report flow so “Select” pre-loads template data into results entry.

## Routing & Navigation
- Add route: `/templates` under public routes in `App.tsx`.
- Update header/hero links currently pointing to `/new-report#templates` to point to `/templates` for consistent navigation.
- Ensure route is accessible to all user roles (no guards).

## Data Model & Fetching
- Source table: `manual_templates` (per codebase and plan).
- Display fields mapping:
  - Unit Name ← `unit_name`
  - Unit Code ← `unit_code`
  - Practical Title ← `practical_title`
  - Practical Number ← `practical_number`
  - Year ← `year`
  - Preview content ← `practical_content` (or `parsed_text` if content is stored there; verify column)
- Implement Supabase client fetch with pagination (pageSize default 12) and server-side filters via `ilike` for text search and exact match for year.
- Validate responses with Zod (schema for template item) before rendering.

## Page Structure & UI
- Top bar: headline “Available Manual Templates” and prominent `Upload Manual` button (routes to `/new-report`).
- Content: responsive grid of cards (Tailwind) for templates.
- Card layout:
  - Header block: Practical Title (primary), Unit Name (bold), Unit Code (secondary).
  - Meta row: Practical Number (secondary), Year (small bold).
  - Actions: `Preview` (opens modal), `Select` (preloads and redirects).
- Search and filter bar:
  - Text input to search by Practical Title / Unit Name / Unit Code.
  - Filters: Year (dropdown), Unit Code (optional dropdown populated from fetched distinct values).
- Pagination controls: next/prev with page indicators; lazy-loading via incremental fetch.

## Preview Modal
- On `Preview`, open an accessible modal (focus trap, ESC close) showing the full `practical_content` with scrollable container.
- Include Close button; avoid rendering huge strings synchronously (virtualized or chunked rendering if very large).
- Ensure modal uses semantic roles (`dialog`) and ARIA labels.

## Select Flow Integration
- On `Select`:
  - Store selected template fields into the existing `useReportStore` (e.g., set `manualText`/`parsedContent`, `sessionInfo` placeholder, and relevant metadata like subject/unit).
  - Navigate to `/new-report` and set `currentSection='results'` using location state or store (NewReport reads store on mount to position at results if template present).
  - If `manual_templates` has no `session_id` context for templates, do not call upload APIs; use local store-only preload.

## Error Handling
- Loading state: skeleton cards or spinner while fetching.
- Empty: “No templates available” message with CTA to `Upload Manual`.
- Errors: show toast/banner with retry; log to console and avoid crash.

## Performance
- Pagination with pageSize (12–24) and server `range` selection.
- Debounced search input (300–500ms) to reduce queries.
- Modal optimization: limit DOM nodes, render as plain text within a scroll container; consider chunking for extremely large content.

## Accessibility & Styling
- Tailwind styling matching existing aesthetic; clear visual hierarchy.
- Buttons with hover/focus states; keyboard navigation for grid and modal.
- Responsive grid (1→2→3→4 columns across breakpoints).

## Testing
- Unit tests (Vitest/Jest) for:
  - Zod schema validation (valid/invalid Supabase rows).
  - Search/filter functions.
- Integration test (Playwright) outline:
  - Navigate to `/templates`, fetch displays, open a preview, select a template, land on `/new-report` with preloaded results section.

## Plan Compliance Notes
- SciDraft_plan.txt references `manual_templates`; no `admin_manual_templates` exists in the repo. Proceeding with `manual_templates` ensures consistency.
- No new database schema introduced; only a new page and route using existing data.

## Implementation Steps
1. Create `src/pages/Templates.tsx` with grid, search/filter bar, modal, and pagination.
2. Add Zod schema for template items.
3. Wire Supabase queries with filters and ranges; add loading/error/empty states.
4. Implement `PreviewModal` component inside the page.
5. On `Select`, set store values and navigate to `/new-report` (results section).
6. Add `/templates` route in `App.tsx` and update header/hero links.
7. Add minimal unit tests for schema and search/filter logic.

Please confirm the plan; upon approval, I will implement the page, routing, store integration, and tests exactly as described.