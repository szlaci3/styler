import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT, makeProbeRequest, extractOutputText, validateProbeStyle, sanitize, numericUsage } from '../server/probe-contract.ts';

const valid = () => ({ name: 'Quiet Studio', page: { color: '#112233', 'background-color': '#ffffff' },
  button: { color: '#ffffff', 'background-color': '#112233', 'border-radius': '12px' } });

test('probe targets the exact agent with a budget and an explicit structured response contract', () => {
  const request = makeProbeRequest();
  assert.equal(request.agent, AGENT);
  assert.equal('model' in request, false);
  assert.equal(request.background, false);
  assert.ok(request.agent_config.max_total_tokens > 0);
  assert.equal(request.response_format?.mime_type, 'application/json');
  assert.equal('response_format' in makeProbeRequest(false), false);
});

test('valid style meets locked and omitted declaration requirements', () => {
  assert.equal(validateProbeStyle(valid()), true);
  const wrongLock = valid(); wrongLock.button['border-radius'] = '13px';
  assert.equal(validateProbeStyle(wrongLock), false);
  const unsetPresent = valid(); Object.assign(unsetPresent.button, { 'border-width': '1px' });
  assert.equal(validateProbeStyle(unsetPresent), false);
});

test('rejects malicious values, unknown keys and malformed shapes', () => {
  for (const invalid of [null, [], {}, { ...valid(), html: '<script>' }, { ...valid(), name: '<script>' }]) {
    assert.equal(validateProbeStyle(invalid), false);
  }
  for (const unsafe of ['red; } body { display:none', 'url(https://example.com)', '#fff', '#ffffff!important']) {
    const style = valid(); style.page.color = unsafe;
    assert.equal(validateProbeStyle(style), false);
  }
});

test('extracts only output text, never reasoning or tool results', () => {
  assert.equal(extractOutputText({ steps: [{ type: 'thought', summary: [{ text: 'private' }] },
    { type: 'model_output', content: [{ type: 'text', text: 'earlier output' }] },
    { type: 'code_execution_result', content: [{ type: 'text', text: 'tool output' }] },
    { type: 'model_output', content: [{ type: 'text', text: '{}' }] }] }), '{}');
  assert.equal(extractOutputText({ steps: [{ type: 'thought', text: '{}' }] }), undefined);
  assert.equal(extractOutputText({ outputs: [{ type: 'thought', text: 'secret reasoning' },
    { type: 'code_execution_result', text: 'untrusted tool output' }, { type: 'text', text: '{' },
    { type: 'text', text: '}' }] }), '{}');
  assert.equal(extractOutputText({ output_text: '{}' }), '{}');
  assert.equal(extractOutputText({ outputs: [{ type: 'thought', text: '{}' }] }), undefined);
  assert.equal(extractOutputText(null), undefined);
});

test('diagnostics redact credentials and retain only numeric token usage', () => {
  assert.equal(sanitize('key private-value\nAIzaFakeKey', 'private-value'), 'key [REDACTED] [REDACTED]');
  assert.equal(sanitize('a'.repeat(1000)).length, 600);
  assert.deepEqual(numericUsage({ total_input_tokens: 10, total_output_tokens: 2,
    transcript: 'private', secret_tokens: 'not numeric', bad_tokens: Infinity }),
  { total_input_tokens: 10, total_output_tokens: 2 });
});
