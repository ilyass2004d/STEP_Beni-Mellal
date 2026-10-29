import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sortedVisibleComponents } from '../../content/store';
import type { SiteContent, StepComponent } from '../../content/types';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { CONTEXT_LAYERS, loadManifest, type Manifest } from '../../three/manifest';
import { StepViewer, webglAvailable } from '../../three/StepViewer';
import { InfoPanel } from '../InfoPanel';
import { Picture } from '../media/Picture';
import { Icon } from '../Icon';

export interface SelectionRequest {
  id: string;
  nonce: number;
}

interface Props {
  content: SiteContent;
  request: SelectionRequest | null;
}

type Status = 'loading' | 'ready' | 'error' | 'no-webgl';

const isSmallScreen = () => window.matchMedia('(max-width: 760px)').matches;
const isTouch = () => window.matchMedia('(hover: none)').matches;

export default function Explorer({ content, request }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<StepViewer | null>(null);
  const reduced = useReducedMotion();

  const [status, setStatus] = useState<Status>(() => (webglAvailable() ? 'loading' : 'no-webgl'));
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [failedParts, setFailedParts] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const [listOpen, setListOpen] = useState(() => !isSmallScreen());
  const [isolated, setIsolated] = useState(false);
  const [layers, setLayers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONTEXT_LAYERS.map((l) => [l.id, !(l.heavy && isSmallScreen())])),
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [attempt, setAttempt] = useState(0);

  const components = useMemo(() => sortedVisibleComponents(content), [content]);
  const partToComponent = useMemo(() => {
    const map = new Map<string, StepComponent>();
    for (const c of components) for (const p of c.modelParts) map.set(p, c);
    return map;
  }, [components]);
  const selected = components.find((c) => c.id === selectedId) ?? null;
  const stages = content.stages.filter((s) => components.some((c) => c.stage === s.id));

  // Stable callbacks for the engine
  const partToComponentRef = useRef(partToComponent);
  partToComponentRef.current = partToComponent;
  const layersRef = useRef(layers);
  layersRef.current = layers;

  // ------------------------------------------------------------ engine setup
  useEffect(() => {
    if (status === 'no-webgl' || !canvasRef.current) return;
    let cancelled = false;
    let viewer: StepViewer;
    try {
      viewer = new StepViewer(
        canvasRef.current,
        {
          onProgress: (loaded, total) => !cancelled && setProgress({ loaded, total }),
          onPartError: (id) => !cancelled && setFailedParts((f) => [...f, id]),
          onPick: (partId) => {
            const c = partId ? partToComponentRef.current.get(partId) : undefined;
            setSelectedId(c ? c.id : null);
            if (c) viewerRef.current?.focus(c.modelParts);
          },
          onHover: (partId, x, y) => {
            const c = partId ? partToComponentRef.current.get(partId) : undefined;
            setHover(c ? { name: c.name, x, y } : null);
          },
        },
        reduced,
      );
    } catch {
      setStatus('no-webgl');
      return;
    }
    viewerRef.current = viewer;
    viewer.setActive(true);
    if (import.meta.env.DEV) (window as unknown as { __stepViewer?: StepViewer }).__stepViewer = viewer;

    loadManifest()
      .then(async (m) => {
        if (cancelled) return;
        setManifest(m);
        const known = new Set(m.parties.map((p) => p.id));
        const structural = m.parties.map((p) => p.id).filter((id) => !CONTEXT_LAYERS.some((l) => l.id === id));
        const contextNow = CONTEXT_LAYERS.filter((l) => !l.heavy && known.has(l.id)).map((l) => l.id);
        // structures and light context first, heavy vegetation afterwards (only if enabled)
        await viewer.load(m, [...contextNow, ...structural]);
        if (cancelled) return;
        setStatus('ready');
        const heavy = CONTEXT_LAYERS.filter((l) => l.heavy && known.has(l.id)).map((l) => l.id);
        for (const id of heavy) viewer.setLayerVisible(id, layersRef.current[id]);
        const wanted = heavy.filter((id) => layersRef.current[id]);
        if (wanted.length) await viewer.load(m, wanted);
      })
      .catch(() => !cancelled && setStatus('error'));

    return () => {
      cancelled = true;
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, reduced]);

  useEffect(() => {
    viewerRef.current?.setPickable([...partToComponent.keys()]);
  }, [partToComponent, status]);

  // Pause rendering when offscreen or when the tab is hidden
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let visible = true;
    const sync = () => viewerRef.current?.setActive(visible && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [status]);

  // ------------------------------------------------------------ selection
  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    v.highlight(selected?.modelParts ?? []);
    if (!selected && isolated) {
      setIsolated(false);
      v.isolate(null);
    }
  }, [selected, isolated, status]);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      const c = components.find((x) => x.id === id);
      if (c && isolated) viewerRef.current?.isolate(c.modelParts, ['Enceinte', 'Espaces_verts']);
      if (c) viewerRef.current?.focus(c.modelParts);
      if (c && isSmallScreen()) setListOpen(false);
    },
    [components, isolated],
  );

  // Requests coming from the rest of the page (e.g. « Voir en 3D » in chapter 04)
  useEffect(() => {
    if (request && status === 'ready') select(request.id);
    else if (request && status !== 'loading') setSelectedId(request.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, status]);

  const toggleIsolate = () => {
    const v = viewerRef.current;
    if (!v || !selected) return;
    const next = !isolated;
    setIsolated(next);
    v.isolate(next ? selected.modelParts : null, ['Enceinte', 'Espaces_verts']);
    v.focus(selected.modelParts);
  };

  const toggleLayer = (id: string) => {
    const next = !layers[id];
    setLayers((l) => ({ ...l, [id]: next }));
    const v = viewerRef.current;
    if (!v) return;
    v.setLayerVisible(id, next);
    if (next && manifest && !v.hasPart(id)) void v.load(manifest, [id]);
  };

  const resetAll = () => {
    setSelectedId(null);
    setIsolated(false);
    viewerRef.current?.isolate(null);
    viewerRef.current?.resetView();
  };

  // ------------------------------------------------------------ fullscreen
  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenEnabled) {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void el.requestFullscreen().catch(() => setFullscreen((f) => !f));
    } else {
      setFullscreen((f) => !f); // CSS fallback (iOS Safari)
    }
  };
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  useEffect(() => {
    if (!fullscreen || document.fullscreenElement) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const noWebgl = status === 'no-webgl';
  const touch = typeof window !== 'undefined' && isTouch();
  const pct = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;

  return (
    <div
      ref={wrapRef}
      className={`explorer ${fullscreen ? 'is-fullscreen' : ''} ${listOpen ? 'has-list' : ''} ${selected ? 'has-panel' : ''}`}
    >
      <div ref={canvasRef} className="explorer__canvas">
        {noWebgl && (
          <div className="explorer__fallback">
            <Picture
              media={{ src: '/media/renders/vue-aerienne', alt: 'Vue aérienne de la maquette 3D de la station.', kind: 'rendu' }}
              sizes="100vw"
            />
            <p>
              La vue 3D interactive nécessite WebGL, indisponible sur ce navigateur. Les fiches des ouvrages restent consultables dans la liste.
            </p>
          </div>
        )}
      </div>

      {hover && !touch && (
        <div className="explorer__tooltip" style={{ transform: `translate(${hover.x + 14}px, ${hover.y + 14}px)` }} aria-hidden="true">
          {hover.name}
        </div>
      )}

      <div className="explorer__hint" aria-live="polite">
        {status === 'loading' && (
          <span className="explorer__loading">
            <span className="explorer__bar" style={{ transform: `scaleX(${pct / 100})` }} />
            Chargement de la maquette : {progress.loaded}/{progress.total || '…'} pièces
          </span>
        )}
        {status === 'ready' &&
          (touch
            ? 'Un doigt pour tourner · pincer pour zoomer · deux doigts pour déplacer · toucher un ouvrage pour sa fiche'
            : 'Glisser pour tourner · molette pour zoomer · clic droit pour déplacer · cliquer un ouvrage pour sa fiche')}
        {status === 'ready' && failedParts.length > 0 && (
          <span className="explorer__warn"> · {failedParts.length} pièce(s) non chargée(s) : {failedParts.join(', ')}</span>
        )}
      </div>

      {status === 'error' && (
        <div className="explorer__error" role="alert">
          <p>La maquette n'a pas pu être chargée (fichier manquant ou connexion interrompue).</p>
          <button type="button" className="btn btn--light" onClick={() => { setStatus('loading'); setFailedParts([]); setAttempt((a) => a + 1); }}>
            Réessayer
          </button>
        </div>
      )}

      <nav className={`explorer__list ${listOpen ? 'is-open' : ''}`} aria-label="Ouvrages de la station" id="explorer-list">
        <div className="explorer__list-scroll">
          {stages.map((s) => (
            <div key={s.id} className="explorer__group">
              <p className="label">{s.label}</p>
              <ul>
                {components
                  .filter((c) => c.stage === s.id)
                  .map((c) => (
                    <li key={c.id}>
                      <button type="button" aria-pressed={selectedId === c.id} onClick={() => select(selectedId === c.id ? null : c.id)}>
                        {c.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {!noWebgl && (
            <div className="explorer__group">
              <p className="label">Couches du site</p>
              <ul className="explorer__layers">
                {CONTEXT_LAYERS.filter((l) => !manifest || manifest.parties.some((p) => p.id === l.id)).map((l) => (
                  <li key={l.id}>
                    <label>
                      <input type="checkbox" checked={layers[l.id]} onChange={() => toggleLayer(l.id)} />
                      {l.label}
                      {l.heavy && <small> (lourd)</small>}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {selected && (
        <div className="explorer__panel">
          <InfoPanel
            component={selected}
            content={content}
            headingLevel={3}
            onClose={() => select(null)}
            actions={
              !noWebgl && (
                <>
                  <button type="button" className="btn btn--ghost" onClick={() => viewerRef.current?.focus(selected.modelParts)}>
                    Centrer la vue
                  </button>
                  <button type="button" className="btn btn--ghost" aria-pressed={isolated} onClick={toggleIsolate}>
                    {isolated ? 'Afficher tout le site' : 'Isoler cet ouvrage'}
                  </button>
                </>
              )
            }
          />
        </div>
      )}

      <div className="explorer__toolbar" role="toolbar" aria-label="Commandes de la vue 3D">
        <button type="button" className="tool" aria-expanded={listOpen} aria-controls="explorer-list" onClick={() => setListOpen((o) => !o)}>
          <Icon name="list" />
          <span>Ouvrages</span>
        </button>
        {!noWebgl && (
          <>
            <button type="button" className="tool" onClick={resetAll} disabled={status !== 'ready'}>
              <Icon name="home" />
              <span>Vue d'ensemble</span>
            </button>
            <button type="button" className="tool" onClick={() => viewerRef.current?.focus(selected ? selected.modelParts : undefined)} disabled={status !== 'ready'}>
              <Icon name="fit" />
              <span>Cadrer</span>
            </button>
            <button type="button" className="tool" aria-pressed={isolated} onClick={toggleIsolate} disabled={!selected || status !== 'ready'}>
              <Icon name="isolate" />
              <span>Isoler</span>
            </button>
          </>
        )}
        <button type="button" className="tool" aria-pressed={fullscreen} onClick={toggleFullscreen}>
          <Icon name={fullscreen ? 'collapse' : 'expand'} />
          <span>{fullscreen ? 'Quitter' : 'Plein écran'}</span>
        </button>
      </div>
    </div>
  );
}
