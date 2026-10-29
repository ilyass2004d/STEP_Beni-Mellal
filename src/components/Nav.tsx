import { useEffect, useRef, useState } from 'react';
import type { SiteContent } from '../content/types';
import { useScrollSpy } from '../hooks/useScrollSpy';

const LINKS = [
  { href: '#accueil', label: 'Accueil', section: 'hero' },
  { href: '#parcours', label: 'Le parcours', section: 'parcours' },
  { href: '#explorer', label: 'Explorer la station', section: 'explorer' },
  { href: '#ouvrages', label: 'Les ouvrages', section: 'ouvrages' },
  { href: '#apropos', label: 'À propos', section: 'apropos' },
] as const;

/** Discreet over dark/cinematic sections, solid over light ones (detected from data-tone). */
export function Nav({ sections }: { sections: SiteContent['sections'] }) {
  const links = LINKS.filter((l) => sections[l.section]);
  const { active } = useScrollSpy(links.map((l) => l.href.slice(1)), 0.35);
  const [tone, setTone] = useState<'dark' | 'light'>('dark');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setScrolled(window.scrollY > 40);
      const probe = document.elementsFromPoint(window.innerWidth / 2, 32).find((el) => el.closest('[data-tone]') && !el.closest('.nav'));
      const t = probe?.closest<HTMLElement>('[data-tone]')?.dataset.tone;
      setTone(t === 'light' ? 'light' : 'dark');
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
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('no-scroll');
    menuRef.current?.querySelector('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className={`nav nav--${tone} ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <a className="nav__brand" href="#accueil" aria-label="STEP de Béni Mellal, retour à l'accueil">
        <span className="nav__mark" aria-hidden="true" />
        <span>
          STEP <em>Béni Mellal</em>
        </span>
      </a>
      <nav aria-label="Navigation principale" className="nav__links">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} aria-current={active === l.href.slice(1) ? 'true' : undefined}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        ref={buttonRef}
        type="button"
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{open ? 'Fermer' : 'Menu'}</span>
        <i aria-hidden="true" />
      </button>
      <div id="nav-menu" ref={menuRef} className="nav__menu" hidden={!open}>
        <ol>
          {links.map((l, i) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                <small>{String(i + 1).padStart(2, '0')}</small>
                {l.label}
              </a>
            </li>
          ))}
        </ol>
        <p className="nav__menu-sign">Maquette 3D et expérience numérique : Ilyass Zerqtouni</p>
      </div>
    </header>
  );
}
