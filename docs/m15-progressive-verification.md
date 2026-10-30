# M15 — Six-slot progressive generation

Completed 2026-10-30 (Europe/Brussels), authorized by the user's “Next” after M14.

## Implemented behavior

Each Generate action reserves six monotonically numbered session-history slots: Joker, quick AI, and four additional AI results. The same deeply frozen CSS/inspiration context belongs to all six. Joker resolves independently. Quick and the first additional request start together; either completed lane starts the next waiting slot. The server separately enforces the same limit of two active requests and rejects overflow rather than queuing server jobs.

Every slot becomes ready or failed independently. A failed, malformed, or unsafe result cannot discard successful siblings or block remaining work. One synchronous client guard holds until all AI slots and Joker settle. Manual retry reuses exactly the failed slot's captured context and creates neither another Joker nor another batch. Users can browse ready results and edit live constraints/inspiration throughout; those edits do not change waiting or active slots.

The generated rail scrolls to the start of each tall batch and does not follow later completions down the rail. Normal motion scrolls smoothly; reduced motion moves immediately. Existing selection, other rails, page scroll, input state, and original styles remain intact. Similar/identical AI results are accepted; no deduplication calls or automatic retries.

## Implementation and checks

- Shared configuration: five AI results, concurrency two.
- Browser owns a small two-worker loop over the five fixed slots. Each HTTP call owns its existing 100-second browser/90-second provider deadline, starting only when its lane starts. One slow quick slot does not block the other lane.
- Existing single-result JSON endpoint remains the transport; results arrive progressively through independent requests. No streaming/job service/database is needed for the local prototype.
- Server capacity guard counts two active requests and releases each lane in finally, including parse/size/terminal errors.
- App footer now describes six results; pending quick slot is labeled explicitly.
- npm test: 20 offline tests passed, including server capacity/release tests.
- npm run build: passed, including typecheck and production frontend build. Live-script typecheck also passed.
- npm run test:e2e: 33 Edge checks passed. The updated generation test controls completion order to prove quick independence, maximum two concurrent requests, captured queued-slot constraints, partial failure, batch guard lifetime, and a single-slot manual retry. Identical valid fixture styles are accepted.
- Tall-history scrolling passes with normal and reduced motion, targeting the first new Joker at the top while later slots remain below the viewport. Combined MVP and inspiration tests now exercise six-slot numbering and per-slot retry.
- Visual review inspected both normal-motion and reduced-motion tall-history views at 1280px.

## Live measurement

One explicit six-slot inspiration batch ran through the app on an owned temporary server at port 5175. It made exactly five paid requests to antigravity-preview-09-2026, at a measured maximum of two concurrent requests. All five completed with HTTP 200, exact-agent confirmation, valid styles, and preserved lock/Unset constraints. No retry, fallback, or additional deduplication request occurred.

All five captured the same original S4 inspiration and constraints even though the live UI changed to S2 after Generate. Seven history slots existed at completion: the existing G1 seed and six new results. The verification script selected the first successful AI only after the complete measurement; generation itself never selects a result.

| Measurement | Observed |
|---|---:|
| Joker ready | 58 ms |
| First AI response ready (G4, an additional slot) | 30,683 ms |
| Quick slot G3 ready | 31,163 ms |
| Full batch settled | 115,653 ms |
| Peak concurrent requests | 2 |
| Total exposed tokens across five calls | 65,376 |
| Approximate cost | unavailable |

| Slot | Start offset | Completion offset | Provider elapsed | Total tokens |
|---|---:|---:|---:|---:|
| G3, quick | 34 ms | 31,163 ms | 31,138 ms | 11,575 |
| G4, additional | 35 ms | 30,683 ms | 30,647 ms | 12,249 |
| G5, additional | 30,685 ms | 59,533 ms | 28,846 ms | 11,565 |
| G6, additional | 31,165 ms | 81,671 ms | 50,505 ms | 14,683 |
| G7, additional | 59,535 ms | 115,543 ms | 56,006 ms | 15,304 |

Completion order was G4, G3, G5, G6, G7. An additional result arriving before the quick result is accepted. Observed results were similar, and were retained without regeneration. Every call reported zero cached/tool-use tokens. The sanitized complete source is m15-live-measurements.json; the screenshot and ephemeral report are in ignored verification-results/.

This sample supports retaining concurrency two and independent foreground HTTP calls for the local prototype. It does not establish sustained reliability, quota capacity, predictable latency, billing rates, or safety of wider concurrency. The whole batch can outlast the individual 90-second provider deadline because each deadline begins when its own lane starts. The 16,000 requested per-call token budget remains a request setting rather than a verified spending cap.

## Final boundary

M1–M15 complete; M16 (shared eight-second countdown) is recommended next and not started. Generation remains manual, and active edits do not enqueue another batch. Timer behavior and stale-constraints messaging belong to M16/M17, with full V1 acceptance at M18.

20 offline tests, production build/typecheck, and 33 Edge checks passed. Source/assets/docs/build credential and whitespace scans passed; browser build contains no GEMINI_API_KEY variable name, and git diff --check passed. Visual QA inspected both tall-history motion modes at 1280px and the real AI result at 1440px. Existing app sessions on 5173 were left alone. No dependency, deployment, commit, push, database, mobile work, or V2 authoring was added.
