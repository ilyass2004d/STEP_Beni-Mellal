import type { SiteContent } from '../content/types';

export function About({ content }: { content: SiteContent }) {
  const { about, sources } = content;
  return (
    <section id="apropos" className="about" data-tone="light" aria-labelledby="apropos-title">
      <div className="about__grid">
        <div>
          <p className="eyebrow">À propos</p>
          <h2 id="apropos-title" className="section-title">
            {about.title}
          </h2>
          <p className="section-lead">{about.text}</p>
          <p className="about__signature">{about.signature}</p>
          <p className="about__disclaimer">{about.disclaimer}</p>
        </div>

        <div className="about__cols">
          <div>
            <h3 className="label">Crédits</h3>
            <dl className="credits">
              {about.credits.map((c, i) => (
                <div key={`${c.role}-${i}`}>
                  <dt>{c.role}</dt>
                  <dd>{c.name}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="label">Sources</h3>
            <ol className="sources">
              {sources.map((s) => (
                <li key={s.id}>
                  <strong>{s.label}</strong>
                  {s.detail && <span>{s.detail}</span>}
                </li>
              ))}
            </ol>
            <p className="about__legend">
              Chaque image porte sa nature : <em>photographie</em> (visite de la station), <em>rendu de la maquette</em> (image de synthèse) ou{' '}
              <em>illustration</em> (séquence d'ambiance).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
