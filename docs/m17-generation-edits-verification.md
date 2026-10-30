# M17 — Edits during active generation

Completed 2026-10-30 (Europe/Brussels), authorized by the user's “Continue” after M16.

## Working behavior

CSS locks and inspiration remain editable during an active six-slot batch. Locks update the preview immediately, while the running and waiting generation slots retain their original frozen inputs. Active edits never start or queue a countdown.

When live inputs differ, the pinned footer explains: “Edits apply to the preview. This batch uses earlier constraints.” After the batch ends, including partial or total AI failure, it reads: “Current constraints have not been used. Generate when ready.” This is an accessible status region described by the Generate button.

Reverting to the captured CSS/inspiration values clears the indication. Preview selection alone never makes inputs stale. A new full generation captures current inputs and clears the indication; it does not depend on the preceding batch succeeding. A fresh idle edit can start the shared eight-second timer. Completion and failed-slot retry do not schedule follow-up work.

Retry keeps its failed slot's original context without replacing the latest full batch's comparison context. This preserves an unused-input indication during an old-snapshot retry and prevents retrying an older card from making a newer, current batch appear stale. Failed slots continue showing explicit errors and manual Retry.

## Implementation decisions

- useGeneration stores lastBatchContext at the same boundary as the immutable generation snapshot. Retry does not modify it.
- App compares canonical constraint values and immutable inspiration IDs rather than counting edits. This deliberately avoids a false warning after input reversion.
- The status is derived during render, with no completion-effect callback, timer, request, or queue of its own. Existing countdown eligibility and synchronous batch guards retain their M16 responsibilities.
- Scope is frontend state and presentation. Provider contract, server concurrency, budgets, timeouts, style validation, snapshot immutability, and CSS cascade remain unchanged.

## Verification

- npm test: **20 offline tests passed**.
- npm run build: **passed**, including TypeScript and production frontend compilation.
- Six new targeted Edge tests passed with paused browser clocks and mocked AI responses.
- Full npm run test:e2e: **45 Edge checks passed**, including existing desktop, keyboard, reduced-motion, persistent preview, cascade, progressive generation, history, inspiration, timer, and retry checks.
- The new cases verify immediate computed button background preservation across style changes; CSS lock/Unset and inspiration edits during a batch; identical captured inputs across all five requests; success, partial failure and total failure; no automatic follow-up after sixty seconds; manual generation of current inputs after each outcome; input reversion; old-snapshot manual retry; a later fresh edit firing at 8,000 ms; and a synchronous edit immediately before release of the final held response.
- At the final-response boundary, the test dispatches the edit while the batch guard is busy, then releases the final response through a browser binding. This checks event ordering deterministically instead of relying on random network timing.
- Visual QA inspected the pinned unused-constraints indication after partial failure at 1440×900. Screenshot: ignored test-results/m17-unused-constraints.png.
- Source, public assets, documentation, and build scan passed with no credential leakage or trailing whitespace; built browser output contains no GEMINI_API_KEY name. git diff --check passed; untracked project files were explicitly scanned.

The first sandboxed browser attempt stalled before the local test server became available and was interrupted. The targeted and full Edge runs used approved execution outside that sandbox, with the existing temporary port-5174 server configuration and explicit empty test-server API key. No real provider requests were made. Current provider evidence remains m15-live-measurements.json, including its five-result batch at concurrency two. No new provider reliability, billing, quota, or hosting claims are made.

## Boundary

**M1–M17 complete. Next: M18 — V1 acceptance and measured handoff.** Full V1 sign-off and hosting selection remain pending. M17 adds no deployment, commit, push, dependency, persistence, mobile work, V2 authoring, automatic retry, or provider substitution. Existing app sessions on 5173 are left alone.
