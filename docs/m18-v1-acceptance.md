# M18 — V1 acceptance and measured handoff

Completed: 2026-10-30 (Europe/Brussels). Authorized by the user's “Continue” after M17. **M1–M18 complete; local desktop V1 accepted.**

## Acceptance scope

M18 verifies the completed local desktop V1, including the richer sample website, exclusive inspiration, six-slot progressive batches, shared eight-second countdown, and active-generation edits. It adds a combined browser acceptance journey under both motion preferences, fixes cancellation of in-flight preview transitions when reduced motion is enabled, and updates handoff documentation. Provider behavior and execution settings remain unchanged.

The two new tests in tests/browser/v1.spec.ts run the real React application in installed Edge with a paused clock and mocked AI HTTP responses. Each journey:

1. Checks that page load and preview interaction send no AI request, then creates two older six-slot batches.
2. Uses keyboard controls to choose a generated inspiration, capture a button background lock, and Unset card padding. Checks the 3/2/1 labels and no send at 7,999 ms.
3. Lets the timer append six positions at eight seconds, resolves Joker independently, checks two AI lanes and mandatory scrolling to the batch start without moving other columns or selecting a result.
4. Changes live inspiration/CSS and preview selection during generation. Confirms the lock still controls rendered appearance, and both active and waiting requests retain the original constraints and original inspiration.
5. Delivers an additional AI before quick AI, fails one sibling, and finishes the others. Verifies partial results remain usable, the guard lasts until the batch settles, and unused live constraints are indicated without a queued request.
6. Retries only the failed slot with its original context through the keyboard, without appending cards. Selects that result and checks compiled lock/omission output, retained preview DOM, email and switch state.
7. Selects a generated inspiration, waits to the final countdown second, and manually sends with the keyboard. Checks current inputs, cancellation, another six appended cards, retained older history, mandatory generated-rail scrolling, no automatic selection, no later duplicate batch, and no browser errors.

Existing focused tests remain responsible for native source order, specificity/inheritance, unsafe schema rejection, all declaration transitions, capture during animations, shared timer resets/exclusions, desktop sizes, richer form state, ShadowRoot isolation, final-response races, total failure, and older-snapshot retry. Historical MVP reports retain their original manual-only boundary; the current application is V1.

## Validation

- npm test: **20 offline tests passed**.
- npm run build: **passed**, including TypeScript and frontend production compilation.
- Targeted combined V1 browser journeys: **2 Edge tests passed**, with reduce and no-preference motion.
- Focused transition/isolation checks after the reduced-motion fix: **4 Edge tests passed**.
- Final full npm run test:e2e: **47 Edge checks passed** on temporary port 5174, including desktop checks at 1280×720, 1440×900, and 1920×1080.
- Visual QA inspected the 1440×900 combined-journey screenshots for both motion preferences, with independently scrolling rails, retained preview, inspired generated card, declaration controls, and pinned Generate footer. Ignored artifacts: test-results/m18-v1-reduce.png and test-results/m18-v1-no-preference.png.
- Source/public-assets/docs/build credential and trailing-whitespace scans passed, including untracked files; compiled browser output contains no GEMINI_API_KEY name. git diff --check passed.

The initial full run passed 46 of 47 checks and found the existing reduced-motion assertion intermittently observing transitions after the preference changed. Pausing transitions before the preference change made the issue deterministic: zero duration prevented new transitions but did not cancel existing ones. The reduced-motion CSS now sets transition-property: none as well as zero duration/delay. The strengthened test verifies positive active-animation count before switching, zero computed duration afterward, final rendered color, and eventual zero animation count. Paused animations cannot finish naturally, so this validates cancellation rather than waiting out the original 320 ms. No arbitrary sleep or test retry was added.

Browser tests use the temporary loopback port-5174 server with an explicit empty server API key. Requests are mocked; the endpoint credential-isolation test verifies HTTP 503 for an otherwise valid unmocked request. No paid request or live probe was made during M18. The normal port-5173 app session is left alone.

## Real-provider measurements reviewed

The owning evidence is docs/m15-live-measurements.json, captured during M15 on 2026-10-30 with the exact antigravity-preview-09-2026 agent. M18 reread that file and checked all five success/constraint/inspiration flags and summed numeric usage. This is a review of the existing live sample, not a new provider run or sustained reliability claim. M16–M18 changed frontend scheduling/feedback/acceptance, with no provider contract or execution-setting change.

| Observation | Measured value |
|---|---:|
| Local Joker ready | 58 ms |
| First AI ready (additional G4) | 30,683 ms |
| Quick AI ready (G3) | 31,163 ms |
| Full batch, including UI settling | 115,653 ms |
| Individual provider latency range | 28,846–56,006 ms |
| AI results accepted | 5 of 5 |
| Peak simultaneous requests | 2 |
| Input tokens, summed | 40,645 |
| Output tokens, summed | 2,691 |
| Thought tokens, summed | 22,040 |
| Tool-use tokens, summed | 0 |
| Total exposed tokens | 65,376 |
| Defensible request/batch cost | Unavailable |

Completion order was G4, G3, G5, G6, G7. Similar results and out-of-order completion remain permitted. Earlier M11 samples included two failed full-contract attempts before the explicit budget adjustment, followed by two successes; this handoff does not present the latest five successes as an all-history success rate. M14 separately established one successful full-schema inspiration request. See their original reports/JSON for evidence and limits.

## Concurrency, transport, and hosting decision

Retain one active batch and two concurrent AI calls, configured in shared/generation.ts and independently enforced by server/generation-api.ts. Two lanes succeeded in the measured five-request batch, deliver partial results independently, and avoid a dependency on the quick result. There is no measurement supporting wider concurrency or lower cost from bundling four styles. Keep the current configuration until a specific need warrants another bounded measurement.

Each browser fetch has a 100-second deadline; each server provider request has a 90-second deadline. Slots begin their deadlines when a lane starts them, so the measured 115.7-second full batch does not mean one HTTP request exceeded those deadlines. Abort/deadline handling is not evidence that upstream paid work has stopped. The requested 16,000-token budget is not a verified spending cap; an earlier incomplete request with an 8,000-token budget reported 11,812 total tokens.

**Hosting decision for this release: retain the local loopback Node/Vite prototype and foreground per-style HTTP delivery.** It supports the measured request lifetimes without adding job storage or background orchestration. No public host is selected or configured. A frontend dist build alone cannot run the server API; the existing Node entry uses Vite development middleware and is not a production static-file server.

A later explicitly selected deployment slice must establish a production Node/static serving path, keep the key server-side, adapt origin handling for the intended HTTPS/proxy setup, confirm that host's request-lifetime limits, and choose access controls before exposing a paid endpoint publicly. Those are deployment decisions, not missing local V1 features. No host-specific recommendation or claim of hosted verification is made here.

## Remaining limits and handoff

- Sustained success rate, repeated-batch quota capacity, wider throughput, real-provider behavior of every failure branch, applicable billing rates, and hosted operation remain unverified. Mocked failures verify application behavior only.
- CSS uses the closed schema and canonical representatives, not arbitrary declaration authoring. Unsupported computed captures show an explicit notice. Native browser layers, specificity, inheritance, and stylesheet order remain authoritative.
- History is session memory and clears on reload. There is no database or persistence promise.
- Local Joker remains independent of Antigravity. No model substitution, automatic provider fallback, automatic retry, or deduplication is present.
- V2 custom declarations and their lifetime remain deferred. No mobile work or deployment is part of this milestone.

All authorized roadmap milestones end at M18. The next recommended activity is a user trial of local V1. If public access is desired, select a separate deployment scope and target; V2 requires its own product decision. No further implementation milestone is implicitly authorized. No commit, push, or deployment occurred; the repository remains local untracked project files on master.
