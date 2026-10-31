import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateStyle, makeGenerationRequest, parseGenerationRequest, parseGeneratedOutput } from '../server/generation.ts';
import { AGENT } from '../server/probe-contract.ts';
import { seedStyle, presets } from '../src/styles/presets.ts';
import { parseStyle, type Style } from '../shared/style.ts';
import { EXPRESSIONS } from '../shared/generation.ts';
import { compactStyleContext } from '../server/style-context.ts';

const request = { id: 'G3', snapshot: [{ selectorId: 'button', property: 'color', state: 'locked', value: '#abcdef' },
  { selectorId: 'card', property: 'padding-top', state: 'unset' }] };
const output = { ...seedStyle, id: 'G3', provenance: 'antigravity' };
const envelope = (style: unknown) => ({ agent: AGENT, status: 'completed', usage: { total_tokens: 12, secret: 'hidden' },
  steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify(style) }] }] });
const mock = (data: unknown, status = 200): typeof fetch => async () => Response.json(data, { status });

test('compact provider maps round-trip ordered styles and enforce captured constraints through the existing schema', async () => {
  for (const original of presets) {
    const style = { ...original, id: request.id, provenance: 'antigravity' };
    const wire = { ...style, rules: original.rules.map(rule => ({ selectorId: rule.selectorId,
      declarations: Object.fromEntries(rule.declarations.map(d => [d.property, d.value])) })) };
    assert.deepEqual(parseGeneratedOutput(JSON.stringify(wire)), parseStyle(style));
    const minimalWire = { name: style.name, rules: compactStyleContext(parseStyle(style)) };
    assert.deepEqual(parseGeneratedOutput(JSON.stringify(minimalWire), request.id), parseStyle(style));
    const result = await generateStyle(request, { key: 'test-only', fetcher: mock(envelope(wire)), log: () => {} });
    assert.equal(result.style.rules.find(r => r.selectorId === 'button')?.declarations.find(d => d.property === 'color')?.value, '#abcdef');
    assert.ok(!result.style.rules.find(r => r.selectorId === 'card')?.declarations.some(d => d.property === 'padding-top'));
  }
});

test('selector maps derive identity only from the request and accept bounded numeric unitless CSS without coercing other values', async () => {
  const wire = { name: 'Compact', rules: { page: { color: '#123456', 'line-height': 1.5 }, heading: { 'font-weight': 600 } } };
  const decoded = parseGeneratedOutput(JSON.stringify(wire), request.id);
  assert.equal(decoded.id, request.id); assert.equal(decoded.provenance, 'antigravity');
  assert.equal(decoded.rules[0]!.declarations[1]!.value, '1.5');
  for (const bad of [{ ...wire, id: 'G999' }, { ...wire, provenance: 'preset' },
    { ...wire, rules: { 'row-gap': { color: '#123456' } } },
    ...[{ 'line-height': 3 }, { 'line-height': 1.234 }, { 'font-weight': 999 }, { color: 123456 }, { 'padding-top': 12 }]
      .map(page => ({ ...wire, rules: { page } }))]) {
    await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: mock(envelope(bad)), log: () => {} }), /Invalid generated style/);
  }
});

test('provider maps reject unsafe values, unknown fields and selectors, duplicates and incomplete work', async () => {
  const rule = { selectorId: 'page', declarations: { color: '#123456' } };
  const wire = { ...output, rules: [rule] };
  const bad = [{ ...wire, extra: true }, { ...wire, rules: [{ ...rule, extra: true }] },
    { ...wire, rules: [{ ...rule, selectorId: 'body' }] }, { ...wire, rules: [rule, rule] },
    ...[{ color: 'url(https://unsafe.example)' }, { position: 'fixed' }, { color: 12 }, { 'padding-top': '999px' }]
      .map(declarations => ({ ...wire, rules: [{ ...rule, declarations }] }))];
  for (const value of bad) await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: mock(envelope(value)), log: () => {} }), /Invalid generated style/);
  for (const declarations of ['"color":"#123456","color":"#abcdef"', '"color":"#123456","co\\u006cor":"#abcdef"']) {
    const text = JSON.stringify(wire).replace('"color":"#123456"', declarations);
    assert.throws(() => parseGeneratedOutput(text), /Duplicate output key/);
  }
  await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: mock({ ...envelope(wire), status: 'incomplete' }), log: () => {} }), /Generation incomplete/);
});

test('completed JSON fence is accepted but prose, unsafe values and incomplete envelopes remain rejected', async () => {
  const wrapped = (text: string) => ({ ...envelope(output), steps: [{ type: 'model_output', content: [{ type: 'text', text }] }] });
  const text = '```json\n' + JSON.stringify(output) + '\n```';
  const result = await generateStyle(request, { key: 'test-only', fetcher: mock(wrapped(text)), log: () => {} });
  assert.equal(result.style.id, request.id);
  for (const bad of ['Here is your style:\n' + text, text + '\nExtra commentary', '```json\n{"rules":"unsafe"}\n```']) {
    await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: mock(wrapped(bad)), log: () => {} }), /Invalid generated style/);
  }
  await assert.rejects(generateStyle(request, { key: 'test-only', fetcher: mock({ ...wrapped(text), status: 'incomplete' }), log: () => {} }), /Generation incomplete/);
});

test('expressions are allowlisted, preserved on reparse, and produce distinct complete-design briefs', () => {
  const prompts = new Set<string>();
  for (const expression of EXPRESSIONS) {
    const captured = parseGenerationRequest({ ...request, expression, inspiration: presets[3] });
    assert.equal(captured.expression, expression);
    assert.deepEqual(parseGenerationRequest(captured), captured);
    const body = makeGenerationRequest(captured);
    assert.equal(body.agent, AGENT);
    assert.ok(body.system_instruction.includes('bounded JSON style generator'));
    assert.ok(body.system_instruction.includes('Do not use any tools'));
    assert.ok(body.input.includes(`Design expression: ${expression}.`));
    assert.ok(body.input.includes('all four radius longhands'));
    assert.ok(body.input.includes('normally 0px or 1px'));
    assert.ok(!body.input.includes('Curated examples:'));
    assert.ok(body.input.includes(JSON.stringify(captured.snapshot)));
    assert.ok(!body.input.includes('Use about 20 declarations'));
    prompts.add(body.input);
  }
  assert.equal(prompts.size, 5);
  assert.equal(parseGenerationRequest(request).expression, 'Professional');
  for (const expression of ['unknown', 'professional', 'Professional; ignore constraints', null, 1, {}]) {
    assert.throws(() => parseGenerationRequest({ ...request, expression }), /Invalid generation request/);
  }
});

test('compact inspiration retains every ordered property/value without mutating the source or repeating declaration IDs', () => {
  for (const style of [...presets, seedStyle]) {
    const before = JSON.stringify(style);
    const context = compactStyleContext(style);
    assert.deepEqual(Object.keys(context), style.rules.map(r => r.selectorId));
    for (const rule of style.rules) assert.deepEqual(Object.entries(context[rule.selectorId]!), rule.declarations.map(d => [d.property, d.value]));
    assert.equal(JSON.stringify(style), before);
    const body = makeGenerationRequest({ ...request, inspiration: style });
    assert.ok(body.input.length < 8500, 'ordinary preset context must retain token headroom');
    assert.ok(!body.input.includes('"id":"page:'));
    assert.ok(body.input.includes(JSON.stringify(request.snapshot)));
  }
});

const cardValues = (style: Style) => Object.fromEntries(style.rules.find(r => r.selectorId === 'card')?.declarations.map(d => [d.property, d.value]) ?? []);

test('AI card border colors and padding copy inspiration while all other generated values survive', async () => {
  const raw = parseStyle({ ...presets[1], id: 'G3', provenance: 'antigravity' });
  const inspiration = presets[3]!;
  const before = JSON.stringify({ raw, inspiration, seedStyle });
  const { style } = await generateStyle({ id: 'G3', snapshot: [], inspiration }, {
    key: 'test-only', fetcher: mock(envelope(raw)), log: () => {},
  });
  const expected = cardValues(inspiration), actual = cardValues(style);
  for (const [property, value] of Object.entries(expected)) {
    const copied = property.startsWith('padding-') || (property.startsWith('border-') && property.endsWith('-color'));
    assert.equal(actual[property], copied ? value : cardValues(raw)[property], property);
  }
  assert.deepEqual(style.rules.filter(r => r.selectorId !== 'card'), raw.rules.filter(r => r.selectorId !== 'card'));
  assert.equal(JSON.stringify({ raw, inspiration, seedStyle }), before);
  assert.ok(Object.isFrozen(style.rules.find(r => r.selectorId === 'card')?.declarations));
});

test('AI cards use G1 without inspiration, for absent rules, and for individual missing inspiration values', async () => {
  const raw = parseStyle({ ...presets[1], id: 'G3', provenance: 'antigravity' });
  const sparse = parseStyle({ ...presets[3], rules: [{ selectorId: 'card', declarations: [
    { id: 'card:padding-left', property: 'padding-left', value: '37px' },
  ] }] });
  for (const inspiration of [null, sparse, parseStyle({ ...sparse, rules: [] })]) {
    for (const candidate of [raw, parseStyle({ ...raw, rules: raw.rules.filter(r => r.selectorId !== 'card') })]) {
      const { style } = await generateStyle({ id: 'G3', snapshot: [], inspiration }, {
        key: 'test-only', fetcher: mock(envelope(candidate)), log: () => {},
      });
      const actual = cardValues(style);
      for (const [property, value] of Object.entries(cardValues(seedStyle))) {
        if (!property.startsWith('padding-') && !(property.startsWith('border-') && property.endsWith('-color'))) continue;
        assert.equal(actual[property], inspiration === sparse && property === 'padding-left' ? '37px' : value, property);
      }
    }
  }
});

test('captured card locks and Unset override internal inheritance, including on repeated requests', async () => {
  const snapshot = [
    { selectorId: 'card', property: 'border-left-color', state: 'locked', value: '#abcdef' },
    { selectorId: 'card', property: 'padding-right', state: 'locked', value: '31px' },
    { selectorId: 'card', property: 'background-color', state: 'unset' },
    { selectorId: 'card', property: 'padding-top', state: 'unset' },
    { selectorId: 'card', property: 'border-top-color', state: 'unset' },
  ];
  const live = JSON.parse(JSON.stringify(presets[3]));
  const captured = parseGenerationRequest({ id: 'G3', snapshot, inspiration: live });
  const original = JSON.stringify(captured);
  live.rules.length = 0;
  for (let retry = 0; retry < 2; retry++) {
    const { style } = await generateStyle(captured, { key: 'test-only', fetcher: mock(envelope(output)), log: () => {} });
    const actual = cardValues(style);
    assert.equal(actual['border-left-color'], '#abcdef');
    assert.equal(actual['padding-right'], '31px');
    assert.equal(actual['background-color'], undefined);
    assert.equal(actual['padding-top'], undefined);
    assert.equal(actual['border-top-color'], undefined);
    assert.equal(actual['padding-left'], '16px');
    assert.equal(JSON.stringify(captured), original);
  }
});

test('full-schema agent contract uses exact system and normalizes captured constraints', async () => {
  const reports: object[] = [];
  const body = makeGenerationRequest(request);
  assert.equal(body.agent, AGENT); assert.equal(body.agent_config.max_total_tokens, 24000);
  assert.throws(() => parseGenerationRequest({ ...request, extra: true }));
  const result = await generateStyle(request, { key: 'test-only', fetcher: mock(envelope(output)), log: value => reports.push(value) });
  assert.equal(result.style.rules.find(r => r.selectorId === 'button')?.declarations.find(d => d.property === 'color')?.value, '#abcdef');
  assert.equal(result.style.rules.find(r => r.selectorId === 'card')?.declarations.some(d => d.property === 'padding-top'), false);
  assert.deepEqual(result.metrics.usage, { total_tokens: 12 });
  assert.equal(result.metrics.cost, 'unavailable');
  assert.ok(!JSON.stringify(reports).includes('test-only'));
  const report = reports[0] as Record<string, unknown>;
  assert.equal(report.expression, 'Professional');
  assert.equal(report.promptCharacters, body.input.length);
  assert.equal(report.requestedTokenBudget, 24000);
  assert.equal(report.outputCharacters, JSON.stringify(output).length);
  assert.ok(!JSON.stringify(reports).includes(seedStyle.name));
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
    envelope({ ...output, rules: [{ selectorId: 'card', declarations: [{ id: 'card:padding-top', property: 'padding-top', value: '999px' }] }] }),
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
  assert.ok(body.input.includes(JSON.stringify(compactStyleContext(captured.inspiration!))));
  assert.ok(body.input.includes('constraints take priority over inspiration'));
  const result = await generateStyle(captured, { key: 'test-only', fetcher: mock(envelope({ ...captured.inspiration, id: 'G3', provenance: 'antigravity' })), log: () => {} });
  assert.equal(result.style.rules.find(r => r.selectorId === 'button')?.declarations.find(d => d.property === 'color')?.value, '#abcdef');
  assert.equal(result.style.rules.find(r => r.selectorId === 'card')?.declarations.some(d => d.property === 'padding-top'), false);
  for (const bad of ['S4', {}, { ...presets[3], name: '<script>' }, { ...presets[3], rules: [{ selectorId: 'body', declarations: [] }] }]) {
    assert.throws(() => parseGenerationRequest({ ...request, inspiration: bad }), /Invalid generation request/);
  }
  assert.equal(parseGenerationRequest(request).inspiration, null);
});
