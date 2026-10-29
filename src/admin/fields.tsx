import { useId, useRef, useState, type ReactNode } from 'react';
import { KIND_LABEL, putLocalMedia } from '../content/media';
import type { MediaKind, MediaRef } from '../content/types';
import { Picture } from '../components/media/Picture';

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && !error && <small className="field__hint">{hint}</small>}
      {error && (
        <small className="field__error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

export function TextField(props: { label: string; value: string | undefined; onChange(v: string): void; hint?: string; error?: string; multiline?: boolean; rows?: number; placeholder?: string }) {
  return (
    <Field label={props.label} hint={props.hint} error={props.error}>
      {(id) =>
        props.multiline ? (
          <textarea id={id} rows={props.rows ?? 4} value={props.value ?? ''} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} aria-invalid={Boolean(props.error)} />
        ) : (
          <input id={id} type="text" value={props.value ?? ''} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} aria-invalid={Boolean(props.error)} />
        )
      }
    </Field>
  );
}

const KINDS = Object.keys(KIND_LABEL) as MediaKind[];

export function MediaEditor({ value, onChange, onRemove, errors }: { value: MediaRef; onChange(m: MediaRef): void; onRemove?(): void; errors?: Record<string, string> }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<MediaRef>) => onChange({ ...value, ...patch });

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return;
    setBusy(true);
    try {
      set({ src: await putLocalMedia(f) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="media-editor">
      <div className="media-editor__preview">{value.src && !/\.(mp4|webm)$/i.test(value.src) ? <Picture media={value} sizes="160px" /> : <span>{value.src ? 'Vidéo' : 'Aucun média'}</span>}</div>
      <div className="media-editor__fields">
        <TextField label="Chemin ou URL" value={value.src} onChange={(src) => set({ src })} error={errors?.src}
          hint={value.src?.startsWith('idb:') ? 'Image importée : stockée dans ce navigateur uniquement.' : 'Ex. /media/photos/degrillage (jeu WebP généré) ou /media/mon-image.jpg'} />
        <TextField label="Texte alternatif" value={value.alt} onChange={(alt) => set({ alt })} error={errors?.alt} />
        <div className="field-row">
          <Field label="Nature">
            {(id) => (
              <select id={id} value={value.kind} onChange={(e) => set({ kind: e.target.value as MediaKind })}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <TextField label="Crédit" value={value.credit} onChange={(credit) => set({ credit: credit || undefined })} />
        </div>
        <TextField label="Légende" value={value.caption} onChange={(caption) => set({ caption: caption || undefined })} />
        <div className="media-editor__actions">
          <input ref={file} type="file" accept="image/*,video/mp4,video/webm" hidden onChange={(e) => void importFile(e.target.files?.[0])} />
          <button type="button" className="a-btn" onClick={() => file.current?.click()} disabled={busy}>
            {busy ? 'Import…' : 'Importer un fichier'}
          </button>
          {onRemove && (
            <button type="button" className="a-btn a-btn--danger" onClick={onRemove}>
              Retirer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: { open: boolean; title: string; body: ReactNode; confirmLabel: string; onConfirm(): void; onCancel(): void }) {
  if (!open) return null;
  return (
    <div className="a-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="a-modal__box">
        <h3 id="confirm-title">{title}</h3>
        <div className="a-modal__body">{body}</div>
        <div className="a-modal__actions">
          <button type="button" className="a-btn" onClick={onCancel} autoFocus>
            Annuler
          </button>
          <button type="button" className="a-btn a-btn--danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
