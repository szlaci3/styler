import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createGenerationApi } from '../server/generation-api.ts';
import { GenerationError } from '../server/generation.ts';
import { seedStyle } from '../src/styles/presets.ts';

function exchange(body: string, headers = { host: '127.0.0.1:5174', 'content-type': 'application/json' }, method = 'POST') {
  const request = Object.assign(Readable.from([Buffer.from(body)]), { method, headers }) as unknown as IncomingMessage;
  const result = { status: 0, body: '' };
  const response = { writeHead(status: number) { result.status = status; }, end(value: string) { result.body = value; } } as unknown as ServerResponse;
  return { request, response, result };
}

test('API enforces request bounds, same-origin JSON POST, and two active requests', async () => {
  const releases: (() => void)[] = []; let count = 0;
  const api = createGenerationApi(async () => {
    count++; await new Promise<void>(resolve => { releases.push(resolve); });
    return { style: seedStyle, metrics: { requestId: '00000000-0000-0000-0000-000000000000' as const, elapsedMs: 1, usage: undefined, cost: 'unavailable' } };
  });
  for (const [exchangeValue, status] of [
    [exchange('{}', undefined, 'GET'), 405],
    [exchange('{}', { host: '127.0.0.1:5174', 'content-type': 'text/plain' }), 415],
    [exchange('{}', { host: '127.0.0.1:5174', 'content-type': 'application/json', origin: 'https://evil.example' } as any), 403],
    [exchange('x'.repeat(98_305)), 413], [exchange('{bad'), 400],
  ] as const) {
    await api(exchangeValue.request, exchangeValue.response); assert.equal(exchangeValue.result.status, status);
  }
  const first = exchange('{}');
  const work = api(first.request, first.response);
  await new Promise(resolve => setImmediate(resolve));
  const second = exchange('{}'); const secondWork = api(second.request, second.response);
  await new Promise(resolve => setImmediate(resolve));
  const duplicate = exchange('{}'); await api(duplicate.request, duplicate.response);
  assert.equal(duplicate.result.status, 409); assert.equal(count, 2);
  assert.ok(duplicate.result.body.includes('Generation capacity reached.'));
  releases[0]!(); await work; assert.equal(first.result.status, 200);
  const third = exchange('{}'); const thirdWork = api(third.request, third.response);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(count, 3); // One released lane is reusable while the other is active.
  releases[1]!(); releases[2]!(); await Promise.all([secondWork, thirdWork]);
  assert.equal(second.result.status, 200); assert.equal(third.result.status, 200);
});

test('API releases guard on terminal failure and hides unknown exception text', async () => {
  let calls = 0;
  const api = createGenerationApi(async () => { calls++; throw calls === 1 ? new Error('secret') : new GenerationError('Quota exceeded.', 429); });
  const first = exchange('{}'); await api(first.request, first.response);
  assert.equal(first.result.status, 502); assert.ok(!first.result.body.includes('secret'));
  const second = exchange('{}'); await api(second.request, second.response);
  assert.equal(second.result.status, 429); assert.equal(calls, 2);
});
