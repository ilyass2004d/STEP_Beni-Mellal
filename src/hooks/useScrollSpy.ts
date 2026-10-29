import { useEffect, useState } from 'react';

/**
 * Returns the id of the element (among `ids`) that crosses the horizontal line
 * located at `line` × viewport height, plus overall progress through the span
 * from the first to the last element (0–1).
 */
export function useScrollSpy(ids: string[], line = 0.5) {
  const [state, setState] = useState<{ active: string | null; progress: number }>({ active: null, progress: 0 });
  const key = ids.join('|');

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = window.innerHeight * line;
      let active: string | null = null;
      let first: DOMRect | null = null;
      let last: DOMRect | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        first ??= r;
        last = r;
        if (r.top <= y && r.bottom > y) active = id;
      }
      let progress = 0;
      if (first && last) {
        const span = last.bottom - first.top;
        progress = span > 0 ? Math.min(1, Math.max(0, (y - first.top) / span)) : 0;
      }
      setState((s) => (s.active === active && Math.abs(s.progress - progress) < 0.002 ? s : { active, progress }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, line]);

  return state;
}
