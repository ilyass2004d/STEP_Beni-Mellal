import { useEffect, useMemo, useState } from 'react';
import type { StepComponent } from '../content/types';
import { loadManifest, type Manifest } from '../three/manifest';

interface Props {
  steps: StepComponent[];
  activeId: string | null;
  onSelect(id: string): void;
}

/**
 * Schematic plan: each structure is placed at the centre of its footprint in
 * the 3D model (top view, metres). The dotted line follows the order of the
 * treatment chain — it is not the route of the pipes.
 */
export function SitePlan({ steps, activeId, onSelect }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadManifest().then(setManifest, () => setError(true));
  }, []);

  const points = useMemo(() => {
    if (!manifest) return [];
    return steps.flatMap((s) => {
      const boxes = manifest.parties.filter((p) => s.modelParts.includes(p.id)).map((p) => p.bbox);
      if (!boxes.length) return [];
      const minX = Math.min(...boxes.map((b) => b.min[0]));
      const maxX = Math.max(...boxes.map((b) => b.max[0]));
      const minZ = Math.min(...boxes.map((b) => b.min[2]));
      const maxZ = Math.max(...boxes.map((b) => b.max[2]));
      return [{ id: s.id, name: s.name, x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, w: maxX - minX, h: maxZ - minZ }];
    });
  }, [manifest, steps]);

  if (error) return <p className="site-plan__error">Plan indisponible : manifest.json introuvable.</p>;
  if (!manifest) return <div className="site-plan site-plan--loading" aria-hidden="true" />;

  const { min, max } = manifest.site;
  const pad = 30;
  const vb = `${min[0] - pad} ${min[2] - pad} ${max[0] - min[0] + pad * 2} ${max[2] - min[2] + pad * 2}`;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.z.toFixed(1)}`).join(' ');

  return (
    <figure className="site-plan">
      <svg viewBox={vb} role="group" aria-label="Plan schématique des ouvrages">
        <rect x={min[0]} y={min[2]} width={max[0] - min[0]} height={max[2] - min[2]} className="site-plan__site" />
        {points.map((p) => (
          <rect key={`r-${p.id}`} x={p.x - p.w / 2} y={p.z - p.h / 2} width={p.w} height={p.h} rx="4"
            className={`site-plan__fp ${p.id === activeId ? 'is-active' : ''}`} />
        ))}
        <path d={path} className="site-plan__path" />
        {points.map((p, i) => (
          <g key={p.id} className={`site-plan__pt ${p.id === activeId ? 'is-active' : ''}`} transform={`translate(${p.x} ${p.z})`}>
            <circle r={p.id === activeId ? 24 : 17} />
            <text dy="7">{i + 1}</text>
            <title>{p.name}</title>
            <rect x="-28" y="-28" width="56" height="56" fill="transparent" onClick={() => onSelect(p.id)} />
          </g>
        ))}
      </svg>
      <figcaption>Plan schématique. Positions issues de la maquette 3D ; le tracé suit l'ordre de la filière, pas celui des canalisations.</figcaption>
    </figure>
  );
}
