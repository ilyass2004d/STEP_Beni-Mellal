/**
 * Central inventory of the media used by the site: what each file is, where it
 * comes from and what role it plays. Regenerate the files with
 * `npm run assets` (tools/prepare_assets.py). Shown in /admin → Médias.
 */
export type AssetStatus = 'reel' | 'rendu' | 'illustration' | 'manquant';

export interface AssetEntry {
  path: string;
  role: string;
  status: AssetStatus;
  origin: string;
}

const PHOTO_ORIGIN = 'STEPBM/Photos, visite du 10/12/2025';

export const ASSETS: AssetEntry[] = [
  { path: '/media/video/hero-origine.mp4', role: "Fond vidéo de l'écran d'ouverture (robinet → réseau)", status: 'illustration', origin: 'Vidéo source du projet, 0 à 3,3 s' },
  { path: '/media/video/ch01-robinet.mp4', role: 'Chapitre 01 : À l’origine', status: 'illustration', origin: 'Vidéo source du projet, 0 à 1,55 s' },
  { path: '/media/video/ch02-reseau.mp4', role: 'Chapitre 02 : Sous la ville', status: 'illustration', origin: 'Vidéo source du projet, 2,1 à 3,3 s' },
  { path: '/media/renders/vue-filiere', role: 'Chapitre 03 : révélation de la station', status: 'rendu', origin: 'Rendus_STEP_BM/Rendus_HQ/03_HQ_02_Filiere_traitement.png' },
  { path: '/media/renders/vue-aerienne', role: 'Repli statique de la maquette 3D (sans WebGL)', status: 'rendu', origin: 'Rendus_STEP_BM/Rendus_HQ/02_HQ_01_Vue_aerienne_globale.png' },
  { path: '/media/renders/<ouvrage>', role: 'Rendu de chaque ouvrage dans sa fiche', status: 'rendu', origin: 'Rendus_STEP_BM/Images_etapes_conversation, Rendus_HQ, Exports_2026-10-21/Rendus' },
  { path: '/media/photos/<ouvrage>', role: 'Documentation visuelle des fiches ouvrages', status: 'reel', origin: PHOTO_ORIGIN },
  { path: '/media/photos/synoptique', role: 'Schéma de la filière (prétraitement) et source', status: 'reel', origin: `${PHOTO_ORIGIN}, IMG_0310` },
  { path: '/media/photos/labo-echantillons', role: 'Chapitre 05 : Après le traitement', status: 'reel', origin: `${PHOTO_ORIGIN}, IMG_0405` },
  { path: '/models/manifest.json', role: 'Liste des pièces de la maquette, boîtes englobantes (m)', status: 'rendu', origin: 'Exports_STEPBM_2026-10-28/04_Site_Web_3D' },
  { path: '/models/modeles/*.glb', role: 'Maquette 3D, une pièce par fichier (Draco)', status: 'rendu', origin: 'Exports_STEPBM_2026-10-28/04_Site_Web_3D/modeles' },
  { path: '/draco/', role: 'Décodeur Draco servi localement', status: 'rendu', origin: 'three/examples/jsm/libs/draco/gltf' },
  { path: '/media/photos/lits-sechage', role: 'Photographie des lits de séchage', status: 'manquant', origin: 'À identifier parmi les photos de visite (IMG_0311 à 0314 ?)' },
  { path: '/media/photos/eau-sale-lavage', role: 'Photographie du bassin des eaux sales de lavage', status: 'manquant', origin: 'À fournir' },
  { path: '/media/photos/chambre-pompes', role: 'Photographie de la chambre des pompes', status: 'manquant', origin: 'À fournir' },
  { path: '/media/photos/cuves', role: 'Photographie des cuves (sans personnes identifiables)', status: 'manquant', origin: 'À fournir' },
  { path: '/media/video/ch05-*.mp4', role: 'Chapitre 05 : séquence réelle ou vérifiée (facultatif)', status: 'manquant', origin: 'À fournir' },
  { path: 'Logos institutionnels', role: 'Crédits, partenaires', status: 'manquant', origin: 'À fournir avec autorisation' },
];
