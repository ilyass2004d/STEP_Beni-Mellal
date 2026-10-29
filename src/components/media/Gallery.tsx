import { useEffect, useRef, useState } from 'react';
import type { MediaRef } from '../../content/types';
import { KindBadge, Picture } from './Picture';

/** Main image + thumbnails; the main image opens a full-size lightbox. */
export function Gallery({ items, sizes = '(min-width: 900px) 420px, 100vw' }: { items: MediaRef[]; sizes?: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = items[Math.min(index, items.length - 1)];

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!current) return null;
  return (
    <div className="gallery">
      <figure className="gallery__main">
        <button type="button" className="gallery__zoom" onClick={() => setOpen(true)} aria-label={`Agrandir : ${current.alt}`}>
          <Picture media={current} sizes={sizes} />
        </button>
        <figcaption>
          <KindBadge kind={current.kind} />
          {current.caption && <span>{current.caption}</span>}
          {current.credit && <span className="gallery__credit">{current.credit}</span>}
        </figcaption>
      </figure>
      {items.length > 1 && (
        <ul className="gallery__thumbs" aria-label="Autres images">
          {items.map((m, i) => (
            <li key={`${m.src}-${i}`}>
              <button type="button" aria-pressed={i === index} aria-label={m.alt} onClick={() => setIndex(i)}>
                <Picture media={m} sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <dialog ref={dialog} className="lightbox" onClose={() => setOpen(false)} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        {open && (
          <figure>
            <Picture media={current} sizes="100vw" eager />
            <figcaption>
              <KindBadge kind={current.kind} /> {current.caption ?? current.alt}
            </figcaption>
          </figure>
        )}
        <button type="button" className="lightbox__close" onClick={() => setOpen(false)}>
          Fermer
        </button>
      </dialog>
    </div>
  );
}
