import { useScrollSpy } from '../hooks/useScrollSpy';

export interface RailItem {
  id: string;
  number: string;
  label: string;
}

/** Fixed chapter index (desktop) / thin progress bar (mobile). Hidden on the hero and credits. */
export function ChapterRail({ items }: { items: RailItem[] }) {
  const { active, progress } = useScrollSpy(
    items.map((i) => i.id),
    0.5,
  );
  // the 3D viewport has its own controls: keep the rail out of its way
  const visible = active !== null && active !== 'explorer';

  return (
    <>
      <nav className={`rail ${visible ? 'is-visible' : ''}`} aria-label="Chapitres" aria-hidden={!visible}>
        <span className="rail__track" aria-hidden="true">
          <span style={{ transform: `scaleY(${progress})` }} />
        </span>
        <ol>
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} aria-current={active === i.id ? 'step' : undefined} tabIndex={visible ? 0 : -1}>
                <span className="rail__num">{i.number}</span>
                <span className="rail__label">{i.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={`rail-bar ${visible ? 'is-visible' : ''}`} aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </>
  );
}
