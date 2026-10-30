# M1 — Antigravity compatibility verification

Completed 2026-10-30. Roadmap and first milestone approved by the user. No frontend or deployment was built.

## Live evidence

Exactly one generation reached the provider. A first attempt inside the restricted network failed before obtaining an HTTP response (58 ms, `fetch failed`); network-enabled execution then reached the provider. No automatic retry or alternative model was used. Two later GET requests inspected the same stored interaction without generating another result.

| Measurement | Observed result |
|---|---|
| Request start | 2026-10-30 16:54:34.236 UTC (17:54:34 Europe/Brussels) |
| Endpoint | POST `https://generativelanguage.googleapis.com/v1beta/interactions` |
| Authentication | Existing server-side `GEMINI_API_KEY` via `x-goog-api-key` |
| Requested and returned agent | `antigravity-preview-09-2026` |
| HTTP / interaction status | 200 / `completed` |
| Foreground request latency | 17,938 ms |
| Interaction ID | `v1_ChcwY3ZrYXEzR05MeUluc0VQaWZhQy1BMBIXMGN2a2FxM0dOTHlJbnNFUGlmYUMtQTA` |
| JSON-schema response format | Accepted; echoed type `text`, MIME `application/json`, schema present |
| Requested token budget | 6,000; response echoed `max_total_tokens: "6000"` |
| Total tokens | 5,630 |
| Input tokens | 4,801 |
| Output tokens | 59 |
| Thought tokens | 770 |
| Tool-use tokens | 0 |
| Cached tokens | 0 |
| Local output validation | Passed after parsing the actual REST envelope |
| Approximate cost | Unavailable; no rate verified or price inferred |

The first parser assumed `outputs`, so the initial diagnostic incorrectly classified the completed response as invalid. A content-free shape inspection found `steps`, containing a thought step and a model-output step. The parser now reads text from the last `model_output` step's `content` array, ignoring thought/tool content. Retrieving the same interaction then passed validation in 846 ms. This is retrieval latency, not generation latency.

Actual top-level POST keys: `id`, `status`, `usage`, `environment_id`, `service_tier`, `steps`, `object`, `environment`, `response_format`, `agent`, `agent_config`. GET also exposed creation/update timestamps. Raw provider payloads, thought content, output text, and credentials were not persisted or printed.

The response passed the deliberately small local contract: a short safe name, four six-digit hex colors, locked button border-radius exactly `12px`, and no button border-width or other unknown keys. One valid sample establishes compatibility, not universal schema enforcement or visual quality.

## Implementation and checks

- Native Node fetch; Node's built-in `.env` loading and TypeScript execution; no runtime dependencies.
- `server/probe-antigravity.ts`: one bounded foreground request, optional explicit stored-result inspection, sanitized metadata, error/status handling, 1 MiB response-size guard, and nonzero failure exit.
- `server/probe-contract.ts`: exact agent and endpoint constants, small response schema, strict runtime validation, final-text extraction, credential redaction, numeric token-usage filtering.
- `npm run typecheck`: passed, exit 0.
- `npm test`: five focused offline tests passed, exit 0. Coverage includes captured lock/omission requirements, unsafe/malformed values, actual steps envelope, exclusion of thoughts/tool output, and redacted diagnostics.
- `npm install --save-dev typescript @types/node --fetch-retries=0 --fetch-timeout=30000`: completed with network permission; four packages added, zero audit vulnerabilities reported. The initial network-restricted install was stopped before retrying with network access.
- `git diff --check`: passed; new files were also explicitly checked for whitespace and credential leakage before handoff.

## Decisions and limits

Use this exact Interactions agent interface for M10. Do not use `generateContent` or substitute another model. No SDK is necessary for this small HTTP contract.

Foreground execution is sufficient for the local prototype. Background execution, streaming, parallel batches, and hosting lifetime limits remain untested. The tiny output still used thousands of input/thought tokens, so M11 must measure realistic style generation before choosing V1 concurrency or budgets. An 18-second single observation is not a latency guarantee.

The API accepted and echoed the budget; this probe does not establish hard billing or cancellation guarantees. `tools: []` and a no-tools prompt yielded zero tool-use tokens, but do not prove all sandbox capabilities were disabled. A client timeout can leave upstream work running. No timeout occurred in the successful run.

The small probe is not the M3 full style schema and does not establish lock/cascade correctness for the future UI. The prompt-JSON diagnostic mode was not needed or tested live. Public hosting, authentication, quota handling under load, cost rates, and full website styling remain unverified.

Next recommended milestone: M2, the first working local desktop interface.
