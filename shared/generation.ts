import { parseStyle, type Style } from './style.ts';
import { parseSnapshot, type Snapshot } from './constraints.ts';

export type GenerationSnapshot = Readonly<{ constraints: Snapshot; inspiration: Style | null }>;
export const EXPRESSIONS = ['Professional', 'Playful', 'Mysterious', 'Commercial', 'Artistic'] as const;
export type Expression = typeof EXPRESSIONS[number];
export const AI_RESULTS_PER_BATCH = EXPRESSIONS.length;
export const AI_CONCURRENCY = 2;

// Copy and deeply freeze both sources at the same boundary. Never capture live
// preview overrides as part of the original inspiration style.
export function captureGenerationSnapshot(constraints: unknown, inspiration: unknown = null): GenerationSnapshot {
  return Object.freeze({ constraints: parseSnapshot(constraints), inspiration: inspiration == null ? null : parseStyle(inspiration) });
}
