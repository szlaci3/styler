# M16 — Shared eight-second countdown

Completed 2026-10-30 (Europe/Brussels), authorized by the user's “Next” after M15.

## Working behavior

One shared inactivity countdown starts or resets on CSS state changes (Locked, Unset, or Free) and inspiration selection/replacement/clearing across either rail. Before the final three seconds the button reads Generate, then Sending in 3…, Sending in 2…, Sending in 1…. At eight seconds it starts the existing six-slot batch and shows Generating…. Completion returns to Generate.

Manual Generate remains available with or without constraints and cancels the countdown. Manual Retry also cancels any pending countdown while preserving the failed slot's original context. No automatic retry occurs.

Page load does not arm the timer. Preview selection, hovering, scrolling, form controls, disclosures, and other sample-website interactions neither arm nor postpone an already running timer. Generated results never auto-select or change inspiration.

Active batches suppress countdown arming and never queue a follow-up. Live changes still update the preview and remain preserved in React state. Completion does not start another countdown; a later fresh constraint/inspiration edit can start one. The explicit unused-constraints indication and broader generation/edit race acceptance remain M17.

## Implementation decisions

- src/generation/useCountdown.ts owns exactly one scheduled timeout for both visible ticks and the send deadline, using monotonic performance.now. Each tick schedules the next second boundary; cancellation/restart clears the existing handle. Unmount cleanup clears it.
- Latest callback refs let expiry use current CSS/inspiration values without resetting because inspector values, preview selection, or unrelated state rendered.
- App compares committed CSS/inspiration inputs against its previous references. Initial StrictMode effects have identical inputs and do not arm a page-load countdown.
- Edit eligibility is recorded in the input handler and checked again against the synchronous generation guard when arming. An edit made while busy stays ineligible even if completion precedes its effect.
- Manual Generate and Retry cancel before calling the existing guarded generation operations. Countdown never alters the server adapter, request schema, result counts, concurrent limit, or immutable snapshot rules.
- Playwright's isolated test-server environment now explicitly supplies an empty GEMINI_API_KEY. Node's .env loader preserves that override. A real loopback endpoint check returns Missing server API key before any provider call, protecting the browser suite from paid requests if a timer test fails. The normal app and opt-in live command retain their existing key behavior.

## Verification

- npm test: **20 offline tests passed**.
- npm run build: **passed**, including TypeScript and production frontend compilation.
- npm run test:e2e: **39 Edge checks passed**, including six new cases.
- Five new cases use the actual app with a paused browser clock and mocked AI responses. They verify no request at 7,999 ms; one five-request batch at 8,000 ms; exact final-three-second labels; CSS/Free/Unset and both-rail inspiration resets; latest captured context; exclusions both before and during a countdown; keyboard manual cancellation; failed-slot retry cancellation; busy-state suppression; no completion-triggered follow-up; and a later fresh edit.
- The sixth new case verifies the test server rejects a valid generation request with HTTP 503/Missing server API key, without a real provider credential.
- Existing MVP/inspiration cases were updated for the intended V1 behavior. The earlier historical no-timer MVP acceptance is preserved in its report; current tests now assert no request on load/unrelated preview interactions and cancellation of a pending timer by manual generation.
- All prior desktop sizes, native cascade, persistent preview/control state, isolation, reduced motion, six-slot progression, partial failure/retry, original snapshots, and inspiration checks remain green.
- Visual QA inspected the pinned Sending in 3… state at 1440×900, with the inspector scrolled to a locked declaration. Screenshot: ignored test-results/m16-countdown.png.
- Final source/assets/docs/build credential and whitespace scans passed. Browser build contains no GEMINI_API_KEY variable name. git diff --check passed; untracked files were explicitly scanned.

No new provider request was made in M16. Mocked clock/network checks are not described as live provider results. M15's successful five-request concurrency sample remains the current real-provider evidence in m15-live-measurements.json. Provider behavior was unchanged; M16 adds frontend scheduling only. Cost, sustained quotas/concurrent performance, and hosting remain unverified beyond earlier samples.

## Boundary

**M1–M16 complete. Next: M17 — edits during active generation**, including explicit indication that current constraints have not yet been used, comparison with captured snapshots, and race/error/completion acceptance. The basic no-queued-countdown guard is already implemented because it is required for a safe timer; the M17 status indication has not been added. M18 full V1 acceptance remains later.

No deployment, commit, push, new dependency, persistence/database, mobile work, V2 authoring, or provider substitution. Existing app sessions on 5173 are left alone.
