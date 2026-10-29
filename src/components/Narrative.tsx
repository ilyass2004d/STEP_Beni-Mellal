import { useRef } from 'react';
import { isVideo } from '../content/media';
import type { Chapter, SiteContent } from '../content/types';
import { useInView } from '../hooks/useInView';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { Icon } from './Icon';
import { KindBadge, Picture } from './media/Picture';
import { LoopVideo } from './media/LoopVideo';

export const chapterAnchor = (c: Chapter) => `chapitre-${c.id}`;

/**
 * Chapters 01–03: a sticky full-screen media stage whose layers cross-fade
 * (no black frames between clips) while the chapter texts scroll over it.
 */
export function Narrative({ chapters, content }: { chapters: Chapter[]; content: SiteContent }) {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, '200px 0px');
  const { active } = useScrollSpy(chapters.map(chapterAnchor), 0.55);
  const activeIndex = Math.max(0, chapters.findIndex((c) => chapterAnchor(c) === active));
  const sourceLabel = (id?: string) => content.sources.find((s) => s.id === id)?.label;

  return (
    <section id="parcours" ref={ref} className="narrative" data-tone="dark" aria-label="Le parcours de l'eau">
      <div className="narrative__stage" aria-hidden="true">
        {chapters.map((c, i) => {
          const on = i === activeIndex;
          const loadThis = near && Math.abs(i - activeIndex) <= 1;
          return (
            <div key={c.id} className={`narrative__layer ${on ? 'is-active' : ''}`}>
              {c.media &&
                (isVideo(c.media.src) ? (
                  <LoopVideo src={c.media.src} label={c.media.alt} active={near && on} load={loadThis} playbackRate={0.55} />
                ) : (
                  <Picture media={c.media} className="narrative__image" />
                ))}
            </div>
          );
        })}
        <div className="narrative__veil" />
        <div className="narrative__progress">
          <span style={{ transform: `scaleX(${(activeIndex + 1) / chapters.length})` }} />
        </div>
      </div>

      <div className="narrative__steps">
        {chapters.map((c, i) => (
          <article key={c.id} id={chapterAnchor(c)} className="chapter" aria-labelledby={`${chapterAnchor(c)}-t`}>
            <div className={`chapter__card ${i === activeIndex ? 'is-active' : ''}`}>
              <p className="eyebrow">
                <span className="chapter__num">{c.number}</span> {c.eyebrow}
              </p>
              <h2 id={`${chapterAnchor(c)}-t`} className="chapter__title">
                {c.title}
              </h2>
              <p className="chapter__text">{c.text}</p>
              {c.secondary && (
                <p className="chapter__secondary">
                  {c.secondary}
                  {c.secondarySource && <cite>Source : {sourceLabel(c.secondarySource)}</cite>}
                </p>
              )}
              {c.media?.caption && (
                <p className="chapter__media-note">
                  <KindBadge kind={c.media.kind} /> {c.media.caption}
                </p>
              )}
              {i === chapters.length - 1 && (
                <a className="btn btn--primary chapter__cta" href="#explorer">
                  Entrer dans la maquette 3D
                  <Icon name="cube" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
