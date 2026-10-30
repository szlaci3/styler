import { parseStyle, type Property, type Style } from '../../shared/style.ts';
import { constrainStyle, parseSnapshot, type Snapshot } from '../../shared/constraints.ts';
import { presets } from '../styles/presets.ts';

export function makeJoker(seed: number, snapshot: Snapshot, id: string, inspiration: Style | null = null) {
  const captured = parseSnapshot(snapshot);
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const base = inspiration ? parseStyle(inspiration) : presets[Math.floor(random() * presets.length)]!;
  const color = () => '#' + Math.floor(random() * 0x1000000).toString(16).padStart(6, '0');
  const inspiredColor = (hex: string) => {
    const expanded = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex;
    const shift = Math.floor(random() * 49) - 24;
    return '#' + [1, 3, 5].map(offset => Math.max(0, Math.min(255, parseInt(expanded.slice(offset, offset + 2), 16) + shift))
      .toString(16).padStart(2, '0')).join('') + expanded.slice(7);
  };
  const colors = new Map<string, string>();
  const rules = base.rules.map(rule => ({ ...rule, declarations: rule.declarations.map(d => {
    let value = d.value;
    if (d.property === 'color' || d.property.endsWith('-color')) {
      if (!colors.has(value)) colors.set(value, inspiration ? inspiredColor(value) : color());
      value = colors.get(value)!;
    } else if (d.property.endsWith('-radius') || (d.property as Property).startsWith('padding-')) {
      value = inspiration ? `${Math.round(Math.max(0, Math.min(48, parseFloat(value) + Math.floor(random() * 9) - 4)) * 100) / 100}px`
        : d.property.endsWith('-radius') ? `${Math.floor(random() * 33)}px` : `${8 + Math.floor(random() * 21)}px`;
    }
    return { ...d, value };
  }) }));
  return constrainStyle(parseStyle({ ...base, id, name: `Joker ${seed >>> 0}`, provenance: 'joker', rules }), captured);
}
