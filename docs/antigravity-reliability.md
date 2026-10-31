# Antigravity reliability investigation — 2026-10-31

Scope: restore Joker plus Professional, Playful, Mysterious, Commercial and Artistic, then measure completed, validated work from the exact `antigravity-preview-09-2026` agent. Local measurements only; deployment is separate. No automatic retries, fallback provider, continuation or paid revisions.

**Later continuation:** the user replenished quota and updated the local key. Resumed trials exposed additional output-format failures, leading to a simpler provider contract with server-owned metadata. The current results and operating profile are in [antigravity-reliability-continuation.md](antigravity-reliability-continuation.md). The counts and quota-blocked boundary below preserve the initial investigation.

## What the provider contract means

[Google's agent guide](https://ai.google.dev/gemini-api/docs/antigravity-agent#budget-controls) says `max_total_tokens` includes input, output and thinking, excluding cached tokens. Reaching it returns `incomplete`. Enforcement is best effort, so observed usage may exceed the requested limit. A requested 16,000-token budget is neither 16,000 output tokens nor a hard billing cap.

Count success only when the envelope confirms the exact agent and `completed`, JSON decodes, the bounded style schema validates, identity matches, and deterministic captured lock/Unset/card-treatment normalization succeeds. An incomplete envelope stays a failure even if its final text happens to contain valid CSS data.

One completed experimental response contained a single Markdown JSON fence despite `response_format`. The adapter now accepts that wrapper around an otherwise valid style. It still rejects explanatory prose, unsafe properties/values and incomplete envelopes. This is a transport normalization, not a generated-value repair.

`tools: []` plus a “no tools” instruction in the user prompt did **not** prevent builtin tool activity. A read-only inspection of interaction `v1_ChdqTDdsYXB1MENfVGxuc0VQNDlEQ2lRSRIXakw3bGFwdTBDX1RsbnNFUDQ5RENpUUk` confirmed function calls and three code-execution calls, no final model output, and terminal incomplete status. Reported tool-use tokens were zero. Track step types as well as token counters. That call reported 51,603 total tokens including 26,446 cached tokens: 25,157 uncached tokens against a requested 24,000 budget. Repeated agent steps can grow context beyond the original request size.

[Google documents inline system instructions](https://ai.google.dev/gemini-api/docs/custom-agents#tools-and-system-instructions) for this same exact agent. The successful final experiments assign a bounded JSON-generator role at system level, ask for one direct final answer and prohibit planning/tool/verification loops. This is instruction guidance, not proof of a platform-enforced tool ban. No different agent or underlying model is selected.

## Method and evidence

Explicit manual experiments use `server/measure-reliability.ts`; app startup never imports it. Requests use the existing server-side key, structured response format, no explicit tools and the same exact agent. Earlier trials use 90-second deadlines; the final five use a diagnostic 180-second deadline, but all complete within 62 seconds. Each request is independent. Every trial captures a button-color lock and an Unset card-padding declaration. Initial controlled trials alternate original S1/S4 inspiration. Varied-context trials cover every preset and no inspiration. No retry is used to convert a failed observation into a success.

Sanitized per-call evidence is in [antigravity-reliability-measurements.json](antigravity-reliability-measurements.json). There were **37 generation POST attempts: 34 admitted to generation and three rejected with HTTP 429**, plus **one GET inspection** of existing work. Ignored `verification-results/reliability/` also contains individual request payloads and returned style text, without credentials or reasoning. Early original request payloads were reconstructed using the original builder before it was edited; their lengths match observed telemetry. Failed requests count in the totals. Observed usage totals 565,140 tokens including cached tokens; five timed-out calls have unknown usage, so this is not a complete consumption or cost total. Cost remains unavailable.

The experiment matrix compares removal of examples, reduced output, lossless inspiration compaction, requested budget, concurrency and system instructions. A 30-second-pause run and a live browser batch remain unperformed because the daily quota was exhausted. A small sample cannot isolate all provider variation; report raw counts rather than attributing every latency or success difference to one setting.

## Results and selected profile

| Profile | Budget | Lanes | Accepted / attempted | Other outcomes |
| --- | ---: | ---: | ---: | --- |
| Original complete design, ~20,500 input characters | 16,000 | 1 | 1 / 3 | 1 incomplete, 1 timeout |
| Remove examples only, ~13,900 characters | 16,000 | 1 | 2 / 5 | 2 incomplete, 1 completed JSON-fence rejection |
| About 30 declarations, ~12,900 characters | 16,000 | 1 | 0 / 3 | 2 incomplete, 1 timeout |
| Compact complete design, ~7,900 characters | 16,000 | 1 | 2 / 5 | 2 incomplete, 1 timeout |
| Original complete design with larger budget | 24,000 | 1 | 2 / 3 | 1 incomplete |
| Compact design, varied inspiration, user-level instructions | 24,000 | 2 | 6 / 10 | 2 incomplete, 2 timeout |
| **Compact design + explicit direct-JSON system role** | **24,000** | **1** | **5 / 5** | **All completed; no tool steps** |
| Same final profile, two lanes | 24,000 | 2 | 0 / 2 | Both rejected by daily quota; no inference about generation reliability |
| Single call after ~54-second cooldown | 24,000 | 1 | 0 / 1 | Daily quota rejection persisted |

The fence rejection above is preserved as originally observed. Offline revalidation confirms the new wrapper decoder accepts its 109-declaration style; this does not count as a new successful provider call.

Final-profile outputs cover **all 12 selectors**, with **109, 120, 120, 121 and 109 declarations**, respectively. Their original styles are saved locally under `verification-results/reliability/system-24k/`. Names include `Atelier100`, `playful101`, `Nocturne` and `CommercialStudio103`. These are full CSS style records, not acknowledgements or reasoning text. All pass actual application output validation and captured lock/Unset normalization. Durations are **24.3, 35.0, 28.0, 61.9 and 33.6 seconds**. Total usage ranges from **10,457 to 16,328 tokens**, including **648–6,280 thinking tokens**. Every response has only `thought` and `model_output` steps.

The implemented profile keeps complete-design guidance and all five expressions, uses compact inspiration, removes the two bulky examples, adds the same **392-character system instruction** tested above, and requests a fixed **24,000 total tokens**. Ordinary user prompts are about **4,500–8,000 characters** before large constraint sets, plus the system instruction and response schema. The production **90-second provider / 150-second hosted-job** deadlines remain: every successful system trial fits within them. No timing evidence supports permanently extending them yet. Two app lanes remain; final-profile live reliability at that bound is still unverified. No permanent 30-second pause is added without comparative evidence.

System-level role guidance is the strongest improvement observed in these trials. It is an inference from this finite comparison, not a guarantee that instructions can disable tools or that future generations will all succeed.

## Local validation

`npm test` passes **35 offline checks**; **49 Edge checks** pass with mocked provider responses, and the production build/typecheck and Netlify function packaging/route checks pass. A further Edge replay loaded all five saved real provider styles, rebound their IDs to UI slots and reapplied the current captured normalization: all five rendered with the expected captured button-color lock, seven cards were ready including the seed, and no provider call was made. Visual QA inspected `verification-results/reliability/final-replay.png`. This replay is not a new live provider/browser batch.

Credential scans pass across 79 source/document/browser-output files and all 60 function-archive entries. Browser output contains no server key name; the actual credential and environment files are absent from the scanned outputs. `git diff --check` passes. No cloud runtime behavior was exercised.

- Original complete-design prompts with inspiration contain about 20,500 characters. One success already consumed 15,379 tokens. Sequential execution also produced timeout and incomplete outcomes.
- Removing curated examples alone leaves about 13,900 characters and still produces incomplete outcomes.
- Asking for only about 30 declarations can still exhaust the total budget through thinking. Reducing requested output alone is insufficient.
- Compact selector/property inspiration maps preserve every supported declaration and value in source order. They omit redundant declaration IDs and identity/provenance metadata. Removing the two large examples and compacting inspiration retains the complete-design instructions while reducing ordinary prompts to approximately 4,500 characters without inspiration and 7,800 with presets, before substantial constraints.

## Quota boundary and remaining work

The provider's sanitized rejection says: **100 requests per day on Free Tier** for this key, with a reset about **08:00 Europe/Brussels on 2026-11-01**. This is an observed project/key limit, not a universal Antigravity limit. The app's earlier calls also share that allowance; this investigation did not make 100 generation attempts. Waiting ~54 seconds did not restore access. Pacing cannot restore an exhausted daily allowance. Five AI calls per Generate make quota planning material; failures must be included when budgeting requests.

The selected profile has **five successful sequential observations**, not established sustained reliability. After quota reset, use new labels to retain separate evidence:

```powershell
node --env-file=.env server/measure-reliability.ts system-repeat app 10 2 0 24000 varied 90000
node --env-file=.env server/measure-reliability.ts system-paced app 5 1 30000 24000 paired 90000
node server/verify-live-app.ts --inspiration
```

These commands make up to **20 paid/quota-consuming calls in total**. They are manual commands, not queued work. The harness stops starting samples on authentication/quota errors, keeps failures, refuses to overwrite an existing experiment directory and never retries. Its optional `baseline` mode uses the three locally archived original requests; `minimal` is a deliberate reduced-output experiment. Neither mode is used by the app. Wider throughput, large constraint sets/generated inspiration, long-term failure rate and hosted execution remain unverified. No deployment, commit or push was performed for this change.

## Limits to respect

| Dimension | Operating recommendation / what is actually established |
| --- | --- |
| Input size | Keep ordinary briefs near 4,500–8,000 characters before large constraint sets; this is an efficiency target for this app, not an Antigravity context-window limit. Preserve constraints and actual inspiration values. Remove repeated examples, declaration IDs and metadata first. Measure input tokens as well as characters: schema and managed-agent context also consume tokens. |
| Output size | Retain coordinated full designs. About 30 declarations did not eliminate failures. Observe actual output tokens, schema validity and selector coverage; do not silently accept partial/incomplete work. |
| Thinking | Include thought tokens in headroom. They vary even for small output requests. A prompt-length target cannot reserve enough thinking by itself. |
| Budget | Use the selected fixed 24,000 total-token budget as headroom for this profile. Compare budget use with total minus cached tokens where both are supplied. Do not silently escalate it or continue an incomplete interaction. Requested limits are best effort, not a hard cost cap. |
| Concurrency | The app allows at most two active AI slots per browser session and the local server caps active requests at two. This is not a global Netlify account/project rate limit. No requests-per-minute or total-user capacity limit is established here. |
| Pacing | The planned 30-second-pause comparison remains unperformed. A ~54-second cooldown still received the daily-quota rejection. Delay cannot increase an individual token budget or restore daily quota; no permanent pause is added. |
| Deadlines | Provider deadline stays 90 seconds; each hosted job/polling window stays 150 seconds. A timeout is a different outcome from `incomplete`. Longer waits alone cannot fix a terminal token-budget stop. Full five-request batches take multiple waves. |
| Output transport | Use structured response format plus local validation. The observed single JSON fence is normalized; arbitrary prose or malformed JSON is rejected. Keep incomplete-envelope rejection even when JSON looks valid. |
| Tool use | Use an explicit direct-JSON system instruction and monitor returned step types. Function/code-execution steps were observed despite `tools: []`, while exposed tool-use tokens remained zero. System guidance is not a platform-enforced capability restriction. |
| Local bounds | API input is at most 98,304 bytes; provider response parsing is bounded at 1 MiB. These are app safety bounds, not verified provider context limits or token estimates. |
| Constraints / inspiration | Both remain captured and immutable. Locks and Unset win over expression, inspiration and completeness. Compact context preserves CSS values; it never truncates them to meet a character target. Very large constraint sets/generated inspiration require separate measurement. |
| Failures / quota | Preserve explicit terminal errors and original-context manual retry. No retry, provider substitution, auto-continuation or hidden paid repair. Keep failed-call usage when supplied; do not estimate missing timeout usage as zero. |
| Monitoring | Record expression, actual prompt characters/request bytes, requested total budget, duration, completed/incomplete flags, output characters, validation stage and numeric usage. Never log credentials, raw prompts, style text or thinking in production. |
| Confidence / quality | A finite successful run does not prove a zero failure rate, long-term quota capacity, hosted reliability, or aesthetic superiority. This investigation prioritizes completed, valid generated work. |
