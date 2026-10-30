# M2 — First local desktop slice

Completed 2026-10-30 following the user's Continue instruction. M1 remains intact. No new Antigravity request was made.

## Working behavior

- `npm run dev` starts a loopback Node server at `http://127.0.0.1:5173`, hosting the React/TypeScript Vite app and a minimal `/api/health` endpoint on the same origin.
- Dominant preview, two narrow style rails, and wider inspector form four horizontal columns. At 1440px the split is approximately 61/7/7/26; fixed 96px rails remain legible at wider sizes. Minimum desktop width is 1280px.
- Each column owns its scroll region; header/footer controls stay outside scrolling content. The document does not scroll vertically or horizontally at the tested desktop sizes. Generate stays visible while the inspector scrolls.
- A fictional Form & Field sample website includes headings, paragraphs, buttons, two cards, CSS-drawn illustrations, a switch, and an email form. The navigation/hero button scroll to the spaces, card buttons reveal details, the switch toggles, and submitting a valid email shows local confirmation without sending email.
- S1 shows the active fixed foundation; G1 is explicitly labeled Seed and Reference only. These are noninteractive samples, not generated responses or implemented style selection.
- The inspector shows fixed base declarations, explicitly labeled Read only. Generate is disabled with an availability explanation. No misleading loading state, fabricated AI response, automatic request, or timer is present.
- System fonts and local CSS illustrations need no remote assets. Form controls and scroll regions have labels/focus indicators. Reduced-motion users get immediate preview navigation scrolling.

## Verification

- `npm run build`: passed, including full frontend/server/test TypeScript check and Vite production frontend build.
- `npm test`: five offline M1 contract/diagnostic tests passed.
- `npm run test:e2e`: all six Playwright checks passed in installed headless Microsoft Edge:
  - Layout, document bounds, inspector overflow, and pinned Generate at 1440×900, 1920×1080, and 1280×720.
  - Actual preview interactions and health endpoint; no external or AI requests observed.
  - Independent wheel scrolling of all four regions. Test-only cloned rail samples establish overflow because production M2 has one item per rail; they are not shipped history or presets.
  - Keyboard entry, tab navigation, and form submission with reduced-motion preference.
- Screenshots from all three viewports were visually inspected. They are emitted under ignored `test-results/m2-desktop-*.png`.
- Final source/build checks found no credential value or trailing whitespace. `.env`, `node_modules`, `dist`, and test output are ignored. `git diff --check` passed; files remain local and uncommitted.

The first browser run exposed document overflow from an absolutely positioned visually hidden label. Making the preview root its containing block fixed the issue; all three viewport-bound checks then passed. Network-restricted test readiness was blocked by EACCES; the successful browser checks ran with approved localhost access. The test runner stopped its owned dev server after completion.

## Boundary and next action

This is the first UI slice, not the completed MVP. Full style validation, seven presets, clickable selection, dynamic CSS inspection, locks/Unset, live overrides, animated style changes, Joker/history generation, and application AI integration remain in their planned milestones. The current preview is class-scoped fixed CSS; ShadowRoot isolation is M4. The existing probe's small contract remains separate from the forthcoming full shared schema.

No mobile optimization, backend persistence, public hosting, or V2 authoring was added. Build verification is local, not deployment evidence. The dev server has a health endpoint only; generation endpoints are not implemented.

Next recommended milestone: M3 — shared validated style representation and seven selectable curated styles, preserving sample content and interactive state across switches.
