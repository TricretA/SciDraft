## Findings

* Supabase `reports` table stores full report content in `content` as `TEXT` intended to contain stringified JSON (supabase/migrations/add\_content\_and\_session\_fields.sql:4–22).

* Base `reports` schema has `results_json JSONB` and `draft_json JSONB` but full report uses `content TEXT` (supabase/migrations/001\_initial\_schema.sql:119–131; add\_content\_and\_session\_fields.sql:4–19).

* Full report generation endpoint returns JSON but does not persist to `reports.content` (`api/generate-full-report.js:271–304`).

* Draft pipeline robustly repairs and validates JSON, then persists to `drafts.draft` (`api/generate-draft.ts:760–818, 842–856, 910–976, 986–1018, 1023–1118`).

* Full report renderer expects a structured object with keys: `title`, `introduction`, `objectives[]`, `materials[]`, `procedures`, `results`, `discussion`, `conclusion`, `recommendations[]`, `references[] | object[]` (src/components/ReportRenderer.tsx:13–30, 297–421). It also parses strings into JSON with hardened fallbacks (src/components/ReportRenderer.tsx:98–173).

* Report viewer loads `reports` by `session_id`, then passes `content` (string) to the renderer (src/pages/ReportViewer.tsx:70–101, 274–279).

## Requirements

* Persist full report to `reports.content` as a stringified JSON matching the renderer’s schema.

* Ensure Gemini always returns valid JSON (no markdown, no code fences), and validate before storage.

* Add robust error handling with safe fallbacks, consistent with SciDraft\_plan.txt (AJV validation, deterministic outputs, max 2 retries, circuit breaker semantics).

## Implementation Plan

### 1) Define Strict JSON Schema (AJV)

* Add a JSON Schema describing the full report object with required types:

  * `title`: string

  * `introduction`: string

  * `objectives`: array of strings

  * `materials`: array of strings

  * `procedures`: string

  * `results`: string

  * `discussion`: string

  * `conclusion`: string

  * `recommendations`: array of strings

  * `references`: array of strings or objects `{author, year, title, edition?, page?}`

* Implement AJV validator utility and use it in the full report pipeline before persist.

### 2) Tighten Prompt And Output Normalization

* Update the full report prompt to demand “Return ONLY valid JSON. No markdown/code fences.” and embed the schema.

* Lower `temperature` and `topP` per plan for deterministic structure (e.g., `temperature: 0.2`, `topP: 0.3`).

* Normalize Gemini output:

  * Strip fences, extract largest `{...}` block, repair common issues (unquoted keys, trailing commas).

  * Map alternative section names to canonical keys (reuse/port `sectionMapping` from draft pipeline).

  * Normalize arrays vs strings (e.g., `objectives/materials` to arrays; other to strings).

### 3) Persist Full Report To Supabase

* In `api/generate-full-report.js`, after successful validation:

  * `JSON.stringify(cleanedObject)` into `content`.

  * Update `reports` filtered by `session_id` (and `user_id` when available) with `content`, `subject`, `metadata`.

  * Add exponential backoff and check affected rows (mirror `api/generate-draft.ts` pattern).

### 4) Error Handling And Fallbacks

* If AJV validation fails:

  * Retry once with shorter input and explicit “Return only valid JSON” instruction.

  * On continued failure, construct a safe fallback object with required keys and `[STUDENT INPUT REQUIRED]` placeholders.

  * Log failures to `admin_logs` with payload and timestamp; mark report status `failed` where applicable.

* Implement simple circuit breaker counters for repeated LLM failures per plan.

### 5) Frontend Compatibility Checks

* Ensure `ReportViewer` continues to pass `content` string to `ReportRenderer`.

* `ReportRenderer` already parses strings robustly; confirm it properly renders arrays and strings per the schema.

* Optional: if `content` is not valid JSON, display a friendly message and fallback render, rather than an empty page.

### 6) Tests And Validation

* Unit tests (Vitest):

  * JSON repair/normalization functions (arrays vs strings, mapping keys).

  * AJV validation success/failure cases.

* Integration tests:

  * Simulate Gemini responses: valid JSON, fenced JSON, mixed text with JSON, invalid JSON.

  * Verify supabase update succeeds and `ReportViewer` renders sections.

* E2E (Playwright):

  * Create report → generate full → payment unlock → view full report; assert headings and content are visible.

### 7) Documentation

* Document the schema in code (`schema.ts`) with versioning.

* Note that `reports.content` remains `TEXT` storing stringified JSON; no schema change required.

* Add

