# Styler

Desktop website style explorer, developed one milestone at a time. The approved M1–M18 roadmap is complete and local desktop V1 is accepted. The app includes effective CSS inspection, live declaration locks, seeded Joker generation, real Antigravity results, a richer sample website, exclusive inspiration, six-result progressive batches, a shared eight-second countdown, and active-generation edit feedback. The Netlify backend migration is now implemented using background generation and temporary Blobs job storage; hosted deployment remains unverified. V2 is still deferred. See docs/netlify-deployment.md for deployment steps.

Read `AGENTS.md` and `docs/status.md` to resume. Product requirements, architecture, and the roadmap are in `docs/`.

## Run the local application

Requires Node 24.10+ and npm. Run `npm ci`, then `npm run dev` and open [the local application](http://127.0.0.1:5173). The Node server loads the ignored server-side key and serves the Vite application, `/api/health`, and the explicit POST `/api/generate` endpoint on one loopback origin. Stop it with Ctrl+C. Port 5173 must be available.

Select S1–S7 to change the sample website's appearance. G1 is a selectable seed, explicitly labeled as such. Selection preserves email input, switch state, and open card details. Suitable style properties transition over 320 ms; reduced-motion users get immediate changes. The preview lives in a persistent ShadowRoot that isolates its CSS from the surrounding application. The expanded sample includes local studio illustrations, section navigation, selectable memberships, a visit form with dropdowns and notes, FAQs, the quiet-hours switch, and newsletter form. Controls and open details retain state across styles. Forms only show local confirmations; no booking, subscription, or email is sent. The inspector shows effective browser values. L locks a declaration's current value; U removes its lock and asks future generation to omit it. Toggle either off to return to Free. Locks persist across selections without changing original style data. Supported declarations discovered in generated history remain available in the inspector across selections. Use a card’s separate Inspire button to choose one inspiration across both rails; click it again or Clear inspiration to remove it. Inspiration never changes the preview. Generate and Retry capture the original inspiration plus CSS constraints; locks and Unset take priority. Generate reserves six cards: an immediate seeded Joker, a quick AI slot, and four additional AI slots. At most two AI requests run simultaneously; each result appears as soon as it settles. The generated column scrolls to the beginning of the batch while selection and session history stay intact. Failed AI slots have manual Retry, using the original snapshot. Changing CSS constraints or inspiration starts/resets one eight-second countdown, with Sending in 3/2/1… during its final seconds. Manual Generate sends immediately and cancels it. Preview selection, hover, scrolling, and sample interactions do not arm or reset it. Active-batch edits update the preview without queuing another request; completion does not auto-send. The footer explains when a running batch uses earlier inputs and when current constraints have not been used. Reverting to captured inputs clears that notice. There is one active batch. Successful cards remain usable while siblings are pending or failed; Retry targets one failed slot after the batch settles and cancels any pending countdown. Starting the app or selecting a preset does not call Antigravity or expose the server-side API key to the browser.

`npm run build` typechecks all code and builds the frontend into `dist/`. `npm test` runs 26 offline tests. `npm run test:e2e` starts and stops its own dev server on port 5174 and runs 49 desktop checks in installed Microsoft Edge. The separate test port lets your normal app keep running on 5173. Browser tests explicitly use an empty server API key and mocked generation responses, so timer tests cannot consume provider quota. `STYLER_PORT` can override the dev server's port (1024–65535). Screenshots are written to ignored `test-results/`. No browser download is needed on this Windows host. On another host, install Edge or explicitly change the Playwright channel.

See the milestone reports in `docs/`, most recently `docs/m18-v1-acceptance.md`, for completed behavior and its limits. Local development retains the loopback Node/Vite server. Netlify deployment source is now included: deploy the repository with its Functions, not only dist. The server API runs in background Functions with browser polling; see docs/netlify-deployment.md.

## M1 commands

Requires Node 24.10+ and npm. Run `npm ci`, then `npm run typecheck` and `npm test`. Tests do not load `.env` or make network requests.

Put the intended Google API key in the ignored `.env` as `GEMINI_API_KEY=...`. Never use a browser-prefixed environment variable.

`npm run probe:antigravity` starts exactly one paid/quota-consuming request to `antigravity-preview-09-2026`. It uses a 6,000-token requested budget, JSON-schema response format, no explicit tools, and a 90-second client timeout. It prints sanitized metadata, not the key or raw response. It does not retry or switch agents. A client timeout does not establish that upstream execution stopped.

To inspect an existing result without generating again:

```powershell
node --env-file=.env server/probe-antigravity.ts --inspect INTERACTION_ID
```

The optional manual `--plain` diagnostic uses the same agent with prompt-requested JSON and local validation, without server JSON-schema enforcement. It is never invoked automatically. Run it directly through Node if needed; npm 12 on this host rejected forwarding `--inspect` through `npm run ... --`.

The small M1 contract is intentionally not the full application style schema. See `docs/m1-antigravity-verification.md` for actual live results and verification limits.


## Full app live verification

The key remains server-side; dev startup makes no AI call. In the measured five-result batch, individual provider durations ranged from 28.8 to 56.0 seconds; first AI was ready in 30.7 seconds and the full batch in 115.7 seconds. Request cost is unavailable. A 90-second provider deadline and requested 16,000-token budget do not establish a spending/cancellation guarantee. No automatic retry or fallback model exists.

Run `node server/verify-live-app.ts` only when you intend to consume provider quota: it starts its own local server on 5175, uses installed Edge, and generates one six-slot batch with five paid exact-agent requests and a maximum of two simultaneous calls. It waits for every slot, retains partial-failure evidence, and never retries automatically. Keep 5175 free. It checks a captured lock and Unset omission and writes sanitized measurements/screenshots into ignored `verification-results/`. This is separate from the small M1 probe and from offline/browser tests. Latest completed batch evidence is preserved in `docs/m15-live-measurements.json`.

The default app stays on 5173; browser tests use 5174. Netlify is configured in netlify.toml. A frontend-only upload does not deploy the Functions backend.


For an inspiration-specific batch check, run `node server/verify-live-app.ts --inspiration`. This also makes **five paid AI calls**, in one batch. It captures S4, changes the live inspiration to S2 while work is in progress, and verifies every request retains the original context and explicit CSS constraints. Results are written to `verification-results/m15-live-measurements.json` with a screenshot. Individual request deadlines are unchanged; the complete two-lane batch may take several minutes. The earlier single-result M14 observation remains in `docs/m14-live-measurements.json`.

AI inspiration is visual guidance; captured CSS constraints are enforced deterministically. Identical or similar AI results are accepted without further calls. The automatic countdown is implemented; it sends only after eligible CSS/inspiration changes, never on page load. In the completed live batch, Joker appeared in 58 ms, first AI in 30.7 seconds, and all five AI slots settled in 115.7 seconds at concurrency two. Exposed total usage was 65,376 tokens; cost remains unavailable.

## Deploy to Netlify

The repository now contains the frontend plus start/health, background worker, status and scheduled-cleanup functions. Netlify reads netlify.toml: build command npm run build, publish directory dist, functions directory netlify/functions, Node 24. Set GEMINI_API_KEY in Project configuration → Environment variables with Functions scope and the desired deploy contexts, then deploy/redeploy. Keep the key out of VITE_ variables and Git. Netlify Blobs stores temporary jobs; no additional storage token or database setup is required in the hosted modern Functions runtime.

Background generation acknowledges immediately, keeps the existing 90-second provider deadline, and polls for at most 150 seconds. Atomic claims prevent duplicate background deliveries from repeating paid work. A failed job requires manual Retry. Visible history still clears on reload; transport records expire after 24 hours and hourly cleanup removes older entries. The two-request browser limit is per app session, not a global serverless quota.

Run npm run build:functions to verify the four Netlify function packages and route/background/schedule manifest locally. This command does not deploy. See [Netlify deployment and verification](docs/netlify-deployment.md) for the full steps and remaining cloud checks. No hosted or paid verification has been performed for this migration.
