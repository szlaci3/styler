import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeJoker } from '../src/generation/joker.ts';
import { presets } from '../src/styles/presets.ts';

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
