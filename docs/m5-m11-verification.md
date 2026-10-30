# M5–M11 verification

User authorized the next seven milestones without stopping on 2026-10-30, covering M5–M11 after completed M4.

## M5 — effective CSS inspector
Implemented stable selector/property groups, browser-computed values from canonical ShadowRoot representatives, inherited color rows, transition-settle and control-change refresh. The conditional switch group reads its track even when unchecked; selector condition still governs CSS application. Build passed; targeted Edge inspector check passed.

## M6 — declaration controls
Separate immutable validated constraints implement Free/Locked/Unset toggles. Lock reads the actual current computed value at click time and normalizes colors, numeric lengths, fonts, line height, and shadow into the bounded vocabulary. Out-of-vocabulary captures report an explicit message. Original styles remain immutable. Offline transition/constraint checks and Edge lock/Unset checks passed.

## M7 — native cascade
Locks compile in canonical selector/property order into the existing higher CSS layer. Original stylesheet source order remains intact. Browser checks cover overlapping button/details selectors, equal specificity source order, opposite lock click orders, inheritance, and unlocking. Three combined M5–M7 Edge checks passed; build/typecheck passed.

## M8 — seeded Joker
Deterministic seeded palette/shape/spacing variation uses immutable preset structure, validates through the shared schema, injects locks, and omits Unset declarations. Same seed/snapshot/ID returns identical content; different seeds vary. Offline reproducibility, omission, lock, and original-integrity checks passed. Existing G1 remains an honest selectable seed with no request on load. UI batch delivery is M9.

## Validation to this boundary
13 offline tests passed. Three targeted Edge checks passed on the isolated port 5174. Sandbox-local browser startup stalled; rerunning with permitted loopback access succeeded. No provider call or deployment in M5–M8.

## M9 — manual batch/history
Generate appends exactly two positions and monotonically increasing G IDs. Joker resolves independently; no result is auto-selected. An immutable validated snapshot belongs to both slots. Failed AI slots retain their identity and manual retry uses their original snapshot with no new Joker. New-batch scrolling targets only the generated rail and honors reduced motion. Build and two mock-response Edge checks passed, including edits during a pending request, no load/edit requests, retry identity, append-only history, and scrolling from older cards. This boundary was mock-only, not AI-complete.

## M10/M11 integration observations
The initial full-contract call returned an explicit failed slot; a second diagnostic call recorded exact-agent HTTP 200 with terminal status **incomplete**, not a schema parse failure. GET inspection of that same interaction (no regeneration) found valid JSON and a structurally valid full-schema style, but the endpoint deliberately rejected the non-completed terminal status. Recorded diagnostic sample: 49,176 ms; requested budget 8,000; exposed usage 11,812 total / 5,369 input / 578 output / 5,865 thought / 0 tools. The provider echoed the requested budget, but the total exceeds it; do not describe the budget as a verified spending cap. Cost unavailable. First call lacked detailed metrics persistence, so its latency/usage are unavailable. Both calls used the requested agent with no fallback or automatic retry.

The next explicit measurement increases the server-controlled budget to 16,000 for full-contract completion. This is a routine integration setting, not a provider change. Incomplete terminal status now has its own sanitized error. GET diagnostics retrieved an existing result only.


## M10 — real result completed
With requested budget 16,000, two real full-contract requests completed through the Node endpoint and Edge UI. Client/server schema validation, exact agent, captured button background (#344e41), and omitted card padding-top passed. Both results were selectable without remounting the preview. Original snapshot delivery is independently exercised by the pending-request browser test. Raw transcripts and key were not persisted. The first generated-result screenshot was removed by an overlapping test runner cleanup; the second was inspected. Future live checks use a separate ignored output directory.

## M11 — failure handling and measurements
Client synchronous-ref and server guards prevent duplicate active requests. Auth/quota/network/timeout/incomplete/invalid/oversized-output errors are explicit and sanitized. Offline tests verify single-attempt behavior, numeric usage on failed HTTP calls, body/method/origin bounds, and guard release after terminal failures. Browser tests verify same-tick double clicks, original-snapshot failed-slot retry with no new Joker, invalid output, pending edits, unchanged selection, and no load/edit request.

| Sample | Outcome | Server latency | Input | Output | Thought | Total |
|---|---|---:|---:|---:|---:|---:|
| Initial full contract | Rejected; detailed metrics not retained | unavailable | unavailable | unavailable | unavailable | unavailable |
| Diagnostic, budget 8,000 | HTTP 200 / incomplete; rejected | 49,176 ms | 5,369 | 578 | 5,865 | 11,812 |
| Budget 16,000, G3 | HTTP 200 / completed, valid | 37,733 ms | 5,369 | 634 | 3,930 | 9,933 |
| Budget 16,000, G5 | HTTP 200 / completed, valid | 34,818 ms | 5,369 | 599 | 3,450 | 9,418 |

Exact requested agent confirmed for the diagnostic and both successful calls. All exposed tool-use and cached-token counts were zero. Cost unavailable. Four explicit generation attempts total during M10/M11 and two GET inspections of the diagnostic interaction; no automatic retry. Detailed success reports: m11-live-measurements.json.

The sequential sample supports retaining foreground local transport and one active MVP request. It does not establish reliability, quota, billing rates, or concurrent performance. Future V1 should first measure at most two concurrent calls; five simultaneous requests are not justified yet. No V1 executor was implemented.

## Final boundary
M5–M11 complete, M12 recommended next. npm test: 18 passed; npm run build/typecheck: passed; npm run test:e2e: 20 passed. Existing desktop, preservation, transition, isolation, and keyboard checks remain green. Visual QA inspected the 1280px layout, generated-history view, and second real AI result. Credential-value and whitespace scan covered 53 source/docs/build files before final docs; final scan repeated after documentation. No key in source/output and no browser key variable name. git diff --check passed. Files remain local and uncommitted; no deployment. M12 full combined acceptance, V1 features, and V2 authoring were not started.
