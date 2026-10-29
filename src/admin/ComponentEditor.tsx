import { useMemo, useState } from 'react';
import type { MediaRef, SiteContent, StepComponent, Verification } from '../content/types';
import { InfoPanel, VERIFICATION_LABEL } from '../components/InfoPanel';
import type { Manifest } from '../three/manifest';
import { CONTEXT_LAYERS } from '../three/manifest';
import { Field, MediaEditor, TextField } from './fields';
import { validateComponent } from './validate';

interface Props {
  initial: StepComponent;
  isNew: boolean;
  content: SiteContent;
  manifest: Manifest | null;
  onSave(c: StepComponent): void;
  onCancel(): void;
}

const emptyMedia = (kind: MediaRef['kind']): MediaRef => ({ src: '', alt: '', kind });

export function ComponentEditor({ initial, isNew, content, manifest, onSave, onCancel }: Props) {
  const [c, setC] = useState<StepComponent>(() => structuredClone(initial));
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<StepComponent>) => setC((x) => ({ ...x, ...patch }));

  const knownParts = manifest ? manifest.parties.map((p) => p.id) : null;
  const errors = useMemo(() => validateComponent(c, content.components, isNew ? null : initial.id, knownParts), [c, content.components, isNew, initial.id, knownParts]);
  const shown = tried ? errors : {};
  const hasErrors = Object.keys(errors).length > 0;

  // Which parts are already used by another structure
  const usedBy = new Map<string, string>();
  for (const x of content.components) if (x.id !== initial.id) for (const p of x.modelParts) usedBy.set(p, x.name);

  const save = () => {
    setTried(true);
    if (!hasErrors) onSave({ ...c, note: c.note || undefined, technicalName: c.technicalName || undefined, role: c.role || undefined, details: c.details || undefined });
  };

  const optionalMedia = (key: 'render' | 'diagram' | 'video', label: string, kind: MediaRef['kind']) => (
    <fieldset className="a-fieldset">
      <legend>{label}</legend>
      {c[key] ? (
        <MediaEditor
          value={c[key]!}
          onChange={(m) => set({ [key]: m })}
          onRemove={() => set({ [key]: undefined })}
          errors={{ src: shown[`${key}.src`], alt: shown[`${key}.alt`] }}
        />
      ) : (
        <button type="button" className="a-btn" onClick={() => set({ [key]: emptyMedia(kind) })}>
          Ajouter
        </button>
      )}
    </fieldset>
  );

  return (
    <div className="editor">
      <div className="editor__form">
        <div className="editor__bar">
          <h2>{isNew ? 'Nouvel ouvrage' : `Modifier : ${initial.name}`}</h2>
          <div>
            <button type="button" className="a-btn" onClick={onCancel}>
              Annuler
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={save}>
              Enregistrer
            </button>
          </div>
        </div>
        {tried && hasErrors && (
          <p className="a-alert" role="alert">
            {Object.keys(errors).length} champ(s) à corriger avant l'enregistrement.
          </p>
        )}

        <fieldset className="a-fieldset">
          <legend>Identité</legend>
          <div className="field-row">
            <TextField label="Identifiant unique" value={c.id} onChange={(id) => set({ id: id.trim() })} error={shown.id} hint="Utilisé dans les liens et la maquette." />
            <Field label="Ordre d'affichage" error={shown.order}>
              {(id) => <input id={id} type="number" value={c.order} onChange={(e) => set({ order: e.target.valueAsNumber })} />}
            </Field>
          </div>
          <TextField label="Nom affiché" value={c.name} onChange={(name) => set({ name })} error={shown.name} />
          <TextField label="Nom technique" value={c.technicalName} onChange={(technicalName) => set({ technicalName })} />
          <div className="field-row">
            <Field label="Étape de traitement">
              {(id) => (
                <select id={id} value={c.stage ?? ''} onChange={(e) => set({ stage: e.target.value || undefined })}>
                  <option value="">Non précisée</option>
                  {content.stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Niveau de documentation">
              {(id) => (
                <select id={id} value={c.verification} onChange={(e) => set({ verification: e.target.value as Verification })}>
                  {Object.entries(VERIFICATION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="checks">
            <label>
              <input type="checkbox" checked={c.visible} onChange={(e) => set({ visible: e.target.checked })} /> Visible sur le site
            </label>
            <label>
              <input type="checkbox" checked={c.inNarrative} onChange={(e) => set({ inNarrative: e.target.checked })} /> Étape du chapitre « Les ouvrages »
            </label>
          </div>
        </fieldset>

        <fieldset className="a-fieldset">
          <legend>Textes</legend>
          <TextField label="Courte description" value={c.shortDescription} onChange={(shortDescription) => set({ shortDescription })} error={shown.shortDescription} multiline rows={2} />
          <TextField label="Rôle dans le procédé" value={c.role} onChange={(role) => set({ role })} multiline rows={4} hint="Uniquement des informations vérifiées." />
          <TextField label="Explication détaillée" value={c.details} onChange={(details) => set({ details })} multiline rows={4} />
          <TextField label="Note éditoriale (ce qui reste à vérifier…)" value={c.note} onChange={(note) => set({ note })} multiline rows={2} />
        </fieldset>

        <fieldset className="a-fieldset">
          <legend>Pièces de la maquette 3D</legend>
          {!manifest && <p className="a-muted">Chargement de manifest.json…</p>}
          {shown.modelParts && <p className="field__error">{shown.modelParts}</p>}
          <div className="parts">
            {manifest?.parties
              .filter((p) => !CONTEXT_LAYERS.some((l) => l.id === p.id))
              .map((p) => (
                <label key={p.id} title={p.objets.join(', ')}>
                  <input
                    type="checkbox"
                    checked={c.modelParts.includes(p.id)}
                    onChange={(e) => set({ modelParts: e.target.checked ? [...c.modelParts, p.id] : c.modelParts.filter((x) => x !== p.id) })}
                  />
                  {p.nom}
                  {usedBy.has(p.id) && <small> · {usedBy.get(p.id)}</small>}
                </label>
              ))}
          </div>
        </fieldset>

        <fieldset className="a-fieldset">
          <legend>Photographies</legend>
          {c.photos.map((m, i) => (
            <MediaEditor
              key={i}
              value={m}
              onChange={(nm) => set({ photos: c.photos.map((x, j) => (j === i ? nm : x)) })}
              onRemove={() => set({ photos: c.photos.filter((_, j) => j !== i) })}
              errors={{ src: shown[`photos.${i}.src`], alt: shown[`photos.${i}.alt`] }}
            />
          ))}
          <button type="button" className="a-btn" onClick={() => set({ photos: [...c.photos, emptyMedia('photo')] })}>
            Ajouter une photographie
          </button>
        </fieldset>

        {optionalMedia('render', 'Rendu de la maquette', 'rendu')}
        {optionalMedia('diagram', 'Schéma technique', 'schema')}
        {optionalMedia('video', 'Vidéo (facultative)', 'video')}

        <fieldset className="a-fieldset">
          <legend>Informations techniques vérifiées</legend>
          {c.parameters.map((p, i) => (
            <div key={i} className={`param-row ${shown[`parameters.${i}`] ? 'has-error' : ''}`}>
              <input aria-label="Libellé" placeholder="Libellé" value={p.label} onChange={(e) => set({ parameters: c.parameters.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input aria-label="Valeur" placeholder="Valeur" value={p.value} onChange={(e) => set({ parameters: c.parameters.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <select aria-label="Source" value={p.source ?? ''} onChange={(e) => set({ parameters: c.parameters.map((x, j) => (j === i ? { ...x, source: e.target.value || undefined } : x)) })}>
                <option value="">Sans source</option>
                {content.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button type="button" className="a-btn a-btn--danger" onClick={() => set({ parameters: c.parameters.filter((_, j) => j !== i) })} aria-label="Retirer ce paramètre">
                ×
              </button>
            </div>
          ))}
          <button type="button" className="a-btn" onClick={() => set({ parameters: [...c.parameters, { label: '', value: '' }] })}>
            Ajouter un paramètre
          </button>
        </fieldset>

        <fieldset className="a-fieldset">
          <legend>Sources</legend>
          <div className="checks">
            {content.sources.map((s) => (
              <label key={s.id}>
                <input type="checkbox" checked={c.sources.includes(s.id)} onChange={(e) => set({ sources: e.target.checked ? [...c.sources, s.id] : c.sources.filter((x) => x !== s.id) })} />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="editor__preview" aria-label="Aperçu de la fiche">
        <p className="a-muted">Aperçu</p>
        <div className="editor__preview-card">
          <InfoPanel component={c} content={content} headingLevel={3} />
        </div>
      </aside>
    </div>
  );
}
