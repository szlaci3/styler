import test from 'node:test';
import assert from 'node:assert/strict';
import { compileStyle, parseStyle, declarationId, type Style } from '../shared/style.ts';
import { presets, seedStyle } from '../src/styles/presets.ts';

const mutable = () => JSON.parse(JSON.stringify(presets[0])) as any;

test('seven presets and honest seed share the versioned validated contract', () => {
  assert.equal(presets.length, 7);
  assert.equal(new Set(presets.map(style => style.id)).size, 7);
  assert.equal(new Set(presets.map(style => style.rules[0]!.declarations.find(entry => entry.property === 'background-color')!.value)).size, 7);
  for (const style of [...presets, seedStyle]) assert.deepEqual(parseStyle(style), style);
  assert.equal(seedStyle.provenance, 'seed');
  for (const provenance of ['preset', 'seed', 'joker', 'antigravity']) assert.equal(parseStyle({ ...presets[0], provenance }).provenance, provenance);
});

test('missing declarations stay absent and source order is preserved', () => {
  const input: Style = { schemaVersion: 1, id: 'G2', name: 'Sparse', provenance: 'joker', rules: [
    { selectorId: 'button', declarations: [{ id: declarationId('button', 'color'), property: 'color', value: '#abcdef' }] },
    { selectorId: 'page', declarations: [] },
  ] };
  const parsed = parseStyle(input);
  assert.deepEqual(parsed, input);
  assert.equal(compileStyle(parsed), '.preview-root .sample-button { color: #abcdef; }\n.preview-root .sample-page {  }');
  assert.equal(compileStyle(parsed).includes('unset'), false);
  assert.ok(compileStyle(presets[0]).includes('.preview-root .sample-nav-link, .preview-root .sample-hero-note'));
});

test('validation copies and freezes originals without freezing the caller', () => {
  const input = mutable();
  const parsed = parseStyle(input);
  input.rules[0].declarations[0].value = '#000000';
  assert.notEqual(parsed.rules[0]!.declarations[0]!.value, '#000000');
  assert.ok(Object.isFrozen(parsed));
  assert.ok(Object.isFrozen(parsed.rules));
  assert.ok(Object.isFrozen(parsed.rules[0]!.declarations[0]));
  assert.throws(() => { (parsed.rules[0]!.declarations[0] as { value: string }).value = '#000000'; }, TypeError);
});

test('rejects stylesheet injection, arbitrary selectors/properties, duplicates and unstable IDs', () => {
  const mutations: ((style: any) => void)[] = [
    style => { style.rules[0].selectorId = 'body'; },
    style => { style.rules[0].selector = 'body'; },
    style => { style.rules[0].declarations[0].property = 'position'; },
    style => { style.rules[0].declarations[0].id = 'wrong-id'; },
    style => { style.rules.push(style.rules[0]); },
    style => { style.rules[0].declarations.push(style.rules[0].declarations[0]); },
    style => { style.schemaVersion = 2; },
    style => { style.provenance = 'ai'; },
    style => { style.name = '</style><script>'; },
    style => { style.extra = 'unknown'; },
  ];
  for (const mutate of mutations) { const input = mutable(); mutate(input); assert.throws(() => compileStyle(input), /Invalid style/); }
  for (const value of ['red; } body { display:none', 'url(https://example.com)', '#fff!important', 'var(--bad)', 'unset', '</style>', '#fffg']) {
    const input = mutable(); input.rules[0].declarations[0].value = value;
    assert.throws(() => compileStyle(input), /Invalid style/);
  }
});

test('enforces property-specific syntax and numeric limits, including safe shadows and fonts', () => {
  const check = (property: string, value: unknown) => parseStyle({ ...presets[0], rules: [{ selectorId: 'button', declarations: [{ id: `button:${property}`, property, value }] }] });
  for (const [property, value] of [['padding-top', '-1px'], ['padding-top', '49px'], ['padding', '12px'],
    ['font-size', '200px'], ['font-family', 'url(https://example.com)'], ['line-height', '9'],
    ['border-top-width', '7px'], ['box-shadow', '0 0 99999px red'], ['box-shadow', '0px 0px 10px 0px #000; color:red']]) {
    assert.throws(() => check(property!, value), /Invalid style/);
  }
  assert.doesNotThrow(() => check('padding-top', '0px'));
  assert.doesNotThrow(() => check('box-shadow', '0px 8px 24px 0px #00000030'));
  assert.doesNotThrow(() => check('box-shadow', 'none'));
  assert.doesNotThrow(() => check('font-weight', '573.42'));
  for (const value of ['399.99', '800.01', '900', '573.421', '500; color:red']) assert.throws(() => check('font-weight', value), /Invalid style/);
  assert.throws(() => check('color', null), /Invalid style/);
  assert.throws(() => parseStyle(null), /Invalid style/);
  assert.throws(() => parseStyle([]), /Invalid style/);
  assert.throws(() => parseStyle(Object.create({ ...presets[0] })), /Invalid style/);
});
