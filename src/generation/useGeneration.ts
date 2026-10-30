import { useRef, useState } from 'react';
import { parseStyle, type Style } from '../../shared/style.ts';
import type { Snapshot } from '../../shared/constraints.ts';
import { AI_RESULTS_PER_BATCH, AI_CONCURRENCY, captureGenerationSnapshot, type GenerationSnapshot } from '../../shared/generation.ts';
import { seedStyle } from '../styles/presets.ts';
import { makeJoker } from './joker.ts';

export type Slot = { id: string; context: GenerationSnapshot; seed?: number; stage?: 'quick' | 'additional'; status: 'pending' | 'ready' | 'error'; style?: Style; error?: string };
export function useGeneration() {
  const [slots, setSlots] = useState<Slot[]>([{ id: 'G1', context: captureGenerationSnapshot([]), status: 'ready', style: seedStyle }]);
  const [active, setActive] = useState(false);
  const [lastBatchContext, setLastBatchContext] = useState<GenerationSnapshot | null>(null);
  const guard = useRef(false);
  const next = useRef(2);
  const [scrollTarget, setScrollTarget] = useState<string>();
  const update = (id: string, patch: Partial<Slot>) => setSlots(old => old.map(slot => slot.id === id ? { ...slot, ...patch } : slot));
  async function remote(slot: Slot) {
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slot.id, snapshot: slot.context.constraints, ...(slot.context.inspiration ? { inspiration: slot.context.inspiration } : {}) }), signal: AbortSignal.timeout(100_000) });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Generation failed. Retry manually.');
      const style = parseStyle(data.style);
      if (style.id !== slot.id || style.provenance !== 'antigravity') throw new Error('Invalid generated style.');
      for (const c of slot.context.constraints) {
        const value = style.rules.find(r => r.selectorId === c.selectorId)?.declarations.find(d => d.property === c.property)?.value;
        if (c.state === 'locked' ? value !== c.value : value !== undefined) throw new Error('Generated style violated captured constraints.');
      }
      update(slot.id, { status: 'ready', style });
    } catch (error) {
      // Never echo arbitrary response content or transport error messages.
      const known = ['Authentication failed.', 'Quota exceeded.', 'Provider unavailable.', 'Generation timed out.', 'Generation incomplete.', 'Invalid generated style.', 'Generation already active.', 'Generation capacity reached.', 'Missing server API key.', 'Invalid generation request.', 'Generated style violated captured constraints.'];
      const message = error instanceof Error && known.includes(error.message) ? error.message : 'Generation failed. Retry manually.';
      update(slot.id, { status: 'error', error: message });
    }
  }
  function release() { guard.current = false; setActive(false); }
  async function runAI(slots: readonly Slot[]) {
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(AI_CONCURRENCY, slots.length) }, async () => {
      while (cursor < slots.length) await remote(slots[cursor++]!);
    }));
  }
  function generate(constraints: Snapshot, inspiration: Style | null = null) {
    if (guard.current) return;
    const context = captureGenerationSnapshot(constraints, inspiration);
    setLastBatchContext(context);
    guard.current = true; setActive(true);
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
    const joker: Slot = { id: `G${next.current++}`, context, seed, status: 'pending' };
    const ai: Slot[] = Array.from({ length: AI_RESULTS_PER_BATCH }, (_, index) => ({ id: `G${next.current++}`, context, stage: index === 0 ? 'quick' : 'additional', status: 'pending' }));
    setSlots(old => [...old, joker, ...ai]);
    setScrollTarget(joker.id);
    // Yield once so all six reserved positions can paint, independently of AI.
    const local = new Promise<void>(resolve => setTimeout(() => {
      try { update(joker.id, { status: 'ready', style: makeJoker(seed, context.constraints, joker.id, context.inspiration) }); }
      catch { update(joker.id, { status: 'error', error: 'Local Joker failed.' }); }
      finally { resolve(); }
    }, 0));
    // Quick and additional work start together; completion of either frees a lane.
    // Each remote call contains its own failure, so a failed card cannot stall siblings.
    void Promise.all([local, runAI(ai)]).finally(release);
  }
  function retry(slot: Slot) {
    if (guard.current || slot.status !== 'error' || slot.seed !== undefined) return;
    guard.current = true; setActive(true);
    update(slot.id, { status: 'pending', error: undefined });
    void remote(slot).finally(release);
  }
  // Retrying an older failed slot must not replace the latest full batch's context.
  return { slots, active, lastBatchContext, generate, retry, scrollTarget, isActive: () => guard.current };
}
