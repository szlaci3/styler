import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleConstraint, parseSnapshot, compileLocks, constrainStyle } from '../shared/constraints.ts';
import { presets } from '../src/styles/presets.ts';

test('toggle transitions capture, clear, and replace mutually exclusive constraints', () => {
  let s = toggleConstraint([], 'button', 'color', 'locked', '#123456');
  assert.equal(s[0]?.state, 'locked');
  s = toggleConstraint(s, 'button', 'color', 'unset');
  assert.deepEqual(s, [{ selectorId: 'button', property: 'color', state: 'unset' }]);
  assert.deepEqual(toggleConstraint(s, 'button', 'color', 'unset'), []);
  s = toggleConstraint(s, 'button', 'color', 'locked', '#abcdef');
  assert.deepEqual(toggleConstraint(s, 'button', 'color', 'locked'), []);
  assert.throws(() => parseSnapshot([{ selectorId: 'page', property: 'color', state: 'locked', value: 'url(x)' }]));
});

test('canonical locks ignore click order and preserve originals and omissions', () => {
  const a = { selectorId: 'page', property: 'color', state: 'locked', value: '#123456' } as const;
  const b = { selectorId: 'button', property: 'color', state: 'locked', value: '#abcdef' } as const;
  assert.equal(compileLocks([a, b]), compileLocks([b, a]));
  const original = JSON.stringify(presets[0]);
  const result = constrainStyle(presets[0], [a, { selectorId: 'button', property: 'background-color', state: 'unset' }]);
  assert.equal(result.rules[0]?.declarations.find(d => d.property === 'color')?.value, '#123456');
  assert.equal(result.rules.find(r => r.selectorId === 'button')?.declarations.some(d => d.property === 'background-color'), false);
  assert.equal(JSON.stringify(presets[0]), original);
  assert.ok(Object.isFrozen(result.rules));
});
