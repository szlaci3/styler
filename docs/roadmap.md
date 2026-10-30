# Proposed milestone roadmap

Approved by the user on 2026-10-30. M1–M18 are complete; local desktop V1 is accepted. The user explicitly authorized M5–M11 together, then M12–M18 through successive selections on 2026-10-30. The approved roadmap ends at M18. Scope changes require a product decision; implementation details do not.

Every milestone ends with appropriate validation, in-scope fixes, status/decision updates, a report of working and remaining behavior, and the next recommendation. Test evidence must distinguish mocks, real provider calls, real browser checks, local builds, and deployment.

## MVP — milestones 1–12

| ID | Deliverable | Verifiable acceptance criteria |
|---|---|---|
| M1 | Antigravity compatibility probe | Minimal server-only TypeScript probe uses the existing key and exact agent through Interactions. Record sanitized actual status/output shape, valid structured-style feasibility, duration, budget support, and exposed usage. No browser secret, alternative model, or automatic retry. If blocked, preserve evidence and stop integration for a user decision. |
| M2 | First working desktop slice | React/TypeScript app and local Node dev command run. Four columns and a stable representative preview render with headings, paragraphs, buttons, input, switch, and cards. Rails/inspector scroll independently and Generate remains visible. Browser check at intended desktop sizes. |
| M3 | Shared style schema and seven presets | A bounded versioned schema validates presets and rejects unsafe input. Seven visibly distinct S cards show actual surface/button treatments. Selecting each applies its style and visible active border; content and input/switch state remain unchanged. |
| M4 | Smooth isolated preview | Stable ShadowRoot preview changes CSS without remount. Colors, borders, radii, spacing, and shadows animate where supported. Reduced-motion works. Adventurous styles cannot alter app chrome. Browser checks retain DOM identity and control state. |
| M5 | Effective CSS inspector | Stable selector/declaration groups show properties and effective values immediately, including inherited/default values for omitted properties. Canonical preview representatives agree with browser-computed values. No hidden-original secondary values. Independent scrolling remains usable. |
| M6 | Declaration state controls | Two accessible toggles implement Free↔Locked, Free↔Unset, and Locked↔Unset. Lock captures effective value. Multiple locks survive style selection without mutating originals. Unset removes its override without inserting literal CSS unset. State-transition tests pass. |
| M7 | Browser cascade correctness | Ordered layers apply locks above original styles. Overlapping selectors, inheritance, and equal-specificity source order match browser CSS; clicking locks in different orders does not change precedence. Unlocking reveals the intact underlying style. Meaningful browser regression checks pass. |
| M8 | Seeded Joker generation | Seed-labeled initial G card prevents an empty rail without an AI request. Reproducible Joker uses the shared schema, respects locks, omits Unset declarations, and produces adventurous variation. Tests show same seed/snapshot yields same style and no mutation. |
| M9 | Manual batch and history experience | Each Generate immediately appends exactly two ordered slots, resolves Joker without waiting for remote work, and scrolls only the generated column to the new batch. Mock pending/success/failure demonstrates slot replacement, append-only G numbering, no auto-selection, no generation on initial load/constraint changes. This intermediate slice is explicitly not AI-complete. |
| M10 | Real quick Antigravity result | Validated server endpoint replaces the second slot with a real exact-agent result. Both slots use one captured constraint snapshot despite edits during the request. Invalid/malformed/unsafe responses become explicit failed slots. Built browser assets contain no credential. No automatic model fallback. |
| M11 | Failure, concurrency, and measurements | One active batch guard prevents duplicate requests. Auth/quota/network/timeout/invalid-output errors are sanitized; manual retry targets the failed slot with its original snapshot, without another Joker. Request outcome, latency, validity, and exposed usage are recorded; unsupported cost estimates remain unavailable. Small bounded live sample informs V1 concurrency/transport. |
| M12 | MVP acceptance and handoff | Full user journeys pass in a desktop browser: locks across selections, Unset omission on generation, both results, old-history browsing then mandatory new-batch scroll, error/retry, reduced motion, keyboard controls, and no automatic timer/request. Typecheck, meaningful tests, production build, and secret checks pass. Record real-provider evidence and remaining limits. |

## V1 — milestones 13–18

| ID | Deliverable | Verifiable acceptance criteria |
|---|---|---|
| M13 | Richer coherent sample website | Expand the same fictional site with navigation, images, richer cards, form controls, dropdowns, and credible page sections. Content is fixed across styles; interactions work. Presets and supported declarations cover the additions; style switching retains state. |
| M14 | Exclusive inspiration selection | Separate accessible inspiration controls work across both rails, exactly one or none selected. Clearing is possible. Preview selection remains independent. Snapshot contains inspiration; CSS locks and Unset constraints take priority in Joker and AI output. Tests cover changing/clearing selection and snapshot immutability. |
| M15 | Six-slot progressive generation | Every batch immediately appends six positions: instant Joker, quick AI, four more AI. Stages run independently with measured bounded concurrency; quick completion is a goal, not a sequential dependency. Each slot settles progressively and retains failures. Same snapshot for all six. Similar results are accepted without regeneration. Scroll shows the start of a tall batch. |
| M16 | Shared eight-second countdown | Exactly one fake-clock-tested timer starts/resets on CSS state/inspiration changes only. Final labels show Sending in 3…, 2…, 1…. Manual Generate cancels the timer; generation shows Generating…. Preview selection, hovering, scrolling, and preview interaction do not arm it. No page-load request. |
| M17 | Edits during active generation | Live locks update immediately while the batch retains its original snapshot. No active-request edit arms or queues a timer. Completion indicates constraints not yet used when appropriate, without auto-sending. Later manual generation or a fresh constraint edit works. Test race conditions and completion/error paths. |
| M18 | V1 acceptance and measured handoff | End-to-end six-result/inspiration/timer/race journeys pass. Record observed first-result/full-batch latency, exposed usage and defensible cost or unavailable, and chosen concurrency rationale. Preserve older history, partial results, source order, reduced motion, and keyboard usability. All required checks pass and status identifies hosting decision and remaining limits. |

## Deferred V2

Manual insertion of CSS declarations is out of scope. New properties would initially be locked, but their lifetime remains a deliberate future product decision. Do not implement custom authoring or resolve lifetime during MVP/V1.

## Next recommendation

M1–M18 are complete. Latest acceptance and hosting/concurrency rationale are in m18-v1-acceptance.md; real-provider measurements remain in m15-live-measurements.json. Next trial the accepted local V1. Public deployment needs a separately selected target/scope; V2 remains deferred pending a product decision about custom declarations and their lifetime. No additional implementation milestone is automatically authorized. A future integration blocker does not authorize switching providers.
