import { useEffect, useMemo, useRef, useState } from 'react';
import { ASSETS } from '../content/assetManifest';
import { localDraftStore, publishedContent } from '../content/store';
import type { Chapter, SectionId, SiteContent, StepComponent } from '../content/types';
import { VERIFICATION_LABEL } from '../components/InfoPanel';
import { loadManifest, type Manifest } from '../three/manifest';
import { ComponentEditor } from './ComponentEditor';
import { ConfirmDialog, MediaEditor, TextField } from './fields';
import { checkContentShape, localMediaRefs } from './validate';
import './admin.css';

type Tab = 'ouvrages' | 'chapitres' | 'accueil' | 'apropos' | 'sections' | 'medias' | 'donnees';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ouvrages', label: 'Ouvrages' },
  { id: 'chapitres', label: 'Chapitres' },
  { id: 'accueil', label: 'Accueil' },
  { id: 'apropos', label: 'Crédits et sources' },
  { id: 'sections', label: 'Sections visibles' },
  { id: 'medias', label: 'Médias' },
  { id: 'donnees', label: 'Publier / données' },
];

const SECTION_LABEL: Record<SectionId, string> = {
  hero: 'Écran d’ouverture',
  parcours: 'Le parcours (chapitres 01 à 03)',
  explorer: 'Explorateur 3D',
  ouvrages: 'Les ouvrages (chapitre 04)',
  apres: 'Après le traitement (chapitre 05)',
  apropos: 'À propos et crédits',
};

export default function Admin() {
  const [draft, setDraft] = useState<SiteContent>(() => localDraftStore.loadDraft() ?? structuredClone(publishedContent));
  const [tab, setTab] = useState<Tab>('ouvrages');
  const [editing, setEditing] = useState<{ component: StepComponent; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; label: string; run(): void } | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [preview, setPreview] = useState(localDraftStore.isPreviewEnabled());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Administration · STEP Béni Mellal';
    loadManifest().then(setManifest, () => setManifest(null));
  }, []);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(publishedContent), [draft]);

  const commit = (next: SiteContent, message?: string) => {
    setDraft(next);
    localDraftStore.saveDraft(next);
    if (message) setNotice(message);
  };

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const components = [...draft.components].sort((a, b) => a.order - b.order);

  const move = (id: string, dir: -1 | 1) => {
    const list = [...components];
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    commit({ ...draft, components: list.map((c, k) => ({ ...c, order: k + 1 })) });
  };

  const saveComponent = (c: StepComponent) => {
    const originalId = editing?.isNew ? null : editing?.component.id;
    const list = originalId ? draft.components.map((x) => (x.id === originalId ? c : x)) : [...draft.components, c];
    commit({ ...draft, components: list }, `« ${c.name} » enregistré dans le brouillon.`);
    setEditing(null);
  };

  const newComponent = (): StepComponent => {
    let n = 1;
    while (draft.components.some((c) => c.id === `nouvel-ouvrage-${n}`)) n++;
    return {
      id: `nouvel-ouvrage-${n}`,
      order: components.length + 1,
      visible: false,
      inNarrative: false,
      name: '',
      verification: 'a-documenter',
      shortDescription: '',
      modelParts: [],
      photos: [],
      parameters: [],
      sources: [],
    };
  };

  const setChapter = (id: string, patch: Partial<Chapter>) =>
    commit({ ...draft, chapters: draft.chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const fileInput = useRef<HTMLInputElement>(null);
  const importJson = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      const err = checkContentShape(parsed);
      if (err) return setNotice(`Import refusé : ${err}`);
      setConfirm({
        title: 'Remplacer le brouillon ?',
        body: `Le brouillon actuel sera remplacé par le contenu de « ${f.name} ».`,
        label: 'Remplacer',
        run: () => commit(parsed as SiteContent, 'Contenu importé dans le brouillon.'),
      });
    } catch {
      setNotice('Import refusé : fichier JSON illisible.');
    }
  };

  const togglePreview = (on: boolean) => {
    localDraftStore.setPreviewEnabled(on);
    setPreview(on);
  };

  const localRefs = localMediaRefs(draft);

  if (editing) {
    return (
      <div className="admin">
        <AdminHeader dirty={dirty} preview={preview} />
        <ComponentEditor
          key={editing.component.id}
          initial={editing.component}
          isNew={editing.isNew}
          content={draft}
          manifest={manifest}
          onSave={saveComponent}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="admin">
      <AdminHeader dirty={dirty} preview={preview} />
      <p className="a-storage" role="note">
        <strong>Stockage local.</strong> Les modifications sont enregistrées comme brouillon dans ce navigateur uniquement (localStorage) : elles ne
        sont ni publiées, ni partagées entre appareils. Pour publier, exportez <code>content.json</code> et remplacez <code>src/content/content.json</code>{' '}
        dans le projet, puis reconstruisez le site.
      </p>
      {notice && (
        <p className="a-notice" role="status">
          {notice}
        </p>
      )}

      <div className="admin__body">
        <nav className="admin__tabs" aria-label="Rubriques">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin__main">
          {tab === 'ouvrages' && (
            <section>
              <div className="a-head">
                <h2>Ouvrages ({components.length})</h2>
                <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing({ component: newComponent(), isNew: true })}>
                  Ajouter un ouvrage
                </button>
              </div>
              <table className="a-table">
                <thead>
                  <tr>
                    <th scope="col">Ordre</th>
                    <th scope="col">Nom</th>
                    <th scope="col">Documentation</th>
                    <th scope="col">Maquette</th>
                    <th scope="col">Médias</th>
                    <th scope="col">Visible</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c, i) => (
                    <tr key={c.id} className={c.visible ? '' : 'is-hidden'}>
                      <td>
                        <div className="order">
                          <button type="button" className="a-icon" onClick={() => move(c.id, -1)} disabled={i === 0} aria-label={`Monter ${c.name}`}>
                            ↑
                          </button>
                          <button type="button" className="a-icon" onClick={() => move(c.id, 1)} disabled={i === components.length - 1} aria-label={`Descendre ${c.name}`}>
                            ↓
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong>{c.name || <em>Sans nom</em>}</strong>
                        <small>
                          {c.id}
                          {c.inNarrative && ' · chapitre 04'}
                        </small>
                      </td>
                      <td>
                        <span className={`verif verif--${c.verification}`}>{VERIFICATION_LABEL[c.verification]}</span>
                      </td>
                      <td>{c.modelParts.length ? c.modelParts.join(', ') : <em className="a-warn">aucune pièce</em>}</td>
                      <td>{c.photos.length + (c.render ? 1 : 0) + (c.diagram ? 1 : 0)}</td>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Visible : ${c.name}`}
                          checked={c.visible}
                          onChange={(e) => commit({ ...draft, components: draft.components.map((x) => (x.id === c.id ? { ...x, visible: e.target.checked } : x)) })}
                        />
                      </td>
                      <td className="a-actions">
                        <button type="button" className="a-btn" onClick={() => setEditing({ component: c, isNew: false })}>
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="a-btn a-btn--danger"
                          onClick={() =>
                            setConfirm({
                              title: `Supprimer « ${c.name || c.id} » ?`,
                              body: 'La fiche et ses références aux médias seront retirées du brouillon. Les fichiers eux-mêmes ne sont pas supprimés.',
                              label: 'Supprimer',
                              run: () => commit({ ...draft, components: draft.components.filter((x) => x.id !== c.id) }, 'Ouvrage supprimé du brouillon.'),
                            })
                          }
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === 'chapitres' && (
            <section className="a-stack">
              <h2>Chapitres</h2>
              {draft.chapters.map((ch) => (
                <fieldset key={ch.id} className="a-fieldset">
                  <legend>
                    {ch.number} · {ch.eyebrow}
                  </legend>
                  <label className="checks">
                    <span>
                      <input type="checkbox" checked={ch.visible} onChange={(e) => setChapter(ch.id, { visible: e.target.checked })} /> Visible
                    </span>
                  </label>
                  <div className="field-row">
                    <TextField label="Surtitre" value={ch.eyebrow} onChange={(eyebrow) => setChapter(ch.id, { eyebrow })} />
                    <TextField label="Titre" value={ch.title} onChange={(title) => setChapter(ch.id, { title })} />
                  </div>
                  <TextField label="Texte principal" value={ch.text} onChange={(text) => setChapter(ch.id, { text })} multiline rows={3} />
                  <TextField label="Texte secondaire (documenté)" value={ch.secondary} onChange={(secondary) => setChapter(ch.id, { secondary: secondary || undefined })} multiline rows={3} />
                  {ch.media ? (
                    <MediaEditor value={ch.media} onChange={(media) => setChapter(ch.id, { media })} onRemove={() => setChapter(ch.id, { media: undefined })} />
                  ) : (
                    <button type="button" className="a-btn" onClick={() => setChapter(ch.id, { media: { src: '', alt: '', kind: 'photo' } })}>
                      Ajouter un média
                    </button>
                  )}
                </fieldset>
              ))}
            </section>
          )}

          {tab === 'accueil' && (
            <section className="a-stack">
              <h2>Écran d’ouverture</h2>
              <fieldset className="a-fieldset">
                <legend>Textes</legend>
                {(['eyebrow', 'title', 'subtitle', 'description', 'primaryCta', 'secondaryCta'] as const).map((k) => (
                  <TextField
                    key={k}
                    label={{ eyebrow: 'Surtitre', title: 'Titre', subtitle: 'Sous-titre', description: 'Description', primaryCta: 'Action principale', secondaryCta: 'Action secondaire' }[k]}
                    value={draft.hero[k]}
                    multiline={k === 'description'}
                    rows={2}
                    onChange={(v) => commit({ ...draft, hero: { ...draft.hero, [k]: v } })}
                  />
                ))}
              </fieldset>
              <fieldset className="a-fieldset">
                <legend>Vidéo ou image de fond</legend>
                <MediaEditor value={draft.hero.media} onChange={(media) => commit({ ...draft, hero: { ...draft.hero, media } })} />
              </fieldset>
            </section>
          )}

          {tab === 'apropos' && (
            <section className="a-stack">
              <h2>Crédits et sources</h2>
              <fieldset className="a-fieldset">
                <legend>À propos</legend>
                <TextField label="Titre" value={draft.about.title} onChange={(title) => commit({ ...draft, about: { ...draft.about, title } })} />
                <TextField label="Texte" value={draft.about.text} multiline onChange={(text) => commit({ ...draft, about: { ...draft.about, text } })} />
                <TextField label="Signature" value={draft.about.signature} onChange={(signature) => commit({ ...draft, about: { ...draft.about, signature } })} />
                <TextField label="Avertissement" value={draft.about.disclaimer} multiline onChange={(disclaimer) => commit({ ...draft, about: { ...draft.about, disclaimer } })} />
              </fieldset>
              <fieldset className="a-fieldset">
                <legend>Crédits</legend>
                {draft.about.credits.map((c, i) => (
                  <div key={i} className="param-row">
                    <input aria-label="Rôle" value={c.role} placeholder="Rôle" onChange={(e) => commit({ ...draft, about: { ...draft.about, credits: draft.about.credits.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) } })} />
                    <input aria-label="Nom" value={c.name} placeholder="Nom" onChange={(e) => commit({ ...draft, about: { ...draft.about, credits: draft.about.credits.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) } })} />
                    <button type="button" className="a-btn a-btn--danger" aria-label="Retirer ce crédit" onClick={() => commit({ ...draft, about: { ...draft.about, credits: draft.about.credits.filter((_, j) => j !== i) } })}>
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="a-btn" onClick={() => commit({ ...draft, about: { ...draft.about, credits: [...draft.about.credits, { role: '', name: '' }] } })}>
                  Ajouter un crédit
                </button>
              </fieldset>
              <fieldset className="a-fieldset">
                <legend>Sources documentaires</legend>
                {draft.sources.map((s, i) => (
                  <div key={s.id} className="param-row param-row--3">
                    <input aria-label="Identifiant" value={s.id} readOnly title="Identifiant (référencé par les fiches)" />
                    <input aria-label="Intitulé" value={s.label} onChange={(e) => commit({ ...draft, sources: draft.sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    <input aria-label="Détail" value={s.detail ?? ''} onChange={(e) => commit({ ...draft, sources: draft.sources.map((x, j) => (j === i ? { ...x, detail: e.target.value || undefined } : x)) })} />
                  </div>
                ))}
                <AddSource onAdd={(id, label) => (draft.sources.some((s) => s.id === id) ? setNotice('Identifiant de source déjà utilisé.') : commit({ ...draft, sources: [...draft.sources, { id, label }] }))} />
              </fieldset>
            </section>
          )}

          {tab === 'sections' && (
            <section className="a-stack">
              <h2>Sections visibles</h2>
              <fieldset className="a-fieldset checks checks--col">
                {(Object.keys(SECTION_LABEL) as SectionId[]).map((k) => (
                  <label key={k}>
                    <input type="checkbox" checked={draft.sections[k]} onChange={(e) => commit({ ...draft, sections: { ...draft.sections, [k]: e.target.checked } })} />
                    {SECTION_LABEL[k]}
                  </label>
                ))}
              </fieldset>
            </section>
          )}

          {tab === 'medias' && (
            <section className="a-stack">
              <h2>Inventaire des médias</h2>
              <p className="a-muted">
                Fichiers générés par <code>npm run assets</code> (tools/prepare_assets.py) à partir des dossiers du projet. Les éléments « manquant » sont
                attendus.
              </p>
              <table className="a-table">
                <thead>
                  <tr>
                    <th scope="col">Fichier</th>
                    <th scope="col">Rôle</th>
                    <th scope="col">Nature</th>
                    <th scope="col">Origine</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSETS.map((a) => (
                    <tr key={a.path}>
                      <td>
                        <code>{a.path}</code>
                      </td>
                      <td>{a.role}</td>
                      <td>
                        <span className={`a-status a-status--${a.status}`}>{a.status}</span>
                      </td>
                      <td>{a.origin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === 'donnees' && (
            <section className="a-stack">
              <h2>Publier et sauvegarder</h2>
              <fieldset className="a-fieldset">
                <legend>Aperçu sur le site</legend>
                <label className="checks">
                  <span>
                    <input type="checkbox" checked={preview} onChange={(e) => togglePreview(e.target.checked)} /> Afficher le brouillon sur le site public{' '}
                    <em>(dans ce navigateur uniquement)</em>
                  </span>
                </label>
                <a className="a-btn" href="/" target="_blank" rel="noreferrer">
                  Ouvrir le site
                </a>
              </fieldset>
              <fieldset className="a-fieldset">
                <legend>Exporter / importer</legend>
                <p>
                  1. Exportez <code>content.json</code>. 2. Remplacez <code>site/src/content/content.json</code>. 3. Lancez <code>npm run build</code>.
                </p>
                {localRefs.length > 0 && (
                  <p className="a-alert">
                    {localRefs.length} média(s) importé(s) dans ce navigateur (<code>idb:…</code>) ne font pas partie de l'export : copiez les fichiers dans{' '}
                    <code>public/media/</code> et remplacez leurs chemins avant de publier.
                  </p>
                )}
                <div className="a-actions">
                  <button type="button" className="a-btn a-btn--primary" onClick={exportJson}>
                    Exporter content.json
                  </button>
                  <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void importJson(e.target.files?.[0])} />
                  <button type="button" className="a-btn" onClick={() => fileInput.current?.click()}>
                    Importer un fichier…
                  </button>
                </div>
              </fieldset>
              <fieldset className="a-fieldset">
                <legend>Réinitialiser</legend>
                <p>Abandonne le brouillon et revient au contenu publié.</p>
                <button
                  type="button"
                  className="a-btn a-btn--danger"
                  disabled={!dirty}
                  onClick={() =>
                    setConfirm({
                      title: 'Abandonner le brouillon ?',
                      body: 'Toutes les modifications locales seront perdues. Pensez à exporter d’abord si nécessaire.',
                      label: 'Abandonner',
                      run: () => {
                        localDraftStore.clearDraft();
                        togglePreview(false);
                        setDraft(structuredClone(publishedContent));
                        setNotice('Brouillon abandonné.');
                      },
                    })
                  }
                >
                  Abandonner le brouillon
                </button>
              </fieldset>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        body={confirm?.body}
        confirmLabel={confirm?.label ?? 'Confirmer'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
      />
    </div>
  );
}

function AdminHeader({ dirty, preview }: { dirty: boolean; preview: boolean }) {
  return (
    <header className="admin__header">
      <div>
        <p className="a-kicker">STEP Béni Mellal</p>
        <h1>Administration du contenu</h1>
      </div>
      <p className="admin__state">
        <span className={dirty ? 'dot dot--draft' : 'dot'} />
        {dirty ? 'Brouillon local différent de la version publiée' : 'Identique à la version publiée'}
        {preview && ' · aperçu actif'}
      </p>
      <a className="a-btn" href="/">
        Retour au site
      </a>
    </header>
  );
}

function AddSource({ onAdd }: { onAdd(id: string, label: string): void }) {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const valid = /^[a-z0-9-]+$/.test(id) && label.trim().length > 0;
  return (
    <div className="param-row param-row--3">
      <input aria-label="Nouvel identifiant" placeholder="identifiant-source" value={id} onChange={(e) => setId(e.target.value.trim())} />
      <input aria-label="Nouvel intitulé" placeholder="Intitulé de la source" value={label} onChange={(e) => setLabel(e.target.value)} />
      <button
        type="button"
        className="a-btn"
        disabled={!valid}
        onClick={() => {
          onAdd(id, label.trim());
          setId('');
          setLabel('');
        }}
      >
        Ajouter
      </button>
    </div>
  );
}
