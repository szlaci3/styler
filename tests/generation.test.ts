import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateStyle, makeGenerationRequest, parseGenerationRequest } from '../server/generation.ts';
import { AGENT } from '../server/probe-contract.ts';
import { seedStyle, presets } from '../src/styles/presets.ts';

const request = { id: 'G3', snapshot: [{ selectorId: 'button', property: 'color', state: 'locked', value: '#abcdef' },
  { selectorId: 'card', property: 'padding-top', state: 'unset' }] };
const output = { ...seedStyle, id: 'G3', provenance: 'antigravity' };
const envelope = (style: unknown) => ({ agent: AGENT, status: 'completed', usage: { total_tokens: 12, secret: 'hidden' },
  steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(style) }] }] });
const mock = (data: unknown, status = 200): typeof fetch => async () => Response.json(data, { status });

test('full-schema agent contract uses exact system and normalizes captured constraints', async () => {
  const reports: object[] = [];
  const body = makeGenerationRequest(request);
  assert.equal(body.agent, AGENT); assert.equal(body.agent_config.max_total_tokens, 16000);
  assert.throws(() => parseGenerationRequest({ ...request, extra: true }));
  const result = await generateStyle(request, { key: 'test-only', fetcher: mock(envelope(output)), log: value => reports.push(value) });
  assert.equal(result.style.rules.find(r => r.selectorId === 'button')?.declarations.find(d => d.property === 'color')?.value, '#abcdef');
  assert.equal(result.style.rules.find(r => r.selectorId === 'card')?.declarations.some(d => d.property === 'padding-top'), false);
  assert.deepEqual(result.metrics.usage, { total_tokens: 12 });
  assert.equal(result.metrics.cost, 'unavailable');
  assert.ok(!JSON.stringify(reports).includes('test-only'));
});

test('provider failures are sanitized, recorded, and never automatically retried', async () => {
  for (const [status, message] of [[401, 'Authentication failed.'], [403, 'Authentication failed.'], [429, 'Quota exceeded.'], [500, 'Provider unavailable.']] as const) {
    let calls = 0; const reports: object[] = [];
    await assert.rejects(generateStyle(request, { key: 'secret-test', fetcher: async () => { calls++; return Response.json({ error: 'secret-test', usage: { total_tokens: 7 } }, { status }); }, log: r => reports.push(r) }), { message });
    assert.equal(calls, 1); assert.ok(!JSON.stringify(reports).includes('secret-test'));
    assert.equal((reports[0] as any).usage.total_tokens, 7);
  }
  for (const error of [new DOMException('secret-test', 'TimeoutError'), new Error('secret-test')]) {
    await assert.rejects(generateStyle(request, { key: 'secret-test', fetcher: async () => { throw error; }, log: () => {} }),
      { message: error.name === 'TimeoutError' ? 'Generation timed out.' : 'Provider unavailable.' });
  }
  await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: mock({ ...envelope(output), status: 'incomplete' }), log: () => {} }), { message: 'Generation incomplete.' });
});

test('unsafe, malformed, wrong-agent, empty and oversized output is rejected', async () => {
  const bad = [envelope({ ...output, rules: [{ selectorId: 'page', declarations: [{ id: 'page:color', property: 'color', value: 'url(secret)' }] }] }),
    envelope({ ...output, id: 'G9' }), envelope({ ...output, provenance: 'joker' }), envelope({ ...output, rules: [] }),
    { ...envelope(output), agent: 'other' }, { ...envelope(output), status: 'failed' },
    { ...envelope(output), steps: [{ type: 'model_output', content: [{ type: 'text', text: '{bad' }] }] }];
  for (const data of bad) await assert.rejects(generateStyle({ id: 'G3', snapshot: [] }, { key: 'test-only', fetcher: mock(data), log: () => {} }), { message: 'Invalid generated style.' });
  await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: async () => new Response('x'.repeat(1_048_577)), log: () => {} }), { message: 'Invalid generated style.' });
});

test('captured inspiration is copied and frozen, validated, and sent below explicit constraints', async () => {
  const inspiration = JSON.parse(JSON.stringify(presets[3]));
  const original = JSON.stringify(inspiration);
  const captured = parseGenerationRequest({ ...request, inspiration });
  inspiration.rules[0].declarations[0].value = '#000000';
  assert.equal(JSON.stringify(captured.inspiration), original);
  assert.ok(Object.isFrozen(captured));
  assert.ok(Object.isFrozen(captured.inspiration?.rules[0]?.declarations));
  assert.ok(Object.isFrozen(captured.snapshot));
  const body = makeGenerationRequest(captured);
  assert.equal(body.agent, AGENT);
  assert.ok(body.input.includes(JSON.stringify(captured.inspiration)));
  assert.ok(body.input.includes('constraints take priority over inspiration'));
  const result = await generateStyle(captured, { key: 'test-only', fetcher: mock(envelope({ ...captured.inspiration, id: 'G3', provenance: 'antigravity' })), log: () => {} });
  assert.equal(result.style.rules.find(r => r.selectorId === 'button')?.declarations.find(d => d.property === 'color')?.value, '#abcdef');
  assert.equal(result.style.rules.find(r => r.selectorId === 'card')?.declarations.some(d => d.property === 'padding-top'), false);
  for (const bad of ['S4', {}, { ...presets[3], name: '<script>' }, { ...presets[3], rules: [{ selectorId: 'body', declarations: [] }] }]) {
    assert.throws(() => parseGenerationRequest({ ...request, inspiration: bad }), /Invalid generation request/);
  }
  assert.equal(parseGenerationRequest(request).inspiration, null);
});
