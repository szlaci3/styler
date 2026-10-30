# M4 — Smooth isolated preview

Completed 2026-10-30 following the user's Continue instruction. No dependencies, provider requests, deployment, or later-milestone controls were added.

## Working behavior

`src/preview/Preview.tsx` attaches one open ShadowRoot and renders through a persistent React portal. The sample component, DOM, ShadowRoot, and selected-style element stay mounted across style switches, including rapid changes. The callback reuses an existing root during StrictMode ref replays.

`boundary.css` and `sample.css` are imported as inline text and installed only inside the root. The boundary defines its own defaults, box sizing, form styles, and accessible hidden labels, resetting inherited application styling. Layer order is `baseline`, `selected`, `locks`; the last is reserved for M6/M7. Selected CSS updates in place without touching original styles.

An explicit list of suitable properties transitions over 320 ms: foreground/background colors, border colors and widths, corner radii, shadows, padding, gaps, and numeric typography. Font family/style and border style remain discrete. Reduced-motion sets transition duration and delay to zero and preserves immediate sample navigation scrolling. Changing the preference during animation cancels interpolation and resolves the selected style.

## Observed validation

- `npm run build`: passed, including full TypeScript check and production frontend build.
- `npm test`: all ten offline probe/schema tests passed.
- `npm run test:e2e`: all fourteen Edge checks passed. Existing layout/scroll/form/keyboard checks and all-seven-preset checks at 1440×900, 1920×1080, and 1280×720 remain green.
- Four additional browser checks verify:
  1. Real CSS transitions exist; pausing them at 160 ms gives intermediate background, corner, border, and padding values. Shadow/color transitions are present; finishing them reaches the target. Font family changes discretely.
  2. Rapid style changes retain the exact same ShadowRoot, article, and stylesheet element, with one sample and two style elements. Email state survives.
  3. Host/document CSS, including important selector rules and inherited typography, cannot style inner preview elements. Test-only styles inserted inside the root can style its heading but cannot alter the application header.
  4. Reduced-motion works both at page load and when enabled during a transition; no preview animations remain and navigation scrolls immediately.
- Visually reviewed the updated 1440px Foundation/After Hours and 1280px desktop screenshots. Existing screenshots are emitted under ignored `test-results/`.
- Final source/build whitespace and credential scans and `git diff --check` passed. Source remains local and uncommitted.

An initial browser-test start found the user's normal port 5173 already occupied. No existing process was stopped or reused. Tests now own a separate server on 5174 using validated `STYLER_PORT`; the test runner stopped that server after completion. The normal application still defaults to 5173. README and test-origin assertions were updated accordingly.

## Boundary and next step

The inspector still shows selected source declarations, not computed values or intermediate animation values. There are no declaration lock/Unset controls or live overrides. Generate stays disabled. Later inspector code must query inside the ShadowRoot and associate each selector with a canonical representative, accounting for conditional selectors such as the switch's checked state.

M5 is recommended next: effective CSS inspection, including inherited/default values when declarations are omitted. M6/M7 will add controls and verify actual overrides/cascade behavior. No new AI verification or hosted behavior is claimed here.
