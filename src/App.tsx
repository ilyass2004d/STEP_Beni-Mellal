import { useCallback, useState } from 'react';
import { useContent } from './content/store';
import { About } from './components/About';
import { After } from './components/After';
import { ChapterRail, type RailItem } from './components/ChapterRail';
import type { SelectionRequest } from './components/explorer/Explorer';
import { ExplorerSection } from './components/explorer/ExplorerSection';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Nav } from './components/Nav';
import { chapterAnchor, Narrative } from './components/Narrative';
import { Ouvrages } from './components/Ouvrages';

export default function App() {
  const { content, isDraftPreview, exitPreview } = useContent();
  const { sections } = content;
  const [request, setRequest] = useState<SelectionRequest | null>(null);
  const explore = useCallback((id: string) => setRequest({ id, nonce: Date.now() }), []);

  const chapter = (id: string) => content.chapters.find((c) => c.id === id && c.visible);
  const narrative = ['origine', 'reseau', 'station'].map(chapter).filter((c) => c !== undefined);
  const ouvrages = chapter('ouvrages');
  const apres = chapter('apres');

  const showParcours = sections.parcours && narrative.length > 0;
  const showOuvrages = sections.ouvrages && ouvrages;
  const showApres = sections.apres && apres;

  const rail: RailItem[] = [
    ...(showParcours ? narrative.map((c) => ({ id: chapterAnchor(c), number: c.number, label: c.eyebrow })) : []),
    ...(sections.explorer ? [{ id: 'explorer', number: '3D', label: 'La maquette' }] : []),
    ...(showOuvrages ? [{ id: 'ouvrages', number: ouvrages.number, label: ouvrages.eyebrow }] : []),
    ...(showApres ? [{ id: 'apres', number: apres.number, label: apres.eyebrow }] : []),
  ];

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      {isDraftPreview && (
        <div className="draft-banner" role="status">
          Aperçu d'un brouillon local (ce navigateur uniquement).
          <button type="button" onClick={exitPreview}>
            Quitter l'aperçu
          </button>
        </div>
      )}
      <Nav sections={sections} />
      <main id="contenu">
        {sections.hero && <Hero hero={content.hero} />}
        {showParcours && <Narrative chapters={narrative} content={content} />}
        {sections.explorer && <ExplorerSection content={content} request={request} />}
        {showOuvrages && <Ouvrages chapter={ouvrages} content={content} onExplore={sections.explorer ? explore : undefined} />}
        {showApres && <After chapter={apres} content={content} />}
        {sections.apropos && <About content={content} />}
      </main>
      <Footer signature={content.about.signature} />
      <ChapterRail items={rail} />
    </>
  );
}
