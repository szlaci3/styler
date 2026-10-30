# Current development status

Last updated: 2026-10-30 (Europe/Brussels).

## Authority and scope

- Roadmap and architecture approved on 2026-10-30. Original requirements remain in product-specification.md.
- User authorized M5–M11 together, then M12–M18 through successive milestone selections, including “Continue” after M17. **M1–M18 are complete: local desktop V1 has passed acceptance and measured handoff.**
- The approved roadmap ends at M18. Next recommended activity is a user trial of local V1; deployment and V2 authoring require separately selected scope.
- Existing ignored GEMINI_API_KEY is authorized for integration, server-side only. Exact agent remains antigravity-preview-09-2026.

## Working implementation

- Local React/TypeScript desktop app with seven immutable presets and an honest selectable G1 seed. The expanded Form & Field preview includes local illustrations, navigation, memberships, a validated local visit form with dropdowns/notes, and native FAQs. Content/control state survives all preset changes.
- Persistent ShadowRoot preview retains DOM/control state and isolates app chrome. Selected and locks styles use native CSS layers with reduced-motion support. Enabling reduced motion cancels existing transitions as well as preventing new ones.
- Effective inspector reads canonical rendered representatives, including inherited/default values, and retains rows discovered in accepted generated history. Conditional switch selector reads its track even when unchecked. Fractional font weights during transitions can be captured within the 400–800 bound.
- Free/Locked/Unset controls capture browser values, retain locks across selection, and keep original style records intact. Unset clears the live lock and omits the declaration in later results.
- Canonical lock source order is independent of click order. Browser specificity and inheritance remain native.
- Exclusive accessible inspiration controls work across presets/seed/Joker/AI cards, independently of preview selection. A footer control clears inspiration. Generation and manual retry retain the captured original inspiration style and constraints; locks/Unset take priority.
- Deterministic seeded Joker respects the frozen validated snapshot and uses inspiration typography/palette/shape when supplied.
- Manual or countdown-triggered Generate reserves six ordered slots (Joker, quick AI, four additional AI), runs at most two AI requests simultaneously, delivers each result independently, scrolls only the generated rail to the batch start, preserves all session history, and never auto-selects.
- Server-only POST /api/generate uses the exact Interactions agent, validates request/output, normalizes locks/omissions, and records content-free outcome, latency, validity, and exposed usage.
- One shared eight-second countdown starts/resets only on CSS/inspiration changes. Final labels show Sending in 3/2/1…. Manual Generate/Retry cancel it; load and preview interactions do not arm or reset it. Active-batch edits never arm/queue a timer, and completion does not auto-send.
- Live CSS/inspiration edits are compared with the latest full batch's immutable context. During generation the footer explains that the batch uses earlier constraints; after completion or failure it indicates current constraints have not been used. Reverting inputs clears the notice. Manual generation consumes current inputs; retry preserves its original slot context without replacing the latest full-batch comparison.
- Client guards one active batch; server caps active requests at two. Explicit failed slots support manual retry with their original snapshot and no additional Joker. Auth, quota, network, timeout, incomplete, and malformed-output paths are sanitized. No automatic retry or provider fallback.

## Verification

Latest acceptance/handoff evidence is m18-v1-acceptance.md; m17-generation-edits-verification.md and m16-countdown-verification.md preserve focused edit/timer evidence. Real-provider evidence remains m15-live-measurements.json, independently reviewed and usage-summed during M18; m12-mvp-acceptance.md preserves the MVP acceptance boundary. Earlier reports and m11-live-measurements.json preserve historical milestone and real-provider evidence.

- npm test: **20 offline tests passed**, including schema/probe, constraint transitions, deterministic Joker, exact-agent request/output, sanitized failures, request bounds/origin/method, and server guard release.
- npm run build: **passed**, including TypeScript checks and production frontend compilation.
- npm run test:e2e: **47 Edge checks passed** on dedicated port 5174, including combined V1 journeys under both motion preferences, all previous desktop/transition/isolation tests, active-edit snapshot, completion/failure, retry, reversion, and final-response boundary checks. Desktop sizes: 1440×900, 1920×1080, 1280×720.
- Real application/provider check: **two completed full-schema results**, verified in Edge with a button background lock and an Unset card padding declaration. Latency **37,733 ms / 34,818 ms**; total usage **9,933 / 9,418 tokens**. Exact agent confirmed; no tool-use tokens. Cost unavailable.
- Two earlier full-contract calls failed validation; diagnostic stored-result inspection established terminal incomplete status for one, despite valid full-schema JSON. Requested budget increased from 8,000 to 16,000 before the two successful measurements. This was an explicit technical adjustment, never automatic retry.
- Live verification made four generation requests total during M10/M11 (two failed, two completed), plus two GET inspections of an existing failed interaction. M1's earlier probe is separate.
- M16 final source/public-assets/documentation/build scan passed with no credential leakage or trailing whitespace; built browser output contains no GEMINI_API_KEY name. git diff --check passed, and untracked files were explicitly scanned.
- M14 added one completed real exact-agent app generation with captured S4 inspiration while live inspiration changed to S2. Constraints passed; latency 37,781 ms; usage 12,490 total tokens (8,129 input / 536 output / 3,825 thought), cost unavailable. Sanitized evidence: m14-live-measurements.json. No automatic retry.
- M15 added one real five-request batch at peak concurrency two. All five exact-agent results passed shared inspiration, lock, and omission checks. Joker 58 ms; first AI 30,683 ms; full batch 115,653 ms; total usage 65,376 tokens; cost unavailable. G4 arrived before quick G3, as permitted. Evidence: m15-live-measurements.json.
- M16 visual QA inspected the pinned final-three-second button at 1440px. No new paid request occurred in M16. The browser test server has an explicit empty key, verified by an HTTP 503 check; normal dev/live verification credential handling is unchanged. Earlier M11/M14/M15 observations remain real-provider evidence.
- M17 visual QA inspected the pinned unused-constraints notice after partial failure at 1440×900. Six new fake-clock/mocked-response Edge checks passed; no new paid request occurred. Build and all 20 offline tests passed. No queued generation followed success, partial failure, total failure, reversion, retry, or a final-response-boundary edit. Source/assets/docs/build credential and whitespace scans and git diff --check passed, including explicit scanning of untracked files.
- M18 adds combined keyboard/timer/inspiration/six-slot/race/partial-failure/retry/history journeys under both motion preferences. Acceptance exposed an existing reduced-motion cancellation defect; the media rule now removes transition properties, verified against deliberately paused in-flight transitions. Final full suite passed 47/47; build and 20 offline tests passed. Visual QA inspected both journey screenshots at 1440×900. No new paid calls; source/assets/docs/build secret and whitespace scans passed.
- No deployment, commit, or push. Repository still consists of local untracked project files on master.

## Commands

| Command | Purpose |
|---|---|
| npm run dev | Loopback Node/Vite app, default 127.0.0.1:5173; STYLER_PORT override supported |
| npm test | Offline tests, no provider/network requests |
| npm run build | Typecheck + frontend production build |
| npm run test:e2e | Own temporary server on 5174, installed Edge; no real provider calls |
| node server/verify-live-app.ts | Explicit paid app check on 5175; one batch, five AI calls, at most two simultaneous. --inspiration checks captured inspiration for all five |
| npm run probe:antigravity | Explicit small-contract M1 probe; separate from full app generation |

Dev startup loads the server key without calling the provider. Live verification scripts must never be added to startup or default test commands. Normal user sessions on 5173 are left alone.

## Decisions and remaining limits

- V1 retains local loopback Node/Vite hosting and foreground per-style HTTP delivery. In the measured batch, individual provider durations were 28,846–56,006 ms; first AI was ready at 30,683 ms and the full batch at 115,653 ms. Browser deadline is 100 seconds per started request; provider deadline is 90 seconds per call. These deadlines do not include slot waiting time or prove that timed-out upstream work stopped.
- 16,000 requested token budget is not a verified spending cap: the incomplete 8,000-budget sample reported 11,812 total tokens.
- M15 uses two simultaneous AI requests per batch, and one active user batch. One measured five-request batch succeeded at that bound; wider concurrency and sustained quota capacity remain unverified.
- Sustained reliability, quota capacity, sustained/wider concurrent throughput, billing rates, hosted behavior, and hosting/public access controls remain unverified. Public hosting is not selected; a future deployment slice must define production serving, HTTPS/proxy origin handling, host lifetime limits, and access controls. The existing entry uses Vite development middleware; dist is frontend-only.
- History exists only in React session memory and clears on reload.
- Computed values outside the bounded vocabulary show an explicit capture notice. No arbitrary CSS authoring.
- Deferred V2 custom declaration lifetime remains undecided.

## Next action

Trial the accepted local V1 with npm run dev. The roadmap is complete. If public access is wanted, select a separate deployment target/scope; V2 authoring and its declaration lifetime still need a product decision. No further implementation or deployment has been started.
