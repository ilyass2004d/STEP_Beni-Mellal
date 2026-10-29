import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { SiteContent } from '../../content/types';
import { useInView } from '../../hooks/useInView';
import { Picture } from '../media/Picture';
import type { SelectionRequest } from './Explorer';

const Explorer = lazy(() => import('./Explorer'));

/** Desktop loads the model when the section approaches; small screens / data saver wait for a tap. */
function shouldAskFirst() {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData) || window.matchMedia('(max-width: 760px)').matches;
}

export function ExplorerSection({ content, request }: { content: SiteContent; request: SelectionRequest | null }) {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, '900px 0px', true);
  const [askFirst] = useState(shouldAskFirst);
  const [accepted, setAccepted] = useState(false);
  const start = near && (!askFirst || accepted);

  // A « Voir en 3D » request counts as consent to load the model
  useEffect(() => {
    if (request) setAccepted(true);
  }, [request]);

  const facts = content.facts;

  return (
    <section id="explorer" ref={ref} className="explorer-section" data-tone="dark" aria-labelledby="explorer-title">
      <header className="section-head section-head--dark">
        <p className="eyebrow">Explorer la station</p>
        <h2 id="explorer-title" className="section-title">
          La maquette, <em>à votre rythme.</em>
        </h2>
        <p className="section-lead">
          Tournez autour du site, rapprochez-vous des ouvrages et sélectionnez-les pour lire leur fiche. Chaque ouvrage est une pièce distincte de la maquette.
        </p>
        <dl className="facts">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="explorer-frame">
        {start ? (
          <Suspense fallback={<div className="explorer explorer--placeholder" aria-busy="true"><p className="explorer__hint">Préparation de la vue 3D…</p></div>}>
            <Explorer content={content} request={request} />
          </Suspense>
        ) : (
          <div className="explorer explorer--placeholder">
            <Picture
              media={{ src: '/media/renders/vue-aerienne', alt: 'Vue aérienne de la maquette 3D de la station.', kind: 'rendu' }}
              className="explorer__poster"
            />
            <div className="explorer__gate">
              <p>La maquette 3D pèse environ 14 Mo (hors végétation).</p>
              <button type="button" className="btn btn--primary" onClick={() => setAccepted(true)}>
                Charger la maquette 3D
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
