import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundApi, JOB_WAIT_MS, JOB_RETENTION_MS, type JobStore } from '../server/background-jobs.ts';
import { generateStyle, GenerationError } from '../server/generation.ts';
import { AGENT } from '../server/probe-contract.ts';
import { seedStyle } from '../src/styles/presets.ts';
import generate from '../netlify/functions/generate.mts';

function fixture(run?: typeof generateStyle) {
  const values = new Map<string, unknown>();
  const store: JobStore = {
    read: async <T>(name: string) => (values.get(name) ?? null) as T | null,
    write: async (name, value) => { values.set(name, structuredClone(value)); },
    claim: async name => { if (values.has(name)) return false; values.set(name, true); return true; },
    async *keys() { yield* values.keys(); }, delete: async name => { values.delete(name); },
  };
  const dispatched: { jobId: string; signature: string }[] = [];
  let now = 1761825600000;
  const deps = { store, key: () => 'test-only-secret', run, now: () => now,
    dispatch: async (jobId: string, signature: string) => { dispatched.push({ jobId, signature }); } };
  return { api: createBackgroundApi(deps), deps, values, dispatched, advance: (ms: number) => { now += ms; } };
}
const input = { id: 'G3', snapshot: [{ selectorId: 'button', property: 'color', state: 'locked', value: '#abcdef' },
  { selectorId: 'card', property: 'padding-top', state: 'unset' }] };
const post = (payload: unknown, path = '/api/generate', headers: Record<string, string> = {}) => new Request(`https://styler.example${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', origin: 'https://styler.example', ...headers }, body: JSON.stringify(payload),
});
const status = (jobId: string) => new Request(`https://styler.example/api/generation-status?job=${jobId}`);
const worker = (dispatch: { jobId: string; signature: string }) => post({ jobId: dispatch.jobId }, '/.netlify/functions/generate-background', { 'x-styler-signature': dispatch.signature });

test('deployed health handler needs no key or storage and does not initialize paid generation', async () => {
  const response = await generate(new Request('https://styler.example/api/health'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'styler-netlify', generation: 'background' });
  assert.equal((await generate(post({}, '/api/health'))).status, 405);
});

test('background job is acknowledged before AI work; cross-instance duplicate delivery calls the exact agent once', async () => {
  let calls = 0;
  let release!: () => void;
  const f = fixture(async (request, options) => generateStyle(request, { ...options, log: () => {}, fetcher: async (_url, init) => {
    calls++;
    assert.equal(JSON.parse(init!.body as string).agent, AGENT);
    assert.ok(JSON.parse(init!.body as string).input.includes('Design expression: Professional.'));
    await new Promise<void>(resolve => { release = resolve; });
    return Response.json({ agent: AGENT, status: 'completed', steps: [{ type: 'model_output', content: [
      { type: 'text', text: JSON.stringify({ ...seedStyle, id: 'G3', provenance: 'antigravity' }) },
    ] }] });
  } }));
  const acknowledgement = await f.api.start(post({ ...input, expression: 'Professional' }));
  assert.equal(acknowledgement.status, 202);
  const job = await acknowledgement.json();
  assert.equal(calls, 0); assert.equal(f.dispatched.length, 1);
  assert.equal((await f.api.status(status(job.jobId))).status, 202);
  const work = f.api.work(worker(f.dispatched[0]!));
  await new Promise(resolve => setImmediate(resolve));
  const duplicateInstance = createBackgroundApi(f.deps);
  assert.equal((await duplicateInstance.work(worker(f.dispatched[0]!))).status, 204);
  assert.equal(calls, 1);
  release(); await work;
  const result = await f.api.status(status(job.jobId));
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.equal(data.style.rules.find((r: any) => r.selectorId === 'button').declarations.find((d: any) => d.property === 'color').value, '#abcdef');
  assert.equal(data.style.rules.find((r: any) => r.selectorId === 'card').declarations.some((d: any) => d.property === 'padding-top'), false);
  assert.ok(!JSON.stringify(data).includes('test-only-secret'));
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal((await f.api.work(worker(f.dispatched[0]!))).status, 204);
  assert.equal(calls, 1);
});

test('background endpoints validate method, HTTPS origin, schema, bounded body and worker signatures before paid work', async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; throw new Error('must not call'); });
  assert.equal((await f.api.start(new Request('https://styler.example/api/generate'))).status, 405);
  assert.equal((await f.api.start(post(input, undefined, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await f.api.start(post(input, undefined, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await f.api.start(post({ ...input, extra: true }))).status, 400);
  assert.equal((await f.api.start(post('x'.repeat(98_304)))).status, 413);
  assert.equal((await f.api.status(status('../input'))).status, 400);
  await f.api.start(post(input));
  const dispatch = f.dispatched[0]!;
  assert.equal((await f.api.work(post({ jobId: dispatch.jobId }, '/worker'))).status, 403);
  assert.equal((await f.api.work(worker({ ...dispatch, signature: 'a'.repeat(64) }))).status, 403);
  assert.equal(calls, 0);
  const noKey = createBackgroundApi({ ...f.deps, key: () => undefined });
  assert.equal((await noKey.start(post(input))).status, 503);
  assert.equal(f.dispatched.length, 1);
});

test('background provider errors are terminal, sanitized and never automatically retried', async () => {
  for (const error of [new GenerationError('Quota exceeded.', 429), new GenerationError('Generation timed out.', 504), new Error('secret')]) {
    let calls = 0;
    const f = fixture(async () => { calls++; throw error; });
    const job = await (await f.api.start(post(input))).json();
    await f.api.work(worker(f.dispatched[0]!));
    await f.api.work(worker(f.dispatched[0]!));
    const response = await f.api.status(status(job.jobId));
    assert.equal(response.status, error instanceof GenerationError ? error.status : 502);
    assert.ok(!(await response.text()).includes('secret'));
    assert.equal(calls, 1);
  }
});

test('lost worker/result, expiry and cleanup have finite paths without paid replay', async () => {
  const f = fixture();
  const job = await (await f.api.start(post(input))).json();
  f.advance(JOB_WAIT_MS);
  assert.equal((await f.api.status(status(job.jobId))).status, 504);
  assert.equal((await f.api.work(worker(f.dispatched[0]!))).status, 204);
  assert.ok(!f.values.has(`${job.jobId}/claim`));
  f.advance(JOB_RETENTION_MS);
  assert.equal((await f.api.status(status(job.jobId))).status, 410);
  await f.api.cleanup();
  assert.equal(f.values.size, 0);
  assert.equal((await f.api.status(status(job.jobId))).status, 404);
});

test('ambiguous dispatch and result-write failure do not redispatch or repeat AI', async () => {
  let dispatches = 0, calls = 0;
  const f = fixture(async () => { calls++; throw new GenerationError('Generation timed out.', 504); });
  const brokenDispatch = createBackgroundApi({ ...f.deps, dispatch: async () => { dispatches++; throw new Error('secret'); } });
  assert.equal((await brokenDispatch.start(post(input))).status, 502);
  assert.equal(dispatches, 1);
  await f.api.start(post(input));
  const originalWrite = f.deps.store.write;
  f.deps.store.write = async (name, value) => { if (name.endsWith('/result')) throw new Error('secret'); await originalWrite(name, value); };
  await f.api.work(worker(f.dispatched[0]!));
  await createBackgroundApi(f.deps).work(worker(f.dispatched[0]!));
  assert.equal(calls, 1);
});
