import type { ReactNode } from 'react';
import type { MediaRef, SiteContent, StepComponent } from '../content/types';
import { Gallery } from './media/Gallery';

export const VERIFICATION_LABEL: Record<StepComponent['verification'], string> = {
  documente: 'Documenté',
  partiel: 'Partiellement documenté',
  'a-documenter': 'À documenter',
};

export function componentMedia(c: StepComponent): MediaRef[] {
  return [...c.photos, c.render, c.diagram].filter((m): m is MediaRef => Boolean(m?.src));
}

interface Props {
  component: StepComponent;
  content: SiteContent;
  headingLevel?: 2 | 3;
  onClose?(): void;
  actions?: ReactNode;
}

/** Editorial fact sheet for one structure. Only fields that hold information are rendered. */
export function InfoPanel({ component: c, content, headingLevel = 2, onClose, actions }: Props) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const S = `h${headingLevel + 1}` as 'h3' | 'h4';
  const stage = content.stages.find((s) => s.id === c.stage);
  const sources = c.sources.map((id) => content.sources.find((s) => s.id === id)).filter(Boolean);
  const media = componentMedia(c);
  const sourceLabel = (id?: string) => content.sources.find((s) => s.id === id)?.label;

  return (
    <article className="info-panel" aria-labelledby={`info-${c.id}`}>
      <header className="info-panel__head">
        <p className="label">
          {stage?.label ?? 'Ouvrage'}
          <span className={`verif verif--${c.verification}`}>{VERIFICATION_LABEL[c.verification]}</span>
        </p>
        <H id={`info-${c.id}`} className="info-panel__title">
          {c.name}
        </H>
        {c.technicalName && <p className="info-panel__tech">{c.technicalName}</p>}
        {onClose && (
          <button type="button" className="icon-btn info-panel__close" onClick={onClose} aria-label="Fermer la fiche">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </header>

      <p className="info-panel__lead">{c.shortDescription}</p>

      {(c.role || c.details) && (
        <section>
          <S className="label">Rôle dans le procédé</S>
          {c.role && <p>{c.role}</p>}
          {c.details && <p>{c.details}</p>}
        </section>
      )}

      {media.length > 0 && (
        <section>
          <S className="label">Documentation visuelle</S>
          <Gallery key={c.id} items={media} />
        </section>
      )}

      {c.video?.src && (
        <section>
          <S className="label">Vidéo</S>
          <video className="info-panel__video" src={c.video.src} controls preload="none" aria-label={c.video.alt} />
        </section>
      )}

      {c.parameters.length > 0 && (
        <section>
          <S className="label">Informations techniques</S>
          <dl className="params">
            {c.parameters.map((p, i) => (
              <div key={`${p.label}-${i}`}>
                <dt>{p.label}</dt>
                <dd>
                  {p.value}
                  {p.source && <small title={sourceLabel(p.source)}>{shortSource(p.source)}</small>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {(sources.length > 0 || c.note) && (
        <section className="info-panel__sources">
          <S className="label">Sources</S>
          {sources.length > 0 && (
            <ul>
              {sources.map((s) => (
                <li key={s!.id}>
                  {s!.label}
                  {s!.detail && <span>{s!.detail}</span>}
                </li>
              ))}
            </ul>
          )}
          {c.note && <p className="info-panel__note">{c.note}</p>}
        </section>
      )}

      {actions && <footer className="info-panel__actions">{actions}</footer>}
    </article>
  );
}

function shortSource(id: string) {
  return { 'rapport-visite': 'rapport de visite', synoptique: 'synoptique', 'photos-visite': 'photographies', maquette: 'maquette 3D' }[id] ?? id;
}
