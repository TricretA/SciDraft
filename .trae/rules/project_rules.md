# project_rules.md
# — SciDraft: Project-specific development & LLM rules
# These rules are enforced while building SciDraft. They prevent hallucinations,
# infinite retry loops, and ensure robust, auditable behavior.

## 0. Project Important Rules
Before generating or modifying any code, always check against the uploaded project plan file ("SciDraft_plan.txt").  
- Every feature, page, schema, and fix must be validated against this plan.  
- If the requested task is not in the plan, ask for clarification before proceeding.  
- If an error is outside the plan, only fix it in a way that preserves compliance with the plan.  
- Never introduce features, flows, or structures that are not explicitly defined or consistent with the plan.  
There is a /gallery folder in the project root. It contains:  
- SciDraft-logo1-white.png → The official SciDraft logo, used in the website header and footer.  
- SciDraft-symbol-logo.png → Alternate compact logo, used for favicon, mobile navbar, and small badge placements.  
- SciDraft-loading-logo-04.png → The loading logo, used for the global loading spinner/animation.    
- Always use these exact assets for their intended purposes instead of generating new placeholder images or icons.  
- Do not replace, modify, or invent logos. Only reference the files from the /gallery folder.  
- Ensure correct file paths (`/gallery/...`) when importing in code.  
- For responsiveness:  
   - Use SciDraft-logo1-white.png on desktops.  
   - Switch to SciDraft-symbol-logo.png on smaller screens or tight UI areas.  
- For loading states:  
   - SciDraft-loading-logo-04.png must rotate clockwise as the global loading spinner.    

IMPORTANT RULE — Do not invent, summarize, or replace the official plan.  
You must build strictly and only according to the uploaded "SciDraft_plan.txt".  
The plan has been divided into sections.  

- Every page, feature, database schema, flow, and copy must come directly from SciDraft_plan.txt.  
- Do not use your own PRD or summaries. Do not re-interpret the plan.  
- Before generating code, check that the requested step is present in SciDraft_plan.txt.  
- If it is missing or unclear, STOP and ask for clarification.  
- Never restructure or rename tables, pages, or flows beyond what is defined in SciDraft_plan.txt.  
- Use the assets from /gallery exactly as instructed (main_logo.png, secondary_logo.png, loading_logo.png, hero_bg.png).  
- Always validate that your output matches SciDraft_plan.txt before showing it.  

Your role is execution, not redesign. Follow SciDraft_plan.txt line by line until completion.
You must build SciDraft strictly following the uploaded "SciDraft_plan.txt".  
Do not improvise or summarize. Every category in SciDraft_plan.txt has a purpose and must be applied exactly as written.  
Follow these detailed usage rules:

1. **Project Description**  
   - Use only for context.  
   - Never rewrite or reinterpret. This is the “why” of the project. Keep it constant.

2. **UI/UX**  
   - When building interfaces, styling, or interactions, always copy directly from this section.  
   - Do not change colors, fonts, layouts, or animations beyond what is defined here.

3. **Page by Page Copy Writing**  
   - When filling content into pages (titles, text, buttons, FAQ), always use this section.  
   - Do not generate your own text. If content is missing, STOP and ask for clarification.

4. **AI Pipeline**  
   - Use this only when wiring prompts, LLM flow, or handling draft/full report generation.  
   - Do not invent new steps; follow the sequence in the plan.

5. **SEO Practices**  
   - Only apply SEO optimizations from this section (meta tags, alt text, sitemaps).  
   - Do not add random SEO strategies. Keep strictly to the plan.

6. **Security & Privacy**  
   - Always implement access rules, RLS, and error handling exactly as described here.  
   - Never weaken or skip these requirements. Treat them as mandatory.

7. **Languages & Frameworks**  
   - Only use the tech stack listed here.  
   - Do not substitute frameworks or add unapproved tools.

8. **Phase by Phase Building**  
   - When coding, build in the exact order described here.  
   - Do not shuffle steps. Do not skip. Each phase must be finished before moving to the next.

9. **Full Database Schema**  
   - Always use the schema exactly as written here.  
   - Do not rename tables, columns, or relationships.  
   - If you think something is missing, STOP and ask before making changes.

10. **Overall Flow**  
   - Use this as the master reference for how pages, users, and admins interact.  
   - Never change the flow. Do not invent shortcuts. Follow the arrows defined here.

GENERAL RULES:  
- Before coding any feature, map it to the relevant section in SciDraft_plan.txt.  
- If a request is outside the plan, pause and ask instead of inventing.  
- Every output you generate must be checkable against one of these sections.  
- Do not create your own PRD or summaries. SciDraft_plan.txt IS the PRD.  



## 1. High-level rule
Always prefer **deterministic, auditable server-side logic** over LLM computations. LLMs assist with wording and interpretation — **not math, not truth claims**.

---

## 2. Tech & code standards (must-follow)
- Language: **TypeScript** (frontend + backend).
- Frameworks: Next.js (React), Tailwind CSS.
- Validation libraries: **Zod** (input & API validation).
- JSON schema validation: **AJV** for LLM output validation.
- Testing: Jest/Vitest for unit tests; Playwright/Cypress for one E2E.
- Formatting: Prettier + ESLint; CI must run linter & tests.
- Secrets: keep in env; do not print to logs.

---

## 3. API & data contract rules
- Every API must have a **strict input and output contract** (Zod schema or OpenAPI).
- LLM endpoints must return **only** validated JSON conforming to the schema.
- Backwards incompatible prompt changes require prompt `version` bump and admin approval.

---

## 4. LLM usage protocol
1. **Prompt source**: always load the system prompt from the `prompts` table (never hardcode in controller).
2. **Temperature**: use `temperature <= 0.2` for deterministic outputs; `top_p` low.
3. **Inputs**: supply only:
   - sanitized `manual_excerpt` (trimmed to relevant sections),
   - `results_json` (canonical server-side normalized),
   - `calculation_steps` (server-computed).
4. **Instructions to LLM**: explicitly demand JSON output and include a strict JSON schema in the prompt instruction.
5. **Max tokens**: enforce conservative chunking — if manual excerpt is long, send only relevant sections.
6. **Return format**: LLM must return `draft_json` keys exactly as defined (section names). No extra commentary.

---

## 5. Hallucination prevention & handling
- **Server must compute all numeric calculations**. LLM is only used to *explain* numbers, not compute them.
- **Facts**: If content is not present in `manual_excerpt`, LLM must mark it as `"[STUDENT INPUT REQUIRED]"` or `"[SUGGESTED_REFERENCE]"`. No fabrication.
- **Reference rule**: Never invent DOIs, page numbers, or non-existent sources. If LLM tries, replace with `Suggested reference: [STUDENT INPUT REQUIRED]`.

---

## 6. Output validation & retry policy (stops infinite loops)
- After LLM reply:
  1. Validate against JSON schema (AJV). If valid → proceed.
  2. If invalid:
     - Retry **once** with a modified prompt: *shorter manual excerpt + explicit "Return only valid JSON" instruction + mention error type*.
     - If still invalid → create a `draft_errors` record (or admin_log entry) with:
       - original input, truncated excerpt, full LLM response, timestamp.
       - mark the report `status = 'failed'`.
       - return a **safe fallback** to the user: a partial draft consisting of **only** sections that are confidently extractable from manual (procedures, materials, aims) and show a clear message: `"AI draft unavailable: requires human review."`
- **Max retries = 2**. After that, **do not** auto-retry. Escalate to admin.

---

## 7. Error-loop prevention (implementation checklist)
- Use **idempotency tokens** for LLM and export jobs to avoid duplicate processing.
- Implement **exponential backoff** on retries (e.g., 2s → 6s).
- Maintain a failure counter in runtime; if **N (e.g., 5)** consecutive LLM failures occur in **10 minutes**, open a circuit:
  - disable automated LLM retries,
  - notify admins (email / Slack / admin dashboard),
  - route new draft requests to **manual review** or to a cached earlier prompt.
- All failed attempts must be logged to `admin_logs` with full context and a reproducible example.

---

## 8. Exports & payments rules
- Build the **export engine first** (produce PDF/DOCX from `draft_json`). Payment gating is a logical toggle that checks `payments`/`wallet_transactions` and authorizes download.
- Payment webhooks must be **verified** (Pesaflux signature). Use idempotency tokens on webhook handling.
- If a user paid but export failed, keep `payments.status = success` and create a re-export job; notify the user and provide manual download link (admin).

---

## 9. Admin & governance rules
- **Prompts editable only by admins**. Each prompt update must:
  - create a new `prompts.version`,
  - be logged in `admin_logs`,
  - optionally require a second admin's sign-off for major changes.
- Admin tools must expose:
  - pending manual approvals,
  - draft_errors with inputs,
  - LLM health metrics (failure rate, avg response time).

---

## 10. Monitoring, testing, and metrics
- Expose health metrics: queue sizes, LLM success ratio, export success ratio.
- Alerts: email/SMS/Slack for:
  - >10% LLM failure rate in 1 hour,
  - payment webhook failures > 3 in 10 minutes,
  - export worker error spike.
- CI must run unit tests + lint + build. Block merges on failing tests.

---

## 11. UX safety & messages
- If LLM fails, show friendly copy:  
  `"We couldn't generate a full draft automatically. We've saved your inputs — try again or request a manual review."`  
- Always show **AI-assisted** badge on generated text and include `[STUDENT INPUT REQUIRED]` where needed.

---

## 12. Sample LLM-validate flow (pseudo)
1. Build envelope (prompt_text_version, manual_excerpt, results_json, calc_steps).
2. Call LLM (temp ≤ 0.2).
3. Validate JSON (AJV).
   - If valid -> save & return.
   - Else -> retry with explicit validation instruction (1 retry).
   - If still invalid -> log error, set report.status='failed', return safe partial output and show UI message to user to request admin review.

---

## 13. Operational rules (final)
- **Max LLM retries = 2**; **Max export retries = 2**; **Circuit breaker** activates on high failure rate.
- **Do not** silently swallow or loop on errors; always surface an actionable admin_log entry.
- **Always** provide a clear, non-technical user message rather than raw error traces.

---

## 14. Developer checklist to embed in code (must appear as comments in critical modules)
- Input schema defined (Zod/OpenAPI)
- JSON Schema for LLM response present
- Retry counters and idempotency tokens implemented
- Admin log on all failure branches
- Unit tests for normalization & calculations
- E2E test for "create report -> generate draft -> export" happy path

---

**Bottom line:** build guardrails first, then let the LLM write text inside those guardrails. If the LLM steps outside, block it, log it, and escalate — do not loop forever.
