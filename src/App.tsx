import { useState, useEffect, useRef, useMemo } from 'react';
import { selectors, type SelectorId, type Property } from '../shared/style.ts';
import { useGeneration } from './generation/useGeneration.ts';
import { useCountdown } from './generation/useCountdown.ts';
import { presets } from './styles/presets.ts';
import { StyleCard } from './components/StyleCard.tsx';
import { toggleConstraint, type Snapshot } from '../shared/constraints.ts';
import { makeInspectionGroups, representative, normalizeComputed, type InspectionGroup } from './preview/inspection.ts';
import { Preview } from './preview/Preview.tsx';

function Inspector({ values, constraints, groups, onToggle, active, remaining, unusedConstraints, onGenerate, inspirationId, onClearInspiration }: { values: Record<string, string>; constraints: Snapshot; groups: readonly InspectionGroup[];
  remaining: number | null;
  unusedConstraints: boolean;
  inspirationId: string | null; onClearInspiration: () => void;
  active: boolean; onGenerate: () => void; onToggle: (selector: SelectorId, property: Property, state: 'locked' | 'unset') => void }) {
  return (
    <aside className="inspector-panel workspace-panel" aria-labelledby="inspector-label">
      <header className="panel-heading inspector-heading">
        <div><span className="panel-kicker">THE DETAILS</span><h2 id="inspector-label">CSS inspector</h2></div>
        <span className="inspector-code-icon" aria-hidden="true">{'{ }'}</span>
      </header>
      <div className="inspector-description">
        <span className="inspector-mode-dot" /> Effective CSS <span className="read-only-badge">Live constraints</span>
      </div>
      <div className="inspector-scroll scroll-region" tabIndex={0} role="region" aria-label="Scrollable CSS declarations">
        {groups.map(rule => (
          <div className="css-rule" key={rule.selectorId}>
            <div className="css-selector">{selectors[rule.selectorId]} <span>{'{'}</span></div>
            <dl>{rule.properties.map(property => (
              <div className="css-declaration" key={property} data-declaration={`${rule.selectorId}:${property}`}>
                <dt>{property}<span>:</span></dt><dd>{lockedValue(constraints, rule.selectorId, property) ?? values[`${rule.selectorId}:${property}`] ?? '…'}<span>;</span></dd>
                <span className="declaration-controls">{(['locked', 'unset'] as const).map(state => <button key={state}
                  aria-label={`${state === 'locked' ? 'Lock' : 'Unset'} ${rule.selectorId} ${property}`}
                  aria-pressed={constraints.some(c => c.selectorId === rule.selectorId && c.property === property && c.state === state)}
                  onClick={() => onToggle(rule.selectorId, property, state)}>{state === 'locked' ? 'L' : 'U'}</button>)}</span>
              </div>
            ))}</dl>
            <span className="css-brace">{'}'}</span>
          </div>
        ))}
      </div>
      <footer className="generation-footer">
        <div className="generation-footer-caption" role="status" aria-label="Generation inspiration"><span className="status-dot" />
          {inspirationId ? `Inspiration: ${inspirationId}` : 'No inspiration selected.'}
          {inspirationId && <button className="clear-inspiration" onClick={onClearInspiration}>Clear inspiration</button>}
        </div>
        <button className="generate-button" disabled={active} onClick={onGenerate} aria-describedby="generation-availability">
          <span aria-hidden="true">✳</span> {active ? 'Generating…' : remaining !== null && remaining <= 3 ? `Sending in ${remaining}…` : 'Generate'} <span aria-hidden="true">↗</span>
        </button>
        <p id="generation-availability" role="status" aria-label="Generation constraints">{active && unusedConstraints
          ? 'Edits apply to the preview. This batch uses earlier constraints.'
          : remaining !== null && !active ? 'Sending eight seconds after the last constraint change.'
          : unusedConstraints ? 'Current constraints have not been used. Generate when ready.'
          : 'Six new directions. Select as they arrive.'}</p>
      </footer>
    </aside>
  );
}

function lockedValue(constraints: Snapshot, selector: SelectorId, property: Property) {
  const c = constraints.find(c => c.selectorId === selector && c.property === property);
  return c?.state === 'locked' ? c.value : undefined;
}

export function App() {
  const generation = useGeneration();
  const editMayArm = useRef(false);
  // Retain discovered declaration rows for the session, so locks remain reachable
  // even after selecting a preset that omits that generated declaration.
  const groups = useMemo(() => makeInspectionGroups(generation.slots.flatMap(slot => slot.style ? [slot.style] : [])), [generation.slots]);
  const generatedRail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!generation.scrollTarget || !generatedRail.current) return;
    const rail = generatedRail.current;
    const slot = rail.querySelector<HTMLElement>(`[data-slot="${generation.scrollTarget}"]`);
    if (slot) rail.scrollTo({ top: slot.getBoundingClientRect().top - rail.getBoundingClientRect().top + rail.scrollTop - 19,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [generation.scrollTarget]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [constraints, setConstraints] = useState<Snapshot>([]);
  const [notice, setNotice] = useState('');
  function onToggle(selector: SelectorId, property: Property, state: 'locked' | 'unset') {
    const element = root && representative(root, selector);
    if (!element) return;
    const value = normalizeComputed(property, getComputedStyle(element).getPropertyValue(property).trim(), element);
    const old = constraints.find(c => c.selectorId === selector && c.property === property);
    if (state === 'locked' && old?.state !== 'locked' && value === undefined) {
      setNotice('This effective value is outside the supported style vocabulary.'); return;
    }
    setNotice('');
    editMayArm.current = !generation.isActive();
    setConstraints(toggleConstraint(constraints, selector, property, state, value));
  }
  const [selectedId, setSelectedId] = useState('S1');
  const [inspirationId, setInspirationId] = useState<string | null>(null);
  const styles = [...presets, ...generation.slots.flatMap(slot => slot.style ? [slot.style] : [])];
  const selected = styles.find(style => style.id === selectedId)!;
  const inspiration = styles.find(style => style.id === inspirationId) ?? null;
  // Constraints are canonical; compare values rather than edit counts so reverting
  // to the captured inputs clears the notice. Inspiration styles are immutable.
  const unusedConstraints = generation.lastBatchContext !== null && (
    JSON.stringify(constraints) !== JSON.stringify(generation.lastBatchContext.constraints)
    || (inspiration?.id ?? null) !== (generation.lastBatchContext.inspiration?.id ?? null));
  const toggleInspiration = (id: string | null) => {
    editMayArm.current = !generation.isActive();
    setInspirationId(current => current === id ? null : id);
  };
  const countdown = useCountdown(() => generation.generate(constraints, inspiration), () => !generation.isActive());
  const previousInputs = useRef({ constraints, inspiration });
  useEffect(() => {
    if (previousInputs.current.constraints === constraints && previousInputs.current.inspiration === inspiration) return;
    previousInputs.current = { constraints, inspiration };
    // Keep an active-request edit ineligible even if completion happens before
    // React commits it; restart also checks the synchronous generation guard.
    if (editMayArm.current) countdown.restart();
    else countdown.cancel();
  }, [constraints, inspiration, countdown.restart, countdown.cancel]);
  function generate() { countdown.cancel(); generation.generate(constraints, inspiration); }
  function retry(slot: Parameters<typeof generation.retry>[0]) { countdown.cancel(); generation.retry(slot); }

  return (
    <div className="styler-app">
      <header className="app-header">
        <div className="app-wordmark">
          <span className="app-logo" aria-hidden="true">s<span>.</span></span><h1>styler<span>.</span></h1>
          <span className="app-header-divider" /><span className="app-tagline">A space for visual possibility.</span>
        </div>
        <span className="app-session"><span /> Local session</span>
      </header>
      <main className="workspace" aria-label="Style exploration workspace">
        <section className="preview-panel workspace-panel" aria-labelledby="preview-label">
          <header className="panel-heading preview-heading">
            <div><span className="panel-kicker">THE CANVAS</span><h2 id="preview-label">Website preview</h2></div>
            <div className="preview-style-chip" role="status" aria-label="Selected style">
              <span /> {selected.id} <span className="preview-style-chip-divider">/</span> {selected.name}
            </div>
          </header>
          <div className="preview-scroll scroll-region" tabIndex={0} role="region" aria-label="Scrollable website preview">
            <Preview groups={groups} constraints={constraints} style={selected} onInspect={setValues} onRoot={setRoot} />
          </div>
          <footer className="preview-status">
            <span><span className="status-dot" /> Same content. A different feeling.</span>
            <span>DESKTOP CANVAS <span aria-hidden="true">↗</span></span>
          </footer>
        </section>

        <section className="style-panel workspace-panel" aria-labelledby="presets-label">
          <header className="panel-heading rail-heading"><span className="panel-kicker">01</span><h2 id="presets-label">Presets</h2></header>
          <div className="rail-scroll scroll-region" tabIndex={0} role="region" aria-label="Scrollable predefined styles">
            {presets.map(style => <StyleCard key={style.id} style={style} active={style.id === selectedId} inspired={style.id === inspirationId} onSelect={() => setSelectedId(style.id)} onInspire={() => toggleInspiration(style.id)} />)}
            <div className="rail-bottom-note"><span aria-hidden="true">✳</span><p>A starting<br />point.</p></div>
          </div>
          <footer className="rail-footer">7 STYLES</footer>
        </section>

        <section className="style-panel workspace-panel generated-panel" aria-labelledby="generated-label">
          <header className="panel-heading rail-heading"><span className="panel-kicker">02</span><h2 id="generated-label">Generated</h2></header>
          <div ref={generatedRail} className="rail-scroll scroll-region" tabIndex={0} role="region" aria-label="Scrollable generated styles">
             {generation.slots.map(slot => <div data-slot={slot.id} key={slot.id}>
              {slot.style ? <StyleCard style={slot.style} active={selectedId === slot.id} inspired={slot.id === inspirationId} expression={slot.expression} onSelect={() => setSelectedId(slot.id)} onInspire={() => toggleInspiration(slot.id)} />
                : <div className="generation-slot" role="status"><strong>{slot.id} · {slot.seed !== undefined ? 'Joker' : slot.expression ?? 'AI'}</strong>
                  <p>{slot.status === 'pending' ? 'Generating…' : slot.error}</p>
                  {slot.status === 'error' && <button disabled={generation.active} onClick={() => retry(slot)} aria-label={`Retry ${slot.id}`}>Retry</button>}
                </div>}
            </div>)}
            <div className="rail-bottom-note generated-note"><span aria-hidden="true">↟</span><p>New ideas<br />start here.</p></div>
          </div>
          <footer className="rail-footer">{generation.slots.length} STYLES</footer>
        </section>
        <Inspector groups={groups} values={values} constraints={constraints} onToggle={onToggle} active={generation.active} remaining={countdown.remaining} unusedConstraints={unusedConstraints} onGenerate={generate} inspirationId={inspirationId} onClearInspiration={() => toggleInspiration(null)} />
        {notice && <div className="app-notice" role="status">{notice}</div>}
      </main>
    </div>
  );
}
