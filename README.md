# STEP de Béni Mellal · L'eau en devenir

Site immersif présentant la station d'épuration des eaux usées de Béni Mellal : récit au défilement, explorateur 3D de la maquette, fiches des ouvrages et administration du contenu.

Maquette 3D et conception de l'expérience numérique : Ilyass Zerqtouni.

Version 0.1, première version complète (octobre 2026).

## Démarrer

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5173  (admin : http://localhost:5173/admin)
npm run build      # vérification TypeScript + build dans dist/
npm run preview    # sert dist/ sur http://localhost:4173
```

Tous les médias nécessaires (`public/media`, `public/models`, `public/draco`) sont inclus dans le dépôt : le site fonctionne directement après `npm install`.

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque envoi sur la branche `main`.

1. Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions** (une seule fois).
2. Envoyer les fichiers sur `main`, ou relancer le workflow depuis l'onglet **Actions**.
3. Le site est publié à l'adresse `https://<utilisateur>.github.io/<nom-du-dépôt>/`.

Le chemin du dépôt est pris en compte automatiquement (`--base`). Pour un autre hébergeur servi à la racine du domaine (Netlify, Vercel…), un simple `npm run build` suffit : publier le dossier `dist/`.

### Régénérer les médias (facultatif)

`tools/prepare_assets.py` reconstruit les médias à partir des fichiers de travail (photos HEIC, rendus Blender, exports GLB, vidéo source). Ces fichiers ne font pas partie du dépôt : le script s'attend à ce que le dépôt soit placé dans le dossier de travail du projet.

```bash
pip install pillow pillow-heif imageio-ffmpeg
npm run assets     # = python tools/prepare_assets.py
```

## Structure

```
src/
  content/
    content.json        tout le contenu éditable (chapitres, ouvrages, sources, crédits, sections)
    types.ts            modèle de données
    store.tsx           contenu publié + brouillon local (interface ContentStore)
    media.ts            résolution des médias (WebP responsive, imports idb:)
    assetManifest.ts    inventaire des médias : rôle, nature, origine, manquants
  three/
    StepViewer.ts       moteur Three.js : chargement Draco, sélection, surbrillance, caméra, nettoyage
    manifest.ts         lecture de public/models/manifest.json, couches de contexte
  components/           sections de la page (Hero, Narrative, Explorer, Ouvrages, After, About…)
  admin/                interface d'administration (chargée à la demande)
tools/prepare_assets.py découpe vidéo, conversion HEIC/PNG → WebP, copie des GLB et du décodeur Draco
```

## Maquette 3D

`public/models/modeles/*.glb` : une pièce par fichier (export du 28/10/2026, compression Draco, 1 unité = 1 m, Y vers le haut). Chaque ouvrage du contenu déclare ses pièces dans `modelParts` ; la sélection se fait au niveau de la pièce, pas de l'objet Blender individuel. Les couches de contexte (voirie, végétation, enceinte…) sont listées dans `CONTEXT_LAYERS`.

La végétation (≈ 1,7 M triangles) est chargée en dernier et désactivée par défaut sur petit écran.

## Contenu et administration

- `/admin` n'existe qu'en développement, ou si `VITE_ENABLE_ADMIN=true` au build.
- Les modifications sont un **brouillon local** (localStorage du navigateur) : rien n'est publié ni partagé entre appareils.
- Publier : Admin → « Publier / données » → *Exporter content.json* → remplacer `src/content/content.json` → `npm run build`.
- Les images importées dans l'admin restent dans le navigateur (IndexedDB, `idb:…`) : copiez-les dans `public/media/` et remplacez leurs chemins avant d'exporter.

### Brancher un vrai backend (ex. Supabase)

1. Implémenter l'interface `ContentStore` (`src/content/store.tsx`) : lecture du contenu publié, écriture des brouillons.
2. Stocker les médias dans un bucket (Supabase Storage) et enregistrer leurs URL publiques dans `src`.
3. Protéger l'écriture par une authentification (Supabase Auth + Row Level Security) ; ne jamais mettre de clé `service_role` dans le frontend.

## Règles éditoriales

- Seules deux sources décrivent la STEP de Béni Mellal : le synoptique de la station (photo IMG_0310) et le rapport de visite FST 2025-2026. Les autres rapports du dossier `STEPBM/` concernent la **STEP de Marrakech** et ne doivent pas être utilisés.
- Chaque média porte sa nature : photographie, rendu de la maquette, document, illustration.
- Les séquences vidéo d'ambiance servent d'illustration (ouverture, chapitres 01 et 02). La partie du clip source montrant une station fictive et une oliveraie n'est pas utilisée.
- Chaque fiche indique son niveau de documentation (documenté / partiel / à documenter).
