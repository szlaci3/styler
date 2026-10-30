# M3 — Shared schema and seven selectable presets

Completed 2026-10-30 following the user's Continue instruction. No provider request, dependency installation, or deployment occurred.

## Working behavior

Seven curated styles are selectable by mouse or keyboard: S1 Foundation, S2 Blueprint, S3 After Hours, S4 Papercut, S5 Rosewater, S6 Signal, and S7 Monograph. They vary colors, font family/size/weight, button treatment, corner radii, borders, padding, and shadows. Card samples use their original page/button values. One card has the active gold border and `aria-pressed=true`; the preview header names it. G1 uses the same representation, is selectable, and is explicitly labeled Seed.

Selection changes the preview stylesheet, not its content or mounted component. Email input and confirmation, quiet-hours switch state, and expanded card details survive switching through all presets. The inspector now follows the selected style's source declarations and stays explicitly read-only. It does not claim to show browser-resolved effective values (M5).

## Shared contract and decisions

`shared/style.ts` owns the browser/server-independent versioned types, exact-field runtime parser, selector/property vocabulary, stable declaration IDs, and CSS compiler. `src/styles/presets.ts` builds the seven styles and seed through that parser. The temporary M2 foundation module was removed.

All values use a closed bounded grammar, not arbitrary CSS strings. Only fixed selector IDs and known longhand properties are accepted. Reject unknown fields, custom properties, layout escape properties, duplicate selectors/properties, mismatched declaration IDs, arbitrary URLs/functions/HTML, CSS injection, importance, unsupported fonts, and out-of-range values. Rule/declaration order and omissions are preserved. Every selector in a grouped rule gets the preview scope. Parsing copies and deeply freezes original data to prevent accidental mutation.

A small explicit validator meets the bounded schema need without adding a runtime dependency. Existing native Node tests cover the shared pure TypeScript code; a new client test framework is unnecessary here. The M1 probe deliberately retains its smaller diagnostic contract; application AI integration must use this full schema in M10.

## Observed validation

- `npm run build`: passed, including TypeScript and Vite frontend build. A separate `npm run typecheck` after adding the new browser tests also passed.
- `npm test`: ten offline tests passed (five existing probe tests plus five schema/preset tests). Tests cover all provenance tags, omission and source order, immutable copies, hostile input, unknown/duplicate declarations, stable IDs, and syntax/range limits.
- `npm run test:e2e`: ten Edge checks passed. Existing layout/scroll/interaction checks remain green. New checks apply every preset at 1440×900, 1920×1080, and 1280×720, comparing actual computed page/button/heading values and miniature colors against style data, verifying one active selection, retained DOM/content/state, intact application chrome, document bounds, seed selection, and no external/AI requests. Keyboard Enter/Space selection also passed.
- Visually inspected all seven 1440×900 preset screenshots under ignored `test-results/m3-S*.png`.
- Final source/build whitespace and credential scan plus `git diff --check` passed. Files remain local and uncommitted.

## Remaining boundary

Style changes currently apply immediately. Smooth transitions, reduced-motion style changes, and persistent ShadowRoot isolation are M4. Current fixed selector scoping is not a claim that ShadowRoot isolation exists. Some decorative illustrations and layout details intentionally stay fixed across presets.

Computed effective-value inspection, CSS declaration controls/overrides, Joker/history generation, and real application AI requests remain later milestones. No inspiration lock, automatic timer, custom CSS authoring, or model fallback was added.

Next recommended milestone: M4 — animate supported properties while retaining the preview DOM, isolate the preview in a persistent ShadowRoot, and respect reduced-motion preferences.
