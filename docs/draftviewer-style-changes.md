# DraftViewer Style Changes (Mobile Flicker Fix)

## Summary
Removed all animations, transitions, transforms, and heavy blur effects from `src/pages/DraftViewer.tsx` and simplified styling to stabilize mobile rendering while preserving functionality.

## Key Modifications
- Removed `framer-motion` usage (no `motion.div`, `AnimatePresence`).
- Replaced animated loaders (`animate-spin`) with static indicators.
- Removed `transition-*` and `transform` classes from buttons and inputs.
- Replaced `backdrop-blur-xl` and gradient-heavy containers with simple backgrounds.
- Kept layout, data fetching, navigation, and actions unchanged.

## Rationale
Mobile browsers can trigger frequent viewport height changes and repaints; animations and heavy effects amplify flicker. Static layout with `min-h-[100dvh]` and no animations prevents repaint loops.

## Impact
- Mobile: Stable rendering without flicker; no functional changes.
- Desktop: Minimal visual changes; core interactions remain intact.

