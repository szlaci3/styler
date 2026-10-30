# M14 — Exclusive inspiration selection

Completed 2026-10-30 (Europe/Brussels). The user's “Next” selected M14 after completed M13.

## Working behavior

Every ready preset, seed, Joker, and AI card has a separate accessible Inspire toggle. Exactly one or none can be selected across both rails. Toggling the active control clears it; the inspector footer also identifies the current inspiration and provides Clear inspiration. Teal inspiration controls and the existing gold preview border show independent states.

Inspiration never selects the preview or applies CSS to it. Preview selection never changes inspiration. Both are session state; history remains append-only. Pending/error positions have no inspiration control until a valid style exists.

Manual Generate captures one immutable context containing CSS constraints and a copied original inspiration style. Joker and AI use that context; changes to inspiration or constraints during the request do not alter it. Manual retry reuses the failed slot's context, without another Joker. The original style is captured without live overrides; explicit CSS locks and Unset take priority over inspiration.

Joker preserves inspiration typography and varies its palette/geometry reproducibly, with smaller color/spacing/radius changes than unconstrained adventurous generation. It still validates through the same schema. AI receives validated inspiration data and explicit priority instructions; inspiration is guidance, while lock injection and Unset removal are deterministic acceptance normalization. No exact AI resemblance guarantee or extra regeneration is added.

## Implementation decisions

- shared/generation.ts defines the copied/frozen GenerationSnapshot (constraints plus nullable inspiration).
- Both slots retain the same context. The original CSS constraint-array wire field is preserved; an optional inspiration style is added. Server accepts old requests without it and explicit null, validates supplied styles, and rejects unknown fields/unsafe inspiration.
- App owns one nullable inspiration ID independent from selectedId; StyleCard owns no competing selection state.
- Server builds its prompt only from validated input. No credential/transcript is sent to the browser or stored in history.
- No new dependencies, provider, tools, automatic timer, fallback, deduplication, or batching behavior.

## Validation

- npm test: **20 offline tests passed**. New coverage includes deep copy/freeze, rejected malformed inspiration, exact-agent prompt context, constraint priority even over conflicting inspiration-like output, Joker determinism/inspired typography, original integrity, omission, and bounded fractional-spacing variation.
- npm run build: **passed**, including typecheck and production frontend build. Final typecheck including the optional live verification flag also passed.
- npm run test:e2e: **32 Edge checks passed**. Four new cases cover all three desktop widths (1280, 1440, 1920), keyboard selection/clearing, exclusive cross-rail state, preview/input/DOM independence, a fake-clock minute with no automatic request, original-style capture, pending edits, same-context retry, constraint priority in both results, and generated AI/Joker inspiration for later batches.
- Keyboard regression updated to expect the new independent inspiration control between adjacent preview-card buttons.
- Visual QA inspected the 1280px independent S3 preview/S2 inspiration state and the 1440px real AI result with S2 still selected for future inspiration.
- Final source/assets/docs/build credential and whitespace scan passed; browser build contains no GEMINI_API_KEY name. git diff --check passed, including an explicit scan of untracked project files.

## Real-provider evidence

One new bounded live app verification ran through server/verify-live-app.ts --inspiration on an owned temporary server at port 5175. It made exactly one paid generation request using antigravity-preview-09-2026, no automatic retries, and no fallback.

The batch captured S4 (Papercut), then the live UI changed to S2 (Blueprint) while awaiting AI. The request retained S4; the UI retained S2 after completion. The returned full-schema AI style passed both validators, captured button background #344e41, and omission of card padding-top. The original S4 background differed from the explicit lock, so the constraint had priority. A real result was selected only by the verification script after completion; generation itself never auto-selected.

| Measurement | Observed |
|---|---|
| HTTP / agent status | 200 / completed; exact agent confirmed |
| Generation latency | 37,781 ms |
| Total tokens | 12,490 |
| Input / output / thought tokens | 8,129 / 536 / 3,825 |
| Cached / tool-use tokens | 0 / 0 |
| Cost | unavailable |

Sanitized evidence is preserved in m14-live-measurements.json. Screenshot and ephemeral copies are in ignored verification-results/m14-*. The sample validates request capture, safe delivery, constraints, and a usable result; it does not establish consistent visual resemblance, sustained reliability, billing rates, or concurrent performance.

## Boundary

M1–M14 complete. **M15 — six-slot progressive generation** is recommended next and not started. Generation remains manual, exactly two new cards, and one active batch. Countdown and active-request timer coordination remain M16/M17. No hosting, deployment, commit, push, mobile work, database, or V2 authoring. History and inspiration clear on reload.
