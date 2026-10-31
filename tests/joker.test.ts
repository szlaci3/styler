import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeJoker } from '../src/generation/joker.ts';
import { presets, seedStyle } from '../src/styles/presets.ts';
import { parseStyle, type Style } from '../shared/style.ts';

const colorRelated = (property: string) => property === 'color' || property.endsWith('-color') || property === 'box-shadow';
const hexIn = (value: string) => value.match(/#[\da-f]+/i)?.[0];
function channels(hex: string) {
  const expanded = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex;
  return { rgb: [1, 3, 5].map(offset => parseInt(expanded.slice(offset, offset + 2), 16)), alpha: expanded.slice(7).toLowerCase() };
}
function assertPalette(style: Style, inspiration: Style | null) {
  let checked = 0;
  for (const rule of style.rules) for (const d of rule.declarations) {
    if (!colorRelated(d.property)) continue;
    const source = inspiration?.rules.find(r => r.selectorId === rule.selectorId)?.declarations.find(entry => entry.property === d.property)
      ?? seedStyle.rules.find(r => r.selectorId === rule.selectorId)?.declarations.find(entry => entry.property === d.property);
    assert.ok(source, `${d.id} has a palette source`);
    const hex = hexIn(d.value);
    if (!hex) { assert.equal(d.value, 'none'); continue; }
    const original = channels(hexIn(source.value)!), actual = channels(hex);
    actual.rgb.forEach((channel, index) => assert.ok(channel >= 0 && channel <= 255
      && Math.abs(channel - original.rgb[index]!) <= 20, `${d.id} channel ${index}: ${channel} vs ${original.rgb[index]}`));
    assert.equal(actual.alpha, original.alpha, d.id);
    checked++;
  }
  assert.ok(checked > 0);
}

test('Joker bounds every color channel to inspiration or G1, including shadow colors', () => {
  const before = JSON.stringify({ presets, seedStyle });
  for (const inspiration of [null, ...presets]) for (let seed = 0; seed < 100; seed++) {
    assertPalette(makeJoker(seed, [], 'G2', inspiration), inspiration);
  }
  assert.equal(JSON.stringify({ presets, seedStyle }), before);
});

test('Joker supports shorthand/full/alpha hex, channel limits, sparse inspiration and shared palette colors', () => {
  for (const hex of ['#369', '#326496', '#32649680', '#000', '#fff', '#00000000', '#ffffffFF']) {
    const inspiration = parseStyle({ ...seedStyle, rules: [{ selectorId: 'card', declarations: [
      { id: 'card:color', property: 'color', value: hex },
      { id: 'card:background-color', property: 'background-color', value: hex },
      { id: 'card:box-shadow', property: 'box-shadow', value: `1px 2px 3px 0px ${hex}` },
    ] }] });
    const before = JSON.stringify(inspiration);
    for (let seed = 0; seed < 100; seed++) {
      const result = makeJoker(seed, [], 'G2', inspiration);
      assertPalette(result, inspiration);
      const card = result.rules.find(rule => rule.selectorId === 'card')!;
      const values = card.declarations.filter(d => ['color', 'background-color', 'box-shadow'].includes(d.property)).map(d => hexIn(d.value));
      assert.ok(values.every(value => value === values[0]));
      assert.ok(card.declarations.find(d => d.property === 'box-shadow')!.value.startsWith('1px 2px 3px 0px '));
      assert.ok(result.rules.some(rule => rule.selectorId === 'page'));
    }
    assert.equal(JSON.stringify(inspiration), before);
  }
});

test('Joker applies exact color/shadow locks and omissions after color variation', () => {
  const snapshot = [
    { selectorId: 'card', property: 'border-left-color', state: 'locked', value: '#ff0000' },
    { selectorId: 'card', property: 'box-shadow', state: 'locked', value: '0px 4px 16px 0px #12345678' },
    { selectorId: 'card', property: 'background-color', state: 'unset' },
    { selectorId: 'page', property: 'color', state: 'unset' },
  ] as const;
  for (const inspiration of [null, presets[3]!]) {
    const result = makeJoker(42, snapshot, 'G2', inspiration);
    for (const c of snapshot) {
      const actual = result.rules.find(rule => rule.selectorId === c.selectorId)?.declarations.find(d => d.property === c.property)?.value;
      assert.equal(actual, c.state === 'locked' ? c.value : undefined);
    }
  }
});

test('Joker is reproducible, adventurous, constrained, and immutable', () => {
  const snapshot = [{ selectorId: 'button', property: 'color', state: 'locked', value: '#123456' },
    { selectorId: 'page', property: 'background-color', state: 'unset' }] as const;
  const before = JSON.stringify(presets);
  const a = makeJoker(42, snapshot, 'G2');
  assert.deepEqual(a, makeJoker(42, snapshot, 'G2'));
  assert.notDeepEqual(a.rules, makeJoker(43, snapshot, 'G2').rules);
  assert.equal(a.rules.find(r => r.selectorId === 'button')?.declarations.find(d => d.property === 'color')?.value, '#123456');
  assert.equal(a.rules.find(r => r.selectorId === 'page')?.declarations.some(d => d.property === 'background-color'), false);
  assert.equal(JSON.stringify(presets), before);
  assert.ok(Object.isFrozen(a));
});

test('inspiration guides Joker typography and palette while explicit constraints override it', () => {
  const original = JSON.stringify(presets[3]);
  const snapshot = [{ selectorId: 'button', property: 'color', state: 'locked', value: '#abcdef' },
    { selectorId: 'page', property: 'background-color', state: 'unset' }] as const;
  const a = makeJoker(42, snapshot, 'G2', presets[3]);
  assert.deepEqual(a, makeJoker(42, snapshot, 'G2', presets[3]));
  const value = (style: typeof a, selector: string, property: string) => style.rules.find(r => r.selectorId === selector)?.declarations.find(d => d.property === property)?.value;
  assert.equal(value(a, 'page', 'font-family'), "'Courier New', monospace");
  assert.equal(value(a, 'heading', 'font-size'), '48px');
  assert.equal(value(a, 'button', 'color'), '#abcdef');
  assert.equal(value(a, 'page', 'background-color'), undefined);
  assert.notDeepEqual(a.rules, makeJoker(42, snapshot, 'G2', presets[2]).rules);
  assert.equal(JSON.stringify(presets[3]), original);
  // Values from generated styles may have fractional spacing; mutations stay bounded.
  const fractional = { ...presets[3]!, rules: [{ selectorId: 'card' as const, declarations: [{ id: 'card:padding-top', property: 'padding-top' as const, value: '13.37px' }] }] };
  for (let seed = 0; seed < 50; seed++) assert.doesNotThrow(() => makeJoker(seed, [], 'G2', fractional));
});
