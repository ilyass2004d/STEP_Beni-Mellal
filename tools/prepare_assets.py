"""Prepare web assets for the STEP Béni Mellal site.

Run from the `site/` folder:
    python tools/prepare_assets.py

Requires: pillow, pillow-heif, imageio-ffmpeg (pip install pillow pillow-heif imageio-ffmpeg)
Source files are read from the parent project folder (D:/STEP Beni Mellal) and
written to site/public/media and site/public/models. Re-running overwrites outputs.
"""
import json
import os
import pathlib
import shutil
import subprocess

import imageio_ffmpeg
import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()

SITE = pathlib.Path(__file__).resolve().parents[1]
ROOT = SITE.parent
PUBLIC = SITE / 'public'
MEDIA = PUBLIC / 'media'

def find_video() -> pathlib.Path:
    """Source clip: $STEPBM_VIDEO, else the first .mp4 at the root of the project folder."""
    if os.environ.get('STEPBM_VIDEO'):
        return pathlib.Path(os.environ['STEPBM_VIDEO'])
    found = sorted(ROOT.glob('*.mp4'))
    if not found:
        raise SystemExit('Aucune vidéo source : placez un .mp4 à la racine du projet ou définissez STEPBM_VIDEO.')
    return found[0]


# Only the first 3.3 s of the source clip are used (tap, then sewer).
CLIPS = {
    'hero-origine': (0.0, 3.30),   # tap -> sewer
    'ch01-robinet': (0.0, 1.55),
    'ch02-reseau': (2.10, 3.30),
}

PHOTO_DIR = ROOT / 'STEPBM' / 'Photos'
PHOTOS = {
    'entree': '0300', 'synoptique': '0310',
    'degrillage': '0316', 'degrillage-benne': '0319', 'dessableur': '0338',
    'classificateur': '0335', 'arrivee': '0330',
    'bassins-anaerobies': '0347', 'bassins-anaerobies-2': '0340',
    'lits-exterieur': '0303', 'lits-garnissage': '0388',
    'fosse-vannes': '0381',
    'clarificateur': '0377', 'clarificateur-2': '0378', 'clarificateur-deversoir': '0417',
    'maturation': '0354', 'maturation-2': '0352',
    'analyseurs': '0425', 'analyseur-ecran': '0426',
    'tertiaire-bassins': '0444', 'tertiaire-canal': '0455', 'tertiaire-galerie': '0458',
    'uv': '0454', 'centre-controle': '0485', 'supervision': '0489',
    'labo-echantillons': '0405', 'labo-instruments': '0408', 'batiments': '0479',
}

STEPS = ROOT / 'Rendus_STEP_BM' / 'Images_etapes_conversation'
OUT = ROOT / 'Claude outputs'
RENDERS = {
    'vue-filiere': ROOT / 'Rendus_STEP_BM' / 'Rendus_HQ' / '03_HQ_02_Filiere_traitement.png',
    'vue-aerienne': ROOT / 'Rendus_STEP_BM' / 'Rendus_HQ' / '02_HQ_01_Vue_aerienne_globale.png',
    'lagunes': ROOT / 'Exports_2026-10-21' / 'Rendus' / '03_Lagunes_bassins.png',
    'lagune': OUT / 'Camera_lagune_v3.png',
    'lits-bacteriens': ROOT / 'Rendus_STEP_BM' / 'Rendus_HQ' / '01_Lits_bacteriens.png',
    'clarificateur': STEPS / '14_clarificateur_detail_v1.png',
    'bassins-decantation': STEPS / '25_bassins_decantation_v5.png',
    'filtration': STEPS / '45_filtration_coagulation_v3.png',
    'station-pompage': STEPS / '33_station_pompage_v3.png',
    'zone-uv': STEPS / '53_zone_uv_v2.png',
    'chambre-pompes': STEPS / '51_chambre_pompes_ext_v1.png',
    'sechage': STEPS / '77_sechage_v2.png',
    'centre-controle': STEPS / '16_centre_controle_v1b.png',
    'fosse-vannes': STEPS / '11_fosse_vannes_v1.png',
    'eau-sale': STEPS / '37_eau_sale_lavage_v1b.png',
    'cuves': STEPS / '63_cuves_blocs_v1.png',
    'batiments': STEPS / '56_blocs_terracotta_v1.png',
}

MODEL_DIR = ROOT / 'Exports_STEPBM_2026-10-28' / '04_Site_Web_3D'


def save_webp(im: Image.Image, dest: pathlib.Path, widths, quality=78):
    dest.parent.mkdir(parents=True, exist_ok=True)
    for w in widths:
        copy = im.copy()
        if copy.width > w:
            copy = copy.resize((w, round(copy.height * w / copy.width)), Image.LANCZOS)
        copy.save(dest.with_name(f'{dest.name}-{w}.webp'), 'WEBP', quality=quality, method=6)


def images():
    for key, num in PHOTOS.items():
        src = next(PHOTO_DIR.glob(f'IMG_{num}.*'))
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        save_webp(im, MEDIA / 'photos' / key, (1600, 800))
        print('photo', key, src.name, im.size)
    for key, src in RENDERS.items():
        im = Image.open(src).convert('RGB')
        save_webp(im, MEDIA / 'renders' / key, (2000, 1000), quality=80)
        print('render', key, src.name, im.size)


def video():
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    video_src = find_video()
    out = MEDIA / 'video'
    out.mkdir(parents=True, exist_ok=True)
    for key, (a, b) in CLIPS.items():
        mp4 = out / f'{key}.mp4'
        subprocess.run([ff, '-y', '-loglevel', 'error', '-ss', str(a), '-to', str(b), '-i', str(video_src),
                        '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', str(mp4)], check=True)
        poster = out / f'{key}.jpg'
        subprocess.run([ff, '-y', '-loglevel', 'error', '-ss', str(a + 0.2), '-i', str(video_src),
                        '-frames:v', '1', '-q:v', '4', str(poster)], check=True)
        im = Image.open(poster).convert('RGB')
        im.save(out / f'{key}.webp', 'WEBP', quality=75)
        poster.unlink()
        print('clip', key, mp4.stat().st_size)


def models():
    dest = PUBLIC / 'models'
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(MODEL_DIR / 'modeles', dest / 'modeles')
    manifest = json.loads((MODEL_DIR / 'manifest.json').read_text(encoding='utf8'))
    (dest / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf8')
    draco = SITE / 'node_modules' / 'three' / 'examples' / 'jsm' / 'libs' / 'draco' / 'gltf'
    shutil.copytree(draco, PUBLIC / 'draco', dirs_exist_ok=True, ignore=shutil.ignore_patterns('draco_encoder.js'))
    print('models', len(manifest['parties']), 'parts')


if __name__ == '__main__':
    images()
    video()
    models()
