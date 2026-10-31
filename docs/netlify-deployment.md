# Netlify background generation

Implemented locally on 2026-10-30 (Europe/Brussels), after the user selected Netlify deployment and explicitly chose background generation. This extends the completed M1–M18 local roadmap. It does not implement V2 or publish a site.

## What is deployed

Netlify serves the Vite frontend from dist. Four Netlify Functions provide the hosted backend:

| Function | Route or trigger | Responsibility |
|---|---|---|
| generate | POST /api/generate | Validate and save one frozen style request, dispatch a signed worker once, return HTTP 202 with an opaque job ID |
| generate | GET /api/health | Return health without loading a key or initializing job storage |
| generate-background | Internal POST /.netlify/functions/generate-background | Verify signature, atomically claim the job, call the existing exact-agent adapter once, store result or terminal error |
| generation-status | GET /api/generation-status?job=… | Return pending, validated result, or explicit error; never start AI work |
| generation-cleanup | Hourly schedule | Delete input/claim/result records older than 24 hours |

The browser keeps two active AI slots at a time, including their polling lifetime, and preserves the six-slot progressive experience (Joker, Harlequin and four AI results). Every hosted job normally returns immediately after dispatch. The worker can continue past the synchronous function's 60-second platform limit; Netlify background functions allow up to 15 minutes. This application deliberately retains its existing 90-second provider deadline, plus a 150-second job/polling deadline for missing workers or lost results. Background execution removes the synchronous host limitation; it does not remove application timeouts or guarantee upstream cancellation. [Netlify limits](https://docs.netlify.com/build/functions/configuration/), [background behavior](https://docs.netlify.com/build/functions/background-functions/).

The local npm run dev server still returns synchronous AI results at the same /api/generate route. The browser supports both contracts. No local queue, cloud request, or paid call occurs on startup.

## Deploy and environment setup

1. Deploy the repository through Netlify's Git integration, or a CLI deployment that includes Functions. Uploading only dist is insufficient.
2. The repository's netlify.toml sets build command npm run build, publish directory dist, functions directory netlify/functions, and build Node version 24. Netlify packages the functions separately from the frontend. No separate API host or frontend API URL is needed.
3. In Netlify, open Project configuration → Environment variables → Add a variable. Set GEMINI_API_KEY to the existing key. Its scope must include Functions; if scope selection is unavailable, use the plan's all-scopes setting. Set the Production context; include preview contexts only if they should also make paid AI calls.
4. Save and redeploy. Netlify captures runtime variables per deploy. Keep .env local and ignored; never use a VITE_ prefix for this key, put the value in netlify.toml, or commit it. [Function variables](https://docs.netlify.com/build/functions/environment-variables/), [UI setup](https://docs.netlify.com/build/environment-variables/get-started/).
5. Netlify Blobs supplies temporary shared job storage through the modern Functions runtime. No database, separate Blobs token, manually set site ID, model-name variable, or additional worker signing secret is required. The code uses @netlify/blobs with strong consistency. [Blobs API](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).
6. After deployment, open /api/health and expect service styler-netlify and generation background. Then make one deliberate Generate action to check the complete hosted path. One batch makes four paid AI calls; this is separate from health and offline tests.

The worker destination is constructed from trusted Netlify Context deploy.id and site.name, targeting that deploy's immutable permalink. It never trusts a body-supplied URL, Origin, or forwarded Host header, and does not depend on DEPLOY_URL being available at function runtime. [Runtime context](https://docs.netlify.com/build/functions/api/), [deploy permalinks](https://docs.netlify.com/deploy/deploy-overview/).

## Duplicate execution, storage and failures

Netlify may redeliver background invocations after failure. The shared store atomically creates a claim with onlyIfNew before the provider call. Existing claims are never reclaimed. All provider failures become stored terminal errors; the worker contains failures and does not automatically retry Antigravity. Concurrent duplicate deliveries from separate function instances see the same claim and skip paid work. [Atomic Blobs writes](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

If a worker crashes after claiming, the result may be lost. It is intentionally not replayed because the first provider request may already have incurred cost. Polling eventually reports timeout; only an explicit manual Retry creates a fresh job with the failed card's original CSS/inspiration snapshot. An ambiguous dispatch failure is also never dispatched again automatically. Manual retry after an ambiguous failure may still overlap upstream work; timeout is not proof of cancellation.

The signature is an HMAC of the job ID with the existing server key and a purpose-specific prefix. The worker rejects unsigned or invalid requests before paid work. Job IDs have 256 random bits and act as result-access tokens; do not share them. Status responses contain neither the original input snapshot nor the key. The API accepts matching HTTPS browser origins, validates request size/schema, and marks every status/result response no-store.

Input, claim and result records remain temporarily in a site-wide Blobs store and expire from API access after 24 hours; hourly cleanup removes older records. Claim retention exceeds the normal platform redelivery window. Cleanup is not proof of immediate deletion at exactly 24 hours. Blobs holds job transport state only: visible generation history remains React session memory and clears on reload. No history recovery or database has been added.

Browser concurrency is two per app session. The old local server's counter is not a global limit across serverless instances. This migration adds neither end-user authentication nor a site-wide quota system. For a restricted deployment, configure the site's intended access protection and verify that internal worker calls are allowed; a protected deploy permalink can otherwise reject self-dispatch. Site/account access rules and real cloud quota remain hosting verification items.

## Local verification and limitations

- npm test: **26 offline tests passed**. New checks cover actual health entry point, immediate acknowledgement, exact-agent adapter/schema/constraint enforcement, duplicate delivery across distinct API instances, method/origin/body/signature validation, terminal sanitized failures, missing/expired jobs, cleanup, ambiguous dispatch and result-write failure without paid replay.
- npm run build: **passed**, including typecheck and frontend compilation.
- npm run build:functions: **passed** with Netlify's official @netlify/zip-it-and-ship-it packager. All four archives were generated; manifest checks verify API paths, background invocation and hourly schedule. Output is ignored under .netlify/functions-verify.
- npm run test:e2e: **49 Edge tests passed**, including two new background cases. The clock/network-controlled case keeps a job pending for over a simulated minute, verifies two lanes and original CSS/inspiration, shows a terminal timeout, confirms polling stops, and retries only one failed card manually. Malformed acknowledgements and failed status reads never resubmit generation automatically. All existing V1 journeys still pass.
- TypeScript is now 6.0.3-compatible because the official function packager's parser crashed against the removed TypeScript 7 compiler API. The supported compiler passes the full typecheck; runtime/provider behavior is unchanged. Functions types and packaging tools are dev dependencies; @netlify/blobs is a runtime dependency.
- Final source/assets/docs/frontend-build credential and whitespace scan passed across 88 files, including untracked additions. Browser output contains no server key name, worker signature header or job-store identifier. All 60 entries across the four function archives were inspected with no .env file or actual key value found. git diff --check passed.

No deployment, environment-variable update on Netlify, real Blobs write, background cloud invocation, live provider request, commit or push was performed in this migration. Cloud cold-start time, authenticated self-dispatch, atomic-store behavior under real cloud contention, scheduled cleanup, billing and sustained quotas remain unverified. The latest real-provider timings remain the earlier M15 foreground sample; they are not hosted background measurements.

Next: deploy the repository with the Functions-scoped key, then verify health and one deliberate hosted batch. Preserve failed slots and sanitized logs if a hosted check fails; do not switch provider or automatically generate again.
