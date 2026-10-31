# Current development status

Last updated: 2026-10-31 (Europe/Brussels).

## Authority and scope

- Roadmap and architecture approved on 2026-10-30. Original requirements remain in product-specification.md.
- User authorized M5–M11 together, then M12–M18 through successive milestone selections, including “Continue” after M17. **M1–M18 are complete: local desktop V1 has passed acceptance and measured handoff.**
- The original roadmap ends at M18. The user subsequently authorized backend migration to Netlify and explicitly chose background generation. **The migration is implemented and locally verified; no hosted deployment has been performed.** V2 remains deferred.
- Existing ignored GEMINI_API_KEY is authorized for integration, server-side only. Exact agent remains antigravity-preview-09-2026.
- Follow-on request on 2026-10-31: internally copy only `.sample-card` border colors and padding into new Antigravity results from captured inspiration, with per-declaration G1 fallback. Explicit locks and Unset remain authoritative. No UI controls or Joker changes; other AI card properties remain generated. User requested commit and push to main.

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
- Client guards one active batch and at most two AI slots, including hosted polling. The local server caps active requests at two; that counter does not enforce global serverless concurrency. Explicit failed slots support manual retry with their original snapshot and no additional Joker. Auth, quota, network, timeout, incomplete, and malformed-output paths are sanitized. No automatic retry or provider fallback.
- Netlify configuration builds the frontend and deploys start/health, signed background worker, status and hourly-cleanup functions. Strongly consistent Blobs holds temporary job state; atomic claims prevent duplicate deliveries from repeating paid work. Provider deadline remains 90 seconds; job/polling deadline is 150 seconds. Visible history remains session-only.

## Verification

2026-10-31 card-treatment follow-on: **29 offline tests passed**, including inspiration/G1 per-declaration fallback, missing card rules, preservation of all other AI properties, captured-context retry, lock/Unset priority, immutability and rejection of unsafe card values before normalization. **49 Edge checks passed** using mocked provider responses; **app build**, **Netlify function packaging**, and **git diff --check** passed. No paid request or hosted verification was performed for this change. The requested implementation is complete; hosted deployment verification remains the next separate action below.

Latest hosting-migration evidence and deployment instructions are in netlify-deployment.md. Local V1 acceptance remains m18-v1-acceptance.md; m17-generation-edits-verification.md and m16-countdown-verification.md preserve focused edit/timer evidence. Real-provider evidence remains m15-live-measurements.json, independently reviewed and usage-summed during M18; m12-mvp-acceptance.md preserves the MVP acceptance boundary. Earlier reports and m11-live-measurements.json preserve historical milestone and real-provider evidence.

- npm test: **26 offline tests passed**, including schema/probe, constraint transitions, deterministic Joker, exact-agent request/output, sanitized failures, request bounds/origin/method, server guard release, and background job lifecycle/idempotency/error/expiry checks.
- npm run build: **passed**, including TypeScript checks and production frontend compilation.
- npm run test:e2e: **49 Edge checks passed** on dedicated port 5174, including background polling beyond a simulated minute and original-snapshot manual retry, combined V1 journeys under both motion preferences, all previous desktop/transition/isolation tests, active-edit snapshot, completion/failure, retry, reversion, and final-response boundary checks. Desktop sizes: 1440×900, 1920×1080, 1280×720.
- npm run build:functions: **passed**, packaging four functions with Netlify's official tool and checking API routes, background invocation and the hourly schedule. TypeScript 6 is used for function-packager compatibility; application typecheck/build pass.
- Migration source/assets/docs/build scan passed across 88 files, including untracked additions; browser output contains no key name or server worker/storage material. All 60 function-archive entries passed the .env/actual-key check. git diff --check passed.
- Real application/provider check: **two completed full-schema results**, verified in Edge with a button background lock and an Unset card padding declaration. Latency **37,733 ms / 34,818 ms**; total usage **9,933 / 9,418 tokens**. Exact agent confirmed; no tool-use tokens. Cost unavailable.
- Two earlier full-contract calls failed validation; diagnostic stored-result inspection established terminal incomplete status for one, despite valid full-schema JSON. Requested budget increased from 8,000 to 16,000 before the two successful measurements. This was an explicit technical adjustment, never automatic retry.
- Live verification made four generation requests total during M10/M11 (two failed, two completed), plus two GET inspections of an existing failed interaction. M1's earlier probe is separate.
- M16 final source/public-assets/documentation/build scan passed with no credential leakage or trailing whitespace; built browser output contains no GEMINI_API_KEY name. git diff --check passed, and untracked files were explicitly scanned.
- M14 added one completed real exact-agent app generation with captured S4 inspiration while live inspiration changed to S2. Constraints passed; latency 37,781 ms; usage 12,490 total tokens (8,129 input / 536 output / 3,825 thought), cost unavailable. Sanitized evidence: m14-live-measurements.json. No automatic retry.
- M15 added one real five-request batch at peak concurrency two. All five exact-agent results passed shared inspiration, lock, and omission checks. Joker 58 ms; first AI 30,683 ms; full batch 115,653 ms; total usage 65,376 tokens; cost unavailable. G4 arrived before quick G3, as permitted. Evidence: m15-live-measurements.json.
- M16 visual QA inspected the pinned final-three-second button at 1440px. No new paid request occurred in M16. The browser test server has an explicit empty key, verified by an HTTP 503 check; normal dev/live verification credential handling is unchanged. Earlier M11/M14/M15 observations remain real-provider evidence.
- M17 visual QA inspected the pinned unused-constraints notice after partial failure at 1440×900. Six new fake-clock/mocked-response Edge checks passed; no new paid request occurred. Build and all 20 offline tests passed. No queued generation followed success, partial failure, total failure, reversion, retry, or a final-response-boundary edit. Source/assets/docs/build credential and whitespace scans and git diff --check passed, including explicit scanning of untracked files.
- M18 adds combined keyboard/timer/inspiration/six-slot/race/partial-failure/retry/history journeys under both motion preferences. Acceptance exposed an existing reduced-motion cancellation defect; the media rule now removes transition properties, verified against deliberately paused in-flight transitions. Final full suite passed 47/47; build and 20 offline tests passed. Visual QA inspected both journey screenshots at 1440×900. No new paid calls; source/assets/docs/build secret and whitespace scans passed.
- No deployment, commit, or push performed by this migration. Current tracked baseline is on master; migration files/changes remain local. No new paid request, cloud storage write or Netlify environment-variable update was made.

## Commands

| Command | Purpose |
|---|---|
| npm run dev | Loopback Node/Vite app, default 127.0.0.1:5173; STYLER_PORT override supported |
| npm test | Offline tests, no provider/network requests |
| npm run build | Typecheck + frontend production build |
| npm run build:functions | Official Netlify function packaging and manifest verification; no deployment or provider request |
| npm run test:e2e | Own temporary server on 5174, installed Edge; no real provider calls |
| node server/verify-live-app.ts | Explicit paid app check on 5175; one batch, five AI calls, at most two simultaneous. --inspiration checks captured inspiration for all five |
| npm run probe:antigravity | Explicit small-contract M1 probe; separate from full app generation |

Dev startup loads the server key without calling the provider. Live verification scripts must never be added to startup or default test commands. Normal user sessions on 5173 are left alone.

## Decisions and remaining limits

- npm run dev retains loopback Node/Vite and foreground per-style HTTP delivery. Netlify now has background worker/polling deployment source, with the same 90-second provider deadline and a 150-second job deadline. In the earlier local foreground sample, individual provider durations were 28,846–56,006 ms; first AI was ready at 30,683 ms and the full batch at 115,653 ms. These are not hosted background measurements, and timeouts do not prove that upstream work stopped.
- 16,000 requested token budget is not a verified spending cap: the incomplete 8,000-budget sample reported 11,812 total tokens.
- M15 uses two simultaneous AI requests per batch, and one active user batch. One measured five-request batch succeeded at that bound; wider concurrency and sustained quota capacity remain unverified.
- Sustained reliability, quota capacity, wider concurrent throughput, billing rates, hosted behavior, and hosting/public access controls remain unverified. Netlify is selected and background deployment source is ready; actual deployment, real self-dispatch/Blobs/cleanup, and any site access protection remain unverified. dist is frontend-only: deploy the repository with Functions, not just the static folder.
- History exists only in React session memory and clears on reload.
- Computed values outside the bounded vocabulary show an explicit capture notice. No arbitrary CSS authoring.
- Deferred V2 custom declaration lifetime remains undecided.

## Next action

Deploy the repository to Netlify using netlify.toml, set GEMINI_API_KEY with Functions scope and Production context, then verify /api/health and one deliberate paid batch. See netlify-deployment.md. No cloud action has been performed here. V2 authoring and its declaration lifetime still need a separate product decision.
