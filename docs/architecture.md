# Proposed architecture and integration research

Status: roadmap approved on 2026-10-30; M1–M18 complete and local desktop V1 accepted. After M18 the user authorized Netlify backend migration and chose background generation. The migration is implemented and locally verified, with cloud deployment still pending. Local development retains loopback hosting; V2 remains deferred. See netlify-deployment.md and the milestone verification reports for actual evidence, which supersedes historical descriptions below where explicitly verified.

## Interaction model

The stable sample website changes presentation while retaining content and interactive state. Selecting a card changes the preview style only. A declaration is Free, Locked(value), or Unset; the two toggle buttons implement all state transitions. Locks immediately override the selected style and persist across selections. Unset removes that override without modifying the current style, and requests omission in subsequent generated styles. Show effective values without secondary overridden-original values.

Generation captures a deep immutable snapshot. Append slots before asynchronous work, scroll only the generated rail, resolve Joker independently, and populate AI slots as validated results finish. New cards never become selected automatically. A seeded G1 is explicitly labeled Seed, never AI; later G numbers remain monotonic, including failed slots. History is append-only for the session.

In V1, inspiration is independent of preview selection and exclusive across both rails. Explicit CSS constraints outrank inspiration. Constraint edits during a request update the preview but not that batch. Compare canonical live inputs with the latest full batch snapshot; after the batch, indicate unused current constraints without queuing an automatic follow-up. Value comparison also handles reverting edits (see M17).

## Stack and boundaries

- Vite + React + TypeScript frontend, plain CSS for application chrome. Small Node TypeScript API on the same loopback origin. No external state-management library: React state/refs, pure constraint transitions, and focused generation/countdown hooks.
- Shared style types, bounded runtime validation, and CSS compilation live in `shared/style.ts`, independent of browser/server APIs. M3 uses a small explicit validator for the closed vocabulary rather than adding Zod; it validates exact fields and property-specific grammars without dependencies. Constraint types arrive with their milestone. Node's built-in fetch for the narrowly scoped provider adapter avoids depending on SDK enum freshness.
- Node's built-in test runner for offline schema, validator, Joker, provider-adapter, and API checks; Playwright/Edge for real browser cascade, fake-clock countdowns, scrolling, stable DOM, and interaction checks. No Vitest dependency was needed. Tests focus on behavioral risks rather than mirroring code.
- Suggested source boundaries: `src/domain/`, `src/styles/`, `src/preview/`, `src/components/`, `src/generation/`, `shared/`, `server/`, `tests/`. Add each when needed, not as empty scaffolding.
- Local Node process is the initial execution host. Select deployment only after latency and lifetime measurements. No cloud Site registration or publication in this planning session.

M2 implementation: a native Node HTTP server hosts Vite middleware and `/api/health` on `127.0.0.1:5173`, with HMR on the same origin. The dev entry point does not initialize the provider or call the agent; only the explicit probe does. Vite may read its normal environment files, but the key has no client prefix and is never referenced by client code. Build output is the frontend, not a deployed backend. Real browser checks use Playwright with installed Edge. The M1 offline tests retain Node's test runner; introduce Vitest only when client/domain behavior needs it.

M3 replaces the temporary M2 foundation module with seven validated immutable styles in `src/styles/presets.ts`. React selection state updates only stylesheet contents and inspector source values, preserving the mounted preview and its controls. Native button cards expose pressed state and show the style's actual page/button treatments. G1 is an honest selectable seed. The inspector remains a source viewer until M5; no constraints, timers, or generation handler are implemented. M4 adds the persistent ShadowRoot and transitions described below.

M4 testing uses a dedicated loopback server on 5174 via `STYLER_PORT`, leaving an existing app session on default port 5173 running. The dev server validates optional ports as integers from 1024 to 65535. Browser request-origin checks derive the expected origin from Playwright configuration instead of assuming the user app port.

## Common style schema

A style has a stable ID, schema version, human-readable name, provenance (preset, seed, joker, antigravity), and ordered rules. Each rule references a fixed selector ID and ordered declarations with stable declaration IDs, allowlisted longhand property names, and bounded values. A value may be absent: absence must survive parsing and serialization, especially for Unset. Seed and optional generation metadata are separate from CSS.

The initial vocabulary covers preview surfaces, headings, paragraphs, buttons/variants, cards, inputs, and switch visuals. Allow colors, bounded spacing, border widths/radii, shadows, and curated font stacks. Do not accept arbitrary selectors, raw stylesheets, HTML, scripts, imports, external URLs, `!important`, layout escape properties, or unbounded values. Validate syntax and property-specific ranges, not just JSON shape. Curated styles and Joker use the same vocabulary.

Implemented M3 contract: `schemaVersion: 1`, stable ID/name, provenance (`preset|seed|joker|antigravity`), ordered rules with fixed selector IDs, and ordered declarations identified by `selectorId:property`. Known selectors are mapped to repository-owned CSS; every member of grouped selectors is scoped. Values accept bounded pixel lengths, hex colors, three local font stacks, a small enum set, and one strictly parsed shadow. Longhand padding, border sides, and corner radii avoid shorthand conflicts. Duplicate selectors/properties, unknown fields, malformed IDs, unsupported values, and custom properties are rejected. Parsing creates a deeply frozen copy and preserves source order and omissions. Empty rule/declaration sets are structurally valid so future all-Unset constraints need not reinsert defaults; meaningful unconstrained generation is a separate later acceptance check. Request-body size limits belong to the later API endpoint.

Reject invalid AI output and show a manual retry action. Validate final results against the captured constraints: locked declarations match and Unset declarations are absent. Deterministically inject captured locked values and remove Unset keys during a documented normalization step; reject malformed/unsafe free values rather than silently repairing them. Keep original style records immutable after acceptance. This normalization is not another AI call or a fallback provider.

Use longhands to avoid shorthand/longhand conflicts. Use plain property strings at the API boundary; serialize only schema-owned tokens, never arbitrary untrusted CSS text.

## Native cascade and isolation

Implemented M4: `Preview.tsx` attaches or reuses one open ShadowRoot in a stable ref callback, including React StrictMode ref replays. A portal renders the baseline and `SampleWebsite` inside it. Preview styles import with Vite `?inline`, never as global document stylesheets. The root, portal, sample DOM, and selected-style element stay stable across selections. The boundary resets ordinary inherited properties, sets direction/font/color defaults, and includes its own box sizing, form-control defaults, and visually hidden label styling. This keeps app CSS out and preview CSS in. Open access allows later inspection using a root reference.

Implemented layer order: `baseline`, `selected`, `locks` within the ShadowRoot. Baseline reset/layout/motion rules live in the first layer; validated selected CSS lives in the second. The locks layer is reserved, with no override implementation yet. All schema-owned declarations have normal importance; future higher-layer locks will win over selected-style specificity. Preserve original selector/declaration source order inside each layer. Future locks compile in canonical stylesheet order, never Map insertion/click order. Browser specificity and inheritance operate normally within each layer. Do not implement a custom cascade engine.

Associate each inspectable selector with a canonical rendered representative. Use the browser's computed styles to capture the current effective value, including inherited/default values when that declaration is omitted. For repeated components the representative uses the same class/variant; do not pretend one property read represents unrelated elements. Inspector shows the locked captured value when locked. After transitions settle, free values reflect the representative's effective result; on Lock capture its value at the click, including an intermediate animated value if applicable. Normalize computed values into the supported schema. Test overlapping selectors and equal-precedence source ordering in a browser.

Style-card samples share the style data but stay scoped to their own samples and never receive the main preview's live overrides. Keep selection and future inspiration controls separate with keyboard access and clear labels.

M4 uses an explicit 320 ms transition list in `boundary.css` for colors, border colors/widths/corners, shadows, padding, gaps, and numeric typography. Font family/style and border style remain discrete. Reduced-motion sets duration/delay to zero, including when the preference changes during a transition. Sample navigation uses immediate scrolling under that preference. Later generation scrolling must honor it too; generation is not implemented yet. Normal generation actions will smoothly scroll the generated container to the start of the appended batch, even from older history.

## Batch execution

One active batch per app session, with a synchronous ref guard against duplicate actions. A batch owns an immutable snapshot and ordered uniquely numbered slot states (pending, ready, error); server calls have their own request IDs. Release active state in all terminal paths. Failed slots remain in place; manual retry reuses that slot and original snapshot and does not create another Joker or duplicate batch. Retry does not select a result or trigger automatic generation.

MVP has a local stage and one remote stage. V1 expands this stage configuration to one local slot plus five remote slots. Prefer an independently started quick request and bounded concurrent additional requests; measure whether one four-style request is cheaper/faster enough to justify less granular completion. Additional work must not depend on receiving the quick result. Concurrency and token budgets are server-controlled. Mark every failed slot terminal; partial success remains browsable.

V1 countdown is a single state machine: idle, counting, generating, then idle/current-or-stale. Only constraint/inspiration changes start or reset eight seconds. During generating, edits update live inputs without arming a timer. Manual Generate cancels the countdown. At completion, stale constraints are indicated but no new request is queued. Only a later eligible edit or manual click starts another batch.

## Antigravity research, checked 2026-10-30

Primary sources:

- [Requested agent listing](https://ai.google.dev/gemini-api/docs/models/antigravity-preview-09-2026).
- [Managed agent guide](https://ai.google.dev/gemini-api/docs/antigravity-agent).
- [Interactions API reference](https://ai.google.dev/api/interactions-api).

The listing identifies the exact requested agent. The guide shows `POST https://generativelanguage.googleapis.com/v1beta/interactions`, API-key authentication with `x-goog-api-key`, `agent: "antigravity-preview-09-2026"`, input, and a remote environment. It describes managed code/files/web capabilities, token budgets, streaming, and background execution. Background work requires stored interactions. This is an agent request, not `generateContent`.

The general reference still enumerates the May agent while the current guide/listing use September: documentation/schema drift is a concrete compatibility risk. The reference describes interaction statuses, output steps, usage, and `response_format` JSON-schema output; it does not establish that every option works for this agent. SDK examples expose `output_text`; verify actual REST output structure before writing the parser.

Proposed M1 checks: one bounded real request with the existing key after approval, exact agent identification, actual output extraction and status handling, JSON-schema compatibility, useful valid JSON output, budget option support, latency and exposed usage. Restrict unnecessary tools where supported; verify rather than assume an empty tools list disables the entire remote environment. If JSON-schema enforcement is unsupported but JSON text works, validate that text locally through the same schema. This retains the exact agent and does not substitute a model.

M1 verified key access, the exact agent, one accepted JSON-schema response format, and the echoed token budget. Actual REST text is in the last `model_output` step's `content`, not an `outputs` array. One valid style completed in 17,938 ms with 5,630 total tokens; price remains unavailable. Quota capacity, background creation, streaming, and concurrent performance remain unverified. Compare those only when measured request lifetime or the eventual host requires it. Do not build a job database speculatively. If access or required capabilities fail, record sanitized evidence and ask the user for a decision; do not substitute another system.

Log request ID, agent, elapsed time, terminal status, validation result, and exposed token/tool usage without secrets or full transcripts. Estimate cost only when usage and applicable verified rates support it; otherwise say unavailable. Include costs of failures where exposed. Minimal measurements in M1/M11 guide V1 settings; no analytics service.

## Significant decisions and deliberately deferred issues

- Fixed schema and native CSS layers keep this a style explorer, make generation bounded, and preserve browser cascade semantics.
- ShadowRoot isolation protects application usability, including adventurous Jokers.
- Session memory meets history requirements without persistence infrastructure.
- Transport and concurrency remain measurement-driven; no arbitrary promise of a fast agent response.
- Hosting and any public-use access control/rate limits await deployment selection. Local API binds to loopback; no open public paid endpoint is part of MVP.
- Sample content defaults to a fictional small studio/product website, with seven distinct curated directions and system/locally available fonts; no external assets are needed for MVP. V1 enriches the same site's content.
- Desktop validation targets 1440×900 and 1920×1080, with a 1280px minimum-width integrity check. Adjust the 60/7/7/26 proportions when controls require space; no mobile layout.
- V2 custom CSS declaration authoring and lifetime (unlock, style change, regeneration, session end) remain undecided and unimplemented. No V2 scaffolding is required.


## M5–M11 implementation decisions (supersede earlier planned descriptions)

shared/constraints.ts validates and freezes snapshots, implements toggle transitions, compiles canonical locks, and normalizes accepted generation. Unsafe free values are rejected before captured locks are injected and Unset declarations removed. Original selected CSS source order remains unchanged. Locks have canonical vocabulary order; native layers/specificity/inheritance resolve rendering.

src/preview/inspection.ts defines stable selector/declaration groups covering curated declarations plus inherited color rows. The browser reads canonical representatives inside the ShadowRoot and refreshes on style/constraint change, transition completion, and preview control changes. Conditional switch inspection targets the actual track even if unchecked. Captures normalize computed colors, lengths, fonts, line heights, and single shadows into the existing bounded vocabulary; unsupported values report an explicit notice.

src/generation/useGeneration.ts owns append-only slot history and a synchronous ref guard against same-tick duplicate batches. Both slots retain the same frozen snapshot. Deferred local Joker execution allows initial placeholders to paint without waiting for AI. Retry preserves failed-slot identity and snapshot. App scrolls only its generated container; selection never follows generation automatically.

server/generation-api.ts owns a separate server request guard, same-origin JSON POST checks, 96 KiB body bound, and error sanitation. server/generation.ts uses the verified exact-agent interface, a full style output schema, 1 MiB response limit, 90-second provider deadline, and requested 16,000-token budget. Client waits at most 100 seconds. Only exact-agent completed results are accepted. Incomplete responses are explicit errors, even when their JSON is structurally valid. No automatic retries or alternative model.

A small live app sample completed twice in 37.7 and 34.8 seconds. Foreground local transport is adequate for this prototype. Cost and sustained/concurrent capacity remain unavailable. Keep MVP concurrency at one; future V1 should measure at most two simultaneous calls first, before considering wider concurrency. Do not interpret requested token budget or local abort as a guaranteed cost/cancellation bound.

Default dev startup loads .env only into the Node environment. No startup provider request occurs. The optional server/verify-live-app.ts launches its own app on 5175 and makes at most two explicit paid requests; it is excluded from default test/startup commands. Hosting remains undecided. See the M5–M11 report for exact evidence.


## M12 acceptance decisions

Inspector row vocabulary now starts with curated declarations/inherited color and includes every declaration found in accepted generated history. Those discovered rows persist for the session, so a generated declaration can be unlocked even while a preset omits it. App memoizes the groups on slot history, and the persistent preview reads the same groups after transitions. This fixes an inspection gap without adding arbitrary CSS authoring.

Computed font-weight capture rounds to at most two decimal places; the shared grammar accepts only numeric weights 400–800 at that precision. This preserves intermediate animated appearance instead of rejecting fractional values. Other bounds and the exact-agent integration are unchanged.

The complete MVP journey passes under both motion preferences, with keyboard controls, live edits during pending generation, original-snapshot manual retry, retained input/switch/details state, both results, omission, old-history scrolling, and no automatic selection/request. A fake-clock browser check verifies no timer after load/constraint edits, no automatic retry, and session reset on reload. See m12-mvp-acceptance.md. M13 remains the next unstarted milestone.


## M13 sample website decisions

The persistent SampleWebsite component owns membership, visitor-name, workspace, weekday, notes, and confirmation state alongside the existing email/switch/space-detail state. Native radio/select/textarea/details controls provide keyboard semantics without a new component library. Navigation scrolls only the preview and respects reduced motion. Visit/subscribe handlers prevent navigation and have no network submission.

Two original local SVG illustrations replace the CSS-only space-card art. Images have fixed intrinsic dimensions and descriptive alt text; source/content remain unchanged across selections. No external assets, credentials, image generation service, or fetch dependency is involved.

Existing input selectors style new text/select/textarea surfaces, and existing details/card/copy/button groups cover the remaining components. Additive subheading/image selector IDs use the existing bounded property grammar; presets cover typography and frames, the inspector includes them, and provider request schema derives its vocabulary from the same source. This retains sparse legacy style compatibility and does not introduce arbitrary CSS or image URLs. M13 browser/offline checks pass; the new selector vocabulary has not had a new real-provider call.

M13 ends at the richer website slice. Manual two-slot generation remains unchanged; inspiration starts at M14. See m13-website-verification.md for observed evidence.


## M14 inspiration decisions

App keeps a nullable inspirationId separate from selectedId. Every ready card has an accessible aria-pressed inspiration toggle, and a footer control clears the single shared selection. Pending/error cards have no style to inspire from. Generation/preview selection never automatically changes inspiration.

shared/generation.ts copies and freezes both CSS constraints and the original accepted inspiration style into a GenerationSnapshot. Each slot retains the same context; retries reuse it despite later edits. The wire API keeps the original snapshot constraint array and adds optional validated inspiration data. Existing requests without inspiration remain valid. Server normalization still injects locks and removes Unset after unsafe output rejection, so explicit constraints outrank inspiration.

Joker uses inspiration as its base and retains typography while applying deterministic bounded palette/geometry variation; absent inspiration retains the adventurous preset-based path. AI receives inspiration as style data below explicit constraint priority. It is a soft visual guide, not a guarantee of exact similarity. No mandatory regeneration/deduplication or extra call is introduced.

M14 live app verification completed once in 37,781 ms using the exact agent, captured S4 while the UI changed to S2, and preserved the explicit lock and omission. Usage was 12,490 total tokens; cost unavailable. The sample adds evidence for the optional inspiration payload and current selector vocabulary, not sustained or concurrent performance. Full evidence: m14-inspiration-verification.md and m14-live-measurements.json. Generation remains manual/two-slot until M15; countdown starts only with M16.


## M15 execution decisions

Shared configuration specifies five AI results and at most two concurrent requests. Generate reserves six slots together, owns one deeply frozen GenerationSnapshot, and starts Joker separately from the remote worker loop. The first worker starts quick G3 while the second starts additional G4; either worker can start the next waiting slot. Work never depends on another generated style's content, and similar results do not trigger deduplication or extra calls.

Each remote operation validates and settles only its own slot, containing errors. The batch guard releases after both the local task and all remote tasks finish; it does not release after the first response. Manual retry is one failed-slot call with its original context and does not duplicate the batch/Joker. Live edits apply immediately but do not modify active or waiting slot snapshots or queue a later generation.

Server capacity is an independent two-request counter with release in finally and explicit capacity errors. Browser work starts only as lanes become available, so individual 100-second client/90-second provider deadlines exclude waiting time. The simple existing HTTP endpoint delivers progressively without SSE, background jobs, or a persistence service. Multi-tab/server-wide contention becomes an explicit failed slot rather than an unbounded server queue.

The generated container is scrolled once per batch to the first new Joker, preserving other rails and selected style. Later completions do not scroll it again. Normal/reduced-motion tests verify the top-of-batch target when six cards exceed the viewport.

One real five-request batch succeeded at concurrency two: Joker 58 ms, first AI 30,683 ms, full batch 115,653 ms, total exposed usage 65,376 tokens. Additional G4 completed before quick G3. All five retained S4 inspiration even after the live UI changed to S2, and all lock/Unset checks passed. Cost remains unavailable. This supports retaining two lanes locally, not raising concurrency or promising sustained throughput. Complete evidence: m15-progressive-verification.md and m15-live-measurements.json.

The explicit server/verify-live-app.ts command now makes exactly one six-slot batch (five paid calls) and drains all slots even if one fails. The optional --inspiration mode changes live inspiration mid-batch. It records partial evidence and never automatically retries. Its old two-slot/single-call behavior described in historical reports no longer applies. Countdown remains M16; generation is still manual at this boundary.


## M16 countdown decisions

The shared useCountdown hook owns one timeout and one monotonic eight-second deadline. It updates remaining seconds with the same timeout that sends at expiry, clears the handle on reset/manual send/retry/unmount, and reads latest callbacks through refs. No separate CSS/inspiration timers or interval-plus-send pair exists.

App detects committed CSS/inspiration changes while preserving initial identical refs, so StrictMode mount and unrelated renders do not arm anything. Edit handlers record eligibility against the synchronous generation guard; the arming check also requires the batch to be idle. This avoids treating an active-request edit as eligible merely because completion preceded its commit. Expiry captures the current original inspiration plus constraints through the existing immutable generation boundary. Manual Generate and Retry cancel before dispatch.

Preview selection, inspection refresh/animation, hover, scrolling, sample form state, and progressive completion do not reset the countdown. Active edits remain live but do not arm a queued follow-up. Completion returns to idle; only a later edit or manual action starts more work. The explicit unused-constraints indication and broader race acceptance remain M17.

Browser acceptance uses paused Playwright time and mocked responses to assert the exact 7,999/8,000 ms boundary and labels, shared resets, manual cancellation, exclusions, and active-state suppression. The isolated test server now receives GEMINI_API_KEY as an explicit empty environment value; native .env loading preserves it. An endpoint check verifies no provider credential before any fetch. Normal dev/explicit live verification is unaffected, and M16 makes no new paid calls. See m16-countdown-verification.md.

## M17 active-edit decisions

useGeneration retains lastBatchContext when a full Generate captures its deeply frozen inputs, independently of remote success/failure. App compares canonical CSS constraint values and the immutable inspiration style ID with that context. Value comparison replaces the earlier proposed revision counter: reverting to the same inputs must clear the notice rather than reporting an unused edit that has already been undone. Preview selection is excluded.

The pinned footer's accessible Generation constraints status explains changed inputs while busy and indicates unused current inputs after completion, partial failure, or total failure. It does not claim that every result succeeded; individual failed slots retain their errors. A new full generation consumes current inputs and replaces the comparison context. A manual retry uses its old slot snapshot and never replaces the latest full-batch context, even when retrying a card from an older batch.

Existing synchronous batch guards and handler-recorded countdown eligibility remain responsible for scheduling. The notice derives from state and never sends or queues work. Active edits update live overrides immediately; no completion/error path arms a timer. A fresh idle edit starts eight seconds, and manual Generate captures the latest inputs. The shared status region is described by Generate and remains visible while the inspector scrolls.

Six additional fake-clock/mocked-response Edge checks cover live locks, all five original request snapshots, success/partial/total failure, reversion, old-context retry, a later fresh countdown, and editing immediately before final-response release. No provider/API settings changed or paid calls occurred. See m17-generation-edits-verification.md. M18 remains the next unstarted milestone.

## M18 acceptance and hosting decisions

The combined V1 journey in tests/browser/v1.spec.ts exercises generated inspiration, shared countdown, six-slot progression, active edits, partial failure, old-context manual retry, keyboard controls, and retained history under both normal and reduced motion. Existing focused tests cover CSS source order and isolation. Acceptance found an in-flight reduced-motion defect: changing transition duration to zero did not cancel existing transitions. The reduced-motion media rule now removes transition properties as well as duration/delay; a test pauses transitions before changing preference so successful cancellation cannot be confused with natural completion.

Retain the two-lane foreground per-style HTTP execution path and local loopback hosting for V1. The reviewed M15 live evidence reports first AI at 30,683 ms, full batch at 115,653 ms, and 65,376 total tokens. Individual provider durations were 28,846–56,006 ms. Per-call deadlines start when a lane begins its request, not when the whole batch starts. The sample supports current local settings without proving sustained reliability or wider quota capacity. M18 makes no new paid request or provider configuration change; cost remains unavailable.

The existing entry uses Node with Vite development middleware; dist contains only the frontend. Public hosting is not selected or deployed. A future deployment slice must define production serving, HTTPS/proxy origin handling, host lifetime limits, server-side secrets, and paid-endpoint access controls for its chosen target. Keep that work separate from local V1 acceptance and from deferred V2 authoring. See m18-v1-acceptance.md for the full behavior/measurement evidence and remaining limits.

## Follow-on Netlify background migration

The user explicitly chose background generation after selecting Netlify. netlify.toml defines the frontend build, publish folder, function source folder and Node 24. Modern Request/Response functions implement start, health, worker, polling and scheduled cleanup. The existing local Node API remains synchronous; the shared browser transport accepts either immediate validated style data or a background job acknowledgement.

Background inputs/results and immutable claims live in a strongly consistent site-wide Netlify Blobs store. Start validates input before dispatching the worker once. Dispatch is signed with a purpose-specific HMAC using the existing server key and targets the current deploy's immutable permalink derived from trusted Context metadata. The worker verifies the signature and atomically claims the job with onlyIfNew before calling the unchanged exact-agent adapter. No lease recovery or replay occurs after a claim: a crash may lose a result, but duplicate platform delivery cannot automatically repeat a possibly paid request. Explicit manual Retry creates a new job with the failed slot's original snapshot.

Provider requests retain the 90-second deadline. The browser polls status every two seconds, with 15-second individual status-read limits and an overall 150-second polling deadline. Status reports a missing-worker timeout after 150 seconds. Polling never submits generation or changes the shared countdown. Both active and waiting slots preserve the original batch inputs, and the two browser lanes remain occupied until each result/error settles. This per-session limit is not a global serverless concurrency limit.

Job tokens have 256 random bits. HTTPS same-origin checks, bounded JSON validation and no-store responses protect the transport boundary; job status exposes results/errors rather than input snapshots. API job access expires after 24 hours, and an hourly scheduled function removes older input/claim/result records. This is temporary transport storage, not persisted style history or a database. No end-user authentication or global rate-limiting service was added.

The official Netlify packager successfully emits all four functions and confirms background invocation, routes and schedule. TypeScript 6 replaces 7 because the packager's dependency parser requires the JavaScript compiler API removed in 7; typecheck and frontend build pass. Cloud self-dispatch, storage, scheduled execution and access protection still need hosted verification. No paid call or deployment occurred in the migration. See netlify-deployment.md for environment setup, evidence, failure semantics and limitations.

## Internal AI card treatment (2026-10-31)

The user requested deterministic copying of only `.sample-card` border colors and padding from inspiration, falling back to G1. The server adapter replaces the four border-color and four padding longhands after validating raw AI output and checking that it is meaningful. Each missing inspiration declaration uses the immutable G1 seed value. Border widths/styles/radii, text/background colors, shadows, and every other generated property remain generated. Captured locks and Unset are applied last, so they override or omit copied values. This shared adapter covers both loopback requests and the Netlify worker. Immutable batch inspiration also governs manual retry; later live edits cannot change it. No extra provider call or UI disclosure is added, and Joker, presets, and existing history remain intact.

## Joker palette bounds (2026-10-31)

The subsequent user request changes Joker colors across all selectors. Resolve each supported color declaration from the captured original inspiration, falling back individually to G1, including when an inspiration rule is absent. Add missing fallback color entries without mutating source styles. For text/background/border colors and the color inside box-shadow, choose each integer RGB channel independently within the inclusive original ±20 interval clipped to 0–255. Preserve alpha exactly. Equivalent shorthand/full hex and case variants share one varied color per Joker for palette consistency. Existing non-color variation remains; shadow geometry stays with the base style where present, and `none` stays `none`. Apply captured locks and Unset last. Antigravity's card treatment is unchanged.

The bounded schema accepts only #RGB, #RRGGBB and #RRGGBBAA, including shadow colors. Computed browser rgb()/rgba() captures normalize to hex before storage; Joker does not accept raw RGB, HSL, named colors or other color spaces. If future schema work adds formats, normalize them to sRGB channels first, apply the same ±20 bound and retain alpha, then serialize to supported hex. No expanded color grammar or new dependency is needed for this request.

## Independent G1 design (2026-10-31)

G1 is now Tidal Atelier, an explicit immutable rule set rather than a copy of S1. Mineral-blue background and warm ivory surfaces balance deep teal text/buttons with terracotta accents. Serif headings, 18px card padding/corners and restrained translucent shadows distinguish its appearance while fitting the existing desktop layout. G1 retains seed provenance and no provider call; the initial selected style is still S1. Both Joker's color fallback and Antigravity's card border-color/padding fallback automatically use this single seed definition. Browser journey selectors read its name from seedStyle so naming changes do not obscure behavioral checks.

## S1/S5/G1 rotation (2026-10-31, supersedes the original slots above)

Rotate the complete immutable designs without changing any declarations: Foundation moves from S1 to S5, Rosewater from S5 to G1, and Tidal Atelier from G1 to S1. Preset ordering remains S1–S7 and G1 retains seed provenance; Tidal Atelier now has preset provenance. The initial S1 preview is therefore Tidal Atelier. Existing generation code still uses G1 as its fallback, which now means Rosewater for Joker colors and AI card border colors/padding. No new rotation state or user control is needed. Browser expectations follow the new initial S1 values while retaining all cascade, isolation and immutable-snapshot checks.
