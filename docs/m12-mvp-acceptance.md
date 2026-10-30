# M12 — MVP acceptance and handoff

Completed 2026-10-30 (Europe/Brussels). Authorized by the user's “Continue: M12” instruction after M1–M11. The local desktop MVP is accepted; V1 begins at M13.

## Acceptance result

The complete manual generation journey passes in installed Edge with normal motion and with reduced motion. All earlier desktop, cascade, isolation, schema, provider-adapter, and failure-handling checks remain green.

| Requirement | Observed evidence |
|---|---|
| Four columns, independent scrolling, visible Generate | Existing desktop tests pass at 1440×900, 1920×1080, and 1280×720 |
| Effective values, inherited/default values, stable selector groups | Inspector checks pass; discovered generated declarations remain inspectable throughout session history |
| Multiple locks across selections | Combined journey locks button background and card padding, switches presets, and verifies browser CSS |
| Free/Locked/Unset controls | Combined keyboard/mouse journey clears a padding lock via Unset and immediately reveals selected-style padding |
| Omission in both results | Combined journey checks selected Joker and mocked AI stylesheets omit card padding-top |
| Captured immutable snapshot | Pending-request edit changes live state; retry request exactly matches original snapshot |
| Instant local Joker and independent AI slot | Joker becomes selectable while AI is held pending; two slots reserved, no auto-selection |
| Errors and manual retry | Combined quota failure/retry preserves slot ID and produces no extra Joker; timeout error is visible in separate fake-clock check |
| History and mandatory scroll | Generate while browsing G1 appends G10/G11, scrolls generated rail into view, and preserves all other rail/page positions |
| Preview state/DOM integrity | Email, switch, open details, and original preview element survive preset/Joker/AI selections |
| Reduced motion and keyboard | Complete journey repeated with both motion preferences; Space/Enter operate locks, Unset, Generate, Retry, and result selection |
| No automatic timer or request | Fake-clock check advances one minute after load and another after constraint/style/preview interactions; no request occurs until explicit Generate; another minute after failure/edit triggers no retry |
| Session-only history | Reload restores G1 and clears constraints without starting a request |
| Browser isolation and unsafe result rejection | Existing ShadowRoot isolation, malformed/unsafe result, source-order, and request-guard checks pass |

The combined browser journeys use deterministic mocked provider responses to control pending/error/retry scenarios. They are not new live-provider measurements.

## In-scope fixes

1. **Generated declarations missing from inspector.** Previously the row vocabulary came only from presets, so valid AI properties absent from presets could not be inspected or locked. Inspector groups now include declarations from all accepted generated history, retain those rows across later selections, and read their effective browser values. The combined test adds heading background-color to an AI result, captures it, selects a preset that omits it, then unlocks and verifies the transparent default and intact original generated style. No custom property authoring was added.
2. **Font-weight capture during animation.** A computed font weight can be fractional between curated weights; the previous enum rejected that otherwise supported effective value. The shared validator now accepts numeric weights 400–800 with at most two decimals; capture rounds computed precision accordingly. A real browser test pauses a transition halfway, locks its fractional weight, and verifies it survives style selection. Offline bounds/injection checks cover this narrowly broadened grammar. Other CSS value bounds are unchanged.

## Checks run

- npm test: **18 passed**.
- npm run build: **passed**, including TypeScript and the frontend production build.
- npm run test:e2e: **24 passed**, including four new browser checks (three M12 acceptance cases and interpolated-weight regression).
- Visual QA inspected the normal-motion combined journey at 1440×900 and the minimum 1280×720 initial layout. Screenshots are in ignored test-results/.
- Final source/documentation/build scan: no credential value leakage, no browser GEMINI_API_KEY name, and no trailing whitespace.
- git diff --check passed. Most project files are still untracked, so explicit scans are the meaningful new-file checks.

No new packages were added. No live request, deployment, commit, or push was made in M12.

## Real-provider evidence and limits

M11 already completed two real exact-agent full-schema generations through the Node endpoint and Edge UI. The preserved source is m11-live-measurements.json, inspected during M12. Both results passed validation, captured background lock, and Unset omission. Observed latency: **37,733 ms and 34,818 ms**. Exposed total usage: **9,933 and 9,418 tokens**, with zero tool-use tokens. Cost remains unavailable. Earlier incomplete-generation evidence and explicit budget adjustment remain documented in m5-m11-verification.md.

These observations establish a working local integration, not sustained reliability, billing rates, quota capacity, concurrent throughput, or hosted operation. M12 changes did not alter the provider adapter, identity, transport, request count, retry behavior, or credentials. Fractional font-weight validation is broadened locally; a new real-provider fractional-weight constraint sample was not run.

Provider timeout is 90 seconds, browser timeout 100 seconds, requested token budget 16,000. Neither the budget nor an aborted local request is a verified spending/cancellation guarantee. Incomplete/invalid output remains an explicit failed card with manual retry and no provider fallback.

## Run and resume

Use Node 24.10+, npm ci if dependencies are absent, then npm run dev and open http://127.0.0.1:5173. The ignored .env supplies GEMINI_API_KEY only to the Node process. Nothing calls the provider until Generate or manual Retry. npm run test:e2e owns port 5174 and leaves existing sessions on 5173 alone. Optional paid verification uses server/verify-live-app.ts on 5175 and is never part of startup/default tests.

The prototype keeps history only until reload. CSS remains bounded, fonts are local/system fonts, desktop minimum width is 1280px, and original styles remain immutable. Computed captures outside the bounded vocabulary report a notice. Hosting and public-use access controls remain undecided.

## Boundary and next milestone

**M1–M12 complete: local desktop MVP accepted.** Next recommend **M13 — richer coherent sample website**, preserving the current fictional content/state model while adding navigation, imagery, richer cards, and controls. M13 is not started or authorized by this M12 instruction. Inspiration, six-result batches, countdown, and generation-edit coordination remain M14–M18. V2 custom declaration authoring and lifetime remain deferred.
