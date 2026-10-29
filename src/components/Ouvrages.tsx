import { useEffect, useRef, useState } from 'react';
import { sortedVisibleComponents } from '../content/store';
import type { Chapter, SiteContent, StepComponent } from '../content/types';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { componentMedia, InfoPanel } from './InfoPanel';
import { Icon } from './Icon';
import { KindBadge, Picture } from './media/Picture';
import { SitePlan } from './SitePlan';

const stepAnchor = (c: StepComponent) => `ouvrage-${c.id}`;

interface Props {
  chapter: Chapter;
  content: SiteContent;
  /** Absent when the explorer section is hidden. */
  onExplore?(id: string): void;
}

/** Chapter 04: the structures one by one, in process order, with a sticky plan + image. */
export function Ouvrages({ chapter, content, onExplore }: Props) {
  const all = sortedVisibleComponents(content);
  const steps = all.filter((c) => c.inNarrative);
  const others = all.filter((c) => !c.inNarrative);
  const { active } = useScrollSpy(steps.map(stepAnchor), 0.5);
  const current = steps.find((s) => stepAnchor(s) === active) ?? steps[0];
  const [sheet, setSheet] = useState<StepComponent | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (sheet && !d.open) d.showModal();
    if (!sheet && d.open) d.close();
  }, [sheet]);

  const stageLabel = (id?: string) => content.stages.find((s) => s.id === id)?.label;
  const goTo = (id: string) => document.getElementById(`ouvrage-${id}`)?.scrollIntoView({ block: 'center' });
  const visual = (c: StepComponent) => c.render ?? c.photos[0];

  return (
    <section id="ouvrages" className="ouvrages" data-tone="light" aria-labelledby="ouvrages-title">
      <header className="section-head">
        <p className="eyebrow">
          <span className="chapter__num">{chapter.number}</span> {chapter.eyebrow}
        </p>
        <h2 id="ouvrages-title" className="section-title">
          {chapter.title}
        </h2>
        <p className="section-lead">{chapter.text}</p>
      </header>

      <div className="ouvrages__grid">
        <div className="ouvrages__aside">
          <div className="ouvrages__sticky">
            <SitePlan steps={steps} activeId={current?.id ?? null} onSelect={goTo} />
            <div className="ouvrages__visual">
              {steps.map((s) => {
                const v = visual(s);
                return (
                  v && (
                    <figure key={s.id} className={s.id === current?.id ? 'is-active' : ''} aria-hidden={s.id !== current?.id}>
                      <Picture media={v} sizes="(min-width: 1000px) 40vw, 100vw" />
                      <figcaption>
                        <KindBadge kind={v.kind} />
                      </figcaption>
                    </figure>
                  )
                );
              })}
            </div>
          </div>
        </div>

        <ol className="ouvrages__steps">
          {steps.map((s, i) => {
            const v = s.photos[0] ?? visual(s);
            return (
              <li key={s.id} id={stepAnchor(s)} className={`step ${s.id === current?.id ? 'is-active' : ''}`}>
                <p className="label">
                  <span className="step__idx">{String(i + 1).padStart(2, '0')}</span>
                  {stageLabel(s.stage)}
                </p>
                <h3 className="step__title">{s.name}</h3>
                <p className="step__lead">{s.shortDescription}</p>
                {s.role && <p className="step__role">{s.role}</p>}
                {v && (
                  <figure className="step__media">
                    <Picture media={v} sizes="100vw" />
                    <figcaption>
                      <KindBadge kind={v.kind} /> {v.caption}
                    </figcaption>
                  </figure>
                )}
                <div className="step__actions">
                  {onExplore && (
                    <a className="btn btn--dark" href="#explorer" onClick={() => onExplore(s.id)}>
                      Voir dans la maquette <Icon name="cube" />
                    </a>
                  )}
                  <button type="button" className="btn btn--outline" onClick={() => setSheet(s)}>
                    Fiche complète
                    {componentMedia(s).length > 0 && <small> · {componentMedia(s).length} images</small>}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {others.length > 0 && (
        <div className="ouvrages__others">
          <h3 className="label">Autres ouvrages de la maquette</h3>
          <ul>
            {others.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.shortDescription}</span>
                </div>
                <button type="button" className="link-btn" onClick={() => setSheet(c)}>
                  Fiche
                </button>
                {onExplore && (
                  <a className="link-btn" href="#explorer" onClick={() => onExplore(c.id)}>
                    En 3D
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <dialog ref={dialog} className="sheet" onClose={() => setSheet(null)} onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
        {sheet && <InfoPanel component={sheet} content={content} onClose={() => setSheet(null)} />}
      </dialog>
    </section>
  );
}
