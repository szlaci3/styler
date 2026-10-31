# Antigravity reliability continuation — 2026-10-31

The user reported replenished quota and an updated local `.env` key and authorized continuing the investigation. New processes load that file; the host has no inherited `GEMINI_API_KEY` overriding it. No key value or fingerprint is retained. This continuation supersedes the initial report's quota-blocked next steps and its earlier output format. Original evidence remains unchanged in `antigravity-reliability-measurements.json`.

## What the continuation exposed

The initial system-instruction profile was not yet reliable enough. Ten resumed calls at concurrency two all returned provider status `completed`, but only **6/10 passed application validation**. Four contained malformed JSON, including a declaration written as `"property":"font-size":"48px"`. Structured response format did not eliminate syntax errors. No incomplete or timeout outcome occurred in that run.

An intermediate declaration-map format cut response text from 9,090–10,300 characters to 3,868–4,211 characters. All ten replies were valid JSON, but only **7/10 passed the then-current schema**: failures included omitted provenance metadata, a CSS property used as a selector, and JSON numbers for unitless CSS values. These observations remain failures in the evidence; they are not retrospectively counted as successful calls after adapter changes.

## Selected output contract

The provider now returns only a name and selector/property maps:

```json
{"name":"Studio","rules":{"page":{"color":"#213e43","line-height":1.5},"button":{"background-color":"#235960"}}}
```

The server supplies schema version, request-owned style ID, Antigravity provenance and canonical declaration IDs. The exact agent and completed envelope are still mandatory. It expands the maps into the existing ordered declaration-array schema and performs the same bounded CSS validation and captured lock/Unset/card-treatment normalization. Neither the browser/API result format nor the shared style schema changes.

Only `font-weight` and `line-height` may use finite JSON numbers in the provider format. They become their exact string representation and must still satisfy the existing grammar and bounds. Numeric pixel lengths, unsafe values, unsupported properties/selectors, extra metadata and incomplete envelopes remain errors. Duplicate JSON object keys, including differently escaped spellings of the same key, are rejected before expansion. No unknown selector is dropped and no malformed JSON or invalid CSS is repaired. Legacy full-style responses remain validated for compatibility.

The response schema explicitly names every selector and property, avoiding a separate selector-ID value for the model to mistype. Complete-design guidance, the 392-character direct-JSON system role, compact inspiration, fixed 24,000-token total budget, two app lanes and 90/150-second provider/job limits remain. No fallback, automatic retry or budget escalation is added.

## Measured continuation

Per-call evidence, request hashes and final browser evidence are in [antigravity-reliability-continuation.json](antigravity-reliability-continuation.json). Every failure is retained. Direct trials use the same button-color lock and Unset card padding; the varied set covers all seven presets and no inspiration. Sequential and paced trials use identical request bodies, with the same five expressions and paired S1/S4 inspiration.

| Profile | Calls | Accepted | Provider completed | Duration per call |
| --- | ---: | ---: | ---: | --- |
| Previous declaration arrays, two lanes | 10 | 6 | 10 | 31.0–71.2 s |
| Intermediate declaration maps, two lanes | 10 | 7 | 10 | 23.9–45.6 s |
| **Selected selector maps, two lanes** | **10** | **10** | **10** | **22.9–56.5 s** |
| Selected maps, sequential, no pause | 5 | 5 | 5 | 23.6–48.3 s |
| Selected maps, sequential, 30-second pauses | 5 | 5 | 5 | 34.0–51.9 s |
| **Selected maps, actual Edge app batch, two lanes** | **5** | **5** | **5** | **15.3–50.2 s** |

The ten selected concurrent results cover all 12 selectors, with 109–134 declarations. Returned JSON is 3,110–3,717 characters. Their full ten-request run takes 189.5 seconds; the matched five-request sequential baseline takes 164.6 seconds. Input/output/thinking usage, tool-step observations, pacing comparison and the real browser batch are retained separately in the per-call record.

The selected profile finishes **25/25 live calls successfully**, without incomplete envelopes, timeouts, JSON/schema failures or tool steps. There are **45 new generation calls** across this continuation's profiles; all 45 completed upstream and 38 passed the validator active at the time. All seven failures in the earlier formats remain in the evidence. No failed trial was automatically retried. Total observed usage is **480,398 tokens**, including failures; cost is unavailable. The selected 25 account for **262,670 tokens**, ranging from **7,376 to 14,152 per call**. This finite sample is evidence of improvement, not a zero-failure guarantee.

The paced and unpaced runs have identical saved request bodies for every expression. The unpaced five take **164.6 seconds**; the paced five take **336.9 seconds**. All four measured post-response pauses are at least **30,004 ms**. Both runs are 5/5, so there is no observed success-rate benefit from the pause; response-time/thinking variation prevents attributing the entire duration difference to pacing. Keep the existing two lanes with no permanent pause.

The actual local Edge batch made exactly five paid calls at peak concurrency two. **Joker appeared in 55 ms, first AI in 15.3 seconds and all five AI slots settled in 89.3 seconds**. All **seven cards** were ready (seed, Joker and five AI). Every result retained the captured S4 inspiration and lock/Unset snapshot while the live inspiration changed to S2. Selection remained independent; the app indicated unused current constraints instead of queuing work. Playful completed before Professional, as allowed. Visual QA inspected `verification-results/reliability/resumed-live-browser.png`. This is live app/provider verification, not an intercepted replay. Hosted Netlify behavior remains unverified.

## Local checks and implementation boundary

**38 offline checks**, **49 mocked Edge checks**, **production build/typecheck**, **Netlify function packaging/routes** and `git diff --check` pass. The added checks cover map-to-array round trips/source order, request-owned identity, captured constraints, numeric unitless representation, escaped duplicate keys, unknown selectors/fields, unsafe values, malformed/incomplete output and unchanged legacy responses. No dependency or browser contract changed. Credential scans passed across **81 source/document/browser-output files** and **60 function-archive entries**, checking the updated local key; production telemetry retains no raw prompts, styles or reasoning.

## Operating recommendations

- Use the smallest sufficient **response contract**, not just a shorter input. Do not ask AI to repeat metadata the server already owns. Keep all meaningful CSS choices and derive only deterministic protocol metadata.
- Typical selected user prompts are about **4,800–8,300 characters** with the tested constraints, plus the system instruction and response schema. This is a measured operating range, not a context-window limit. Preserve inspiration values and constraints; measure larger generated inspirations or large lock sets separately.
- Keep **24,000 total tokens** as headroom. Character count alone cannot account for output, thinking, cached context or agent loops. Observe usage and step types; an empty tools list and zero reported tool-use tokens do not prove tools are disabled.
- Keep strict validation even with a JSON response schema. Distinguish provider completion, JSON syntax, schema/value validity and final captured-constraint acceptance.
- Keep **two lanes with no fixed inter-request delay**, the **90-second provider deadline** and **150-second hosted-job window**. These are supported operating choices for this sample, not provider throughput or context limits. The 30-second pause did not improve observed success and doubled the matched sequential run's wall time.
- Keep manual retry and explicit terminal errors. A finite successful sample does not establish universal or sustained zero failures, higher concurrency capacity, hosted behavior, or aesthetic superiority.

Hosting is untested. No commit, push, deployment or cloud environment update is performed by this continuation.
