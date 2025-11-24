## Alignment With SciDraft_plan.txt
- Header: Logo + nav + Create Report matches SciDraft_plan.txt: c:\Users\ADMIN\OneDrive\Desktop\SciDraft\SciDraft_plan.txt:668.
- Hero: rotating/transiting headline text and CTA aligns with c:\Users\ADMIN\OneDrive\Desktop\SciDraft\SciDraft_plan.txt:670–672 and 706.
- How It Works section present; adapt copy to 3 clear steps consistent with c:\Users\ADMIN\OneDrive\Desktop\SciDraft\SciDraft_plan.txt:690–692.
- Footer links: About, Terms, Privacy, FAQs, Contact per c:\Users\ADMIN\OneDrive\Desktop\SciDraft\SciDraft_plan.txt:708.
- Note: "Templates" top-nav is not explicitly listed for the Landing header in the plan; propose linking to `/new-report#templates` (Templates area lives within New Report flow per plan), unless you approve adding a dedicated public Templates page.

## Tech & Framework
- Use existing Vite + React SPA with React Router and Tailwind (`package.json` confirms React Router, Tailwind, Framer Motion).
- Keep assets in `public/` per project rules; use `/SciDraft-logo1-white.png` for desktop header and `/SciDraft-symbol-logo.png` for compact.

## Routing
- Replace current `/` redirect with a new `LandingPage` component at `/`.
- Keep `/new-report` unchanged; primary CTAs route to `/new-report` and anchor `#templates` when applicable.

## Components To Add
- `Header`: left-aligned logo, nav link(s), right-aligned "Create New Report" button.
- `Hero`: gradient + animated background (Framer Motion), headline rotator, primary/secondary CTAs.
- `HowItWorks`: 3 animated cards with icons (lucide-react), brief copy per plan.
- `Footer`: copyright, Terms `/terms-of-service`, Privacy `/privacy-policy`, About, FAQs, Contact.
- `LandingPage`: composes the above into sections with smooth scroll.

## Visual & Animation Design
- Futuristic color scheme using plan palette (e.g., near-black body text, gray-blue hero tone): c:\Users\ADMIN\OneDrive\Desktop\SciDraft\SciDraft_plan.txt:97–119.
- Background: implement dynamic, performant animated gradient with subtle particles/shapes (Framer Motion) rather than new image assets (project rules discourage adding external/generated images). If you prefer images, provide approved hero assets.
- Micro-interactions: buttons hover scale/color shift, card lift/glow on hover (Framer Motion + Tailwind).
- Smooth scroll: add `html { scroll-behavior: smooth; }` and anchor navigation.

## Accessibility & UX
- Semantic landmarks (`header`, `main`, `section`, `footer`), ARIA where needed.
- Keyboard focus states and visible outlines; high-contrast color choices per plan.
- Respect `prefers-reduced-motion` to reduce animations for users who opt out.

## Performance
- No heavy background images by default; animated gradient is GPU-friendly.
- Lazy-load non-critical visuals; reuse existing assets from `public/`.
- Tailwind for minimal CSS; Framer Motion for efficient animations.

## Links & Copy
- Header nav: "Templates" → `/new-report#templates` (unless a dedicated public page is approved), "Create Report" → `/new-report`.
- Hero CTAs: Primary "Create Report" → `/new-report`; Secondary "Manual Templates" → `/new-report#templates`.
- Footer: Terms → `/terms-of-service`, Privacy → `/privacy-policy`, include About/FAQs/Contact per plan.

## File Changes (no write yet, for approval)
- Add `src/pages/LandingPage.tsx`.
- Add `src/components/Header.tsx`, `src/components/Hero.tsx`, `src/components/HowItWorks.tsx`, `src/components/Footer.tsx`.
- Update `src/App.tsx` to mount `LandingPage` on `/`.
- Minor addition in `src/index.css` for smooth scroll.

## Tests (Vitest + Playwright)
- Unit: render tests for `Hero` and `HowItWorks` ensuring CTAs and 3 cards exist.
- E2E (Playwright): navigate `/`, scroll to sections, click CTAs to `/new-report`.

## Assumptions & Decisions
- Keep to plan content; avoid new external images. If you want science-student imagery, please supply approved `hero_bg` asset.
- "Templates" appears in New Report flow; adding it as a top-nav link is acceptable if it routes into that flow.

## Approval
- Confirm using an animated gradient background (not external images) and adding "Templates" as a nav link pointing to `/new-report#templates`.
- After approval, I’ll implement, verify locally, and provide tests.