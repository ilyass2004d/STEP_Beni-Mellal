import type { MediaRef, SiteContent, StepComponent } from '../content/types';

export type Errors = Record<string, string>;

function media(prefix: string, m: MediaRef | undefined, errors: Errors) {
  if (!m) return;
  if (!m.src.trim()) errors[`${prefix}.src`] = 'Chemin requis (ou retirez ce média).';
  if (!m.alt.trim()) errors[`${prefix}.alt`] = 'Texte alternatif requis pour l’accessibilité.';
}

export function validateComponent(c: StepComponent, all: StepComponent[], originalId: string | null, knownParts: string[] | null): Errors {
  const e: Errors = {};
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) e.id = 'Minuscules, chiffres et tirets uniquement (ex. lits-bacteriens).';
  else if (all.some((x) => x.id === c.id && x.id !== originalId)) e.id = 'Cet identifiant existe déjà.';
  if (!c.name.trim()) e.name = 'Nom requis.';
  if (!c.shortDescription.trim()) e.shortDescription = 'Une courte description est requise.';
  if (!Number.isFinite(c.order)) e.order = 'Nombre requis.';
  if (knownParts) {
    const unknown = c.modelParts.filter((p) => !knownParts.includes(p));
    if (unknown.length) e.modelParts = `Pièces inconnues dans la maquette : ${unknown.join(', ')}`;
  }
  c.photos.forEach((m, i) => media(`photos.${i}`, m, e));
  media('render', c.render, e);
  media('diagram', c.diagram, e);
  media('video', c.video, e);
  c.parameters.forEach((p, i) => {
    if (!p.label.trim() || !p.value.trim()) e[`parameters.${i}`] = 'Libellé et valeur requis.';
  });
  return e;
}

/** Structural check for an imported JSON file. Returns an error message or null. */
export function checkContentShape(x: unknown): string | null {
  const c = x as Partial<SiteContent>;
  if (!c || typeof c !== 'object') return 'Le fichier ne contient pas un objet JSON.';
  if (c.version !== 1) return 'Version de contenu non reconnue (attendu : 1).';
  for (const key of ['hero', 'chapters', 'stages', 'components', 'facts', 'sources', 'about', 'sections'] as const) {
    if (!(key in c)) return `Champ manquant : ${key}.`;
  }
  if (!Array.isArray(c.components) || !Array.isArray(c.chapters)) return 'components et chapters doivent être des listes.';
  const bad = c.components.find((s) => !s || typeof s.id !== 'string' || typeof s.name !== 'string' || !Array.isArray(s.modelParts) || !Array.isArray(s.photos));
  if (bad) return `Ouvrage invalide : ${JSON.stringify(bad).slice(0, 80)}…`;
  return null;
}

export function localMediaRefs(c: SiteContent): string[] {
  return [...JSON.stringify(c).matchAll(/"(idb:[a-z0-9]+)"/g)].map((m) => m[1]);
}
