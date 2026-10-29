import { useRef } from 'react';
import type { SiteContent } from '../content/types';
import { useInView } from '../hooks/useInView';
import { Icon } from './Icon';
import { LoopVideo } from './media/LoopVideo';

export function Hero({ hero }: { hero: SiteContent['hero'] }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref);

  return (
    <section id="accueil" ref={ref} className="hero" data-tone="dark" aria-labelledby="hero-title">
      <div className="hero__media">
        <LoopVideo src={hero.media.src} label={hero.media.alt} active={visible} load playbackRate={0.6} />
        <div className="hero__veil" />
      </div>

      <div className="hero__content">
        <p className="eyebrow reveal" style={{ ['--d' as string]: '0ms' }}>
          {hero.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title reveal" style={{ ['--d' as string]: '120ms' }}>
          {hero.title}
        </h1>
        <div className="hero__intro reveal" style={{ ['--d' as string]: '260ms' }}>
          <p className="hero__subtitle">{hero.subtitle}</p>
          <p className="hero__desc">{hero.description}</p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#explorer">
              {hero.primaryCta}
              <Icon name="arrow" />
            </a>
            <a className="btn btn--ghost-light" href="#parcours">
              {hero.secondaryCta}
            </a>
          </div>
        </div>
      </div>

      <div className="hero__foot">
        {hero.media.caption ? <p className="hero__credit">{hero.media.caption}</p> : <span />}
        <a className="scroll-cue" href="#parcours" aria-label="Faire défiler vers le parcours">
          <span>Défiler</span>
          <i aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
