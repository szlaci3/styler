import { useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Style } from '../../shared/style.ts';
import { SampleWebsite } from './SampleWebsite.tsx';
import { compileLocks, type Snapshot } from '../../shared/constraints.ts';
import { readEffective, type InspectionGroup } from './inspection.ts';
import sampleCss from './sample.css?inline';
import boundaryCss from './boundary.css?inline';

export function Preview({ style, constraints, groups, onInspect, onRoot }: { style: Style; constraints: Snapshot; groups: readonly InspectionGroup[]; onInspect: (values: Record<string, string>) => void; onRoot: (root: ShadowRoot) => void }) {
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const attach = useCallback((host: HTMLDivElement | null) => {
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
  }, []);

  useEffect(() => {
    if (!root) return;
    onRoot(root);
    const update = () => onInspect(readEffective(root, groups));
    update();
    const timer = setTimeout(update, 380);
    root.addEventListener('transitionend', update);
    root.addEventListener('change', update);
    return () => { clearTimeout(timer); root.removeEventListener('transitionend', update); root.removeEventListener('change', update); };
  }, [root, style, constraints, groups, onInspect, onRoot]);

  // Reuse the same root/portal across selection updates and StrictMode ref replays.
  // Never key the portal or sample component by the selected style ID.
  return <>
    <div className="preview-host" ref={attach} />
    {root && createPortal(<>
      <style>{`@layer baseline, selected, locks; @layer baseline { ${boundaryCss}\n${sampleCss} }`}</style>
      <style data-preview-locks>{`@layer locks { ${compileLocks(constraints)} }`}</style>
      <SampleWebsite style={style} />
    </>, root)}
  </>;
}
