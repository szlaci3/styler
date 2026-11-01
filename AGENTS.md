# Styler repository instructions

Build the desktop website style explorer described in `docs/product-specification.md`.

## Resume in a fresh chat

1. Read this file, `docs/status.md`, `docs/roadmap.md`, and `docs/architecture.md`.
2. Consult the product specification for behavior details. Inspect source and current Git changes; documentation is not proof of working code.
3. Check roadmap approval and the selected milestone in status. Do not begin substantial implementation before roadmap approval. Approval of the roadmap alone does not authorize all milestones: implement the selected milestone, then report its boundary.
4. Complete the milestone, validate it, fix in-scope issues, update status and material decisions, then report what works, what remains, and the next milestone. Do not request approval for routine technical choices.

## Durable constraints

- React/TypeScript; local desktop prototype first, server-side Node API. Hosting follows measurements.
- AI execution system is exactly `antigravity-preview-09-2026` through the verified agent interface. Never silently substitute a model/provider or add automatic fallback. Local Joker is a separate permanent feature.
- Existing `GEMINI_API_KEY` in `.env` is intended for the approved integration milestone, per user confirmation on 2026-10-30. Never print it, commit it, or expose it through browser environment variables or bundles.
- Preserve original styles separately from declaration overrides. Effective preview is selected style plus locks. Browser CSS determines cascade precedence; click order does not.
- Unset clears a lock and constrains future output to omit a declaration; it never inserts literal CSS `unset` into the current preview.
- MVP: manual Generate only, exactly two new cards (instant local Joker + one AI), immutable snapshot, immediate placeholders, mandatory generated-column scroll, no automatic selection.
- Current V1 follow-on: six results in order — local Joker (±20 RGB), local Harlequin (±40 RGB), quick AI Professional, then Playful, Commercial and Artistic. Mysterious is disabled. Preserve inspiration lock, progressive delivery, shared eight-second timer and no queued generation during a request. Similar/identical AI results are acceptable.
- V2 declaration editing is authorized: typed values and new lines under existing selectors, within the shared bounded schema. Edits auto-lock with disabled L; changed values use Reset, added lines use Del. Edited values (and added property names) use #00c800. Add-declaration controls occupy one line; inspector semicolons are omitted. Edits persist for the session until Reset/Del; Reset restores the preceding constraint. No mobile work, database, universal CSS editor, or elaborate orchestration.
- Saved presets are explicitly authorized in Dexie/IndexedDB: Save preset captures the selected style plus applied locks as S8, S9, onward. Preserve saved CSS layer order and validate stored styles on load. Browser-local saved presets persist across reloads; generation history and unsaved edits remain session-only. This is the exception to the earlier database restriction.
- No AI request on page load. Preserve generation history in session memory. Use explicit errors and manual retry.
- Keep the app chrome isolated from generated CSS. Validate styles on the server and client against the bounded schema.

## Validation

Use `npm run dev` for the loopback application on port 5173 (overridable with `STYLER_PORT`). `npm run build` includes typecheck and the frontend build; `npm test` runs offline probe/schema tests; `npm run test:e2e` owns a temporary server on port 5174 and uses installed Edge (5174 must be free; leave existing app sessions alone). The full shared schema/validator/compiler is `shared/style.ts`; curated styles are `src/styles/presets.ts`. The persistent ShadowRoot/portal is `src/preview/Preview.tsx`; import preview CSS with `?inline` so it stays inside that root. Query preview elements through the root, not `document.querySelector`. Never key the portal or preview by selected style ID. Keep presets immutable and preserve missing declarations and source order. `npm run probe:antigravity` makes one real request and is separate from app startup; its M1 contract is intentionally smaller than the application schema. Native TypeScript execution requires Node 24.10+. Read `README.md` before running the live probe. Evidence is in `docs/status.md` and the milestone verification reports; never describe planned checks as passed.
