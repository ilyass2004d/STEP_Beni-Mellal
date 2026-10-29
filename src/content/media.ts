import { useEffect, useState } from 'react';
import type { MediaKind } from './types';

/** Widths produced by tools/prepare_assets.py for each generated folder. */
const GENERATED_WIDTHS: Record<string, number[]> = {
  '/media/photos/': [800, 1600],
  '/media/renders/': [1000, 2000],
};

export const KIND_LABEL: Record<MediaKind, string> = {
  photo: 'Photographie',
  rendu: 'Rendu de la maquette',
  schema: 'Document',
  illustration: 'Illustration',
  video: 'Vidéo',
};

/**
 * Content paths are written from the site root (`/media/...`). When the site is
 * served from a sub-folder (GitHub Pages: /<repo>/), prefix them with Vite's base.
 */
export function withBase(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return import.meta.env.BASE_URL + path.slice(1);
}

export function isVideo(src: string) {
  return /\.(mp4|webm)(\?|$)/i.test(src);
}

export interface ResolvedImage {
  src: string;
  srcSet?: string;
}

/** Turns a content `src` into an <img> src/srcSet. `idb:` refs must go through `useMediaSrc`. */
export function resolveImage(src: string): ResolvedImage {
  for (const [prefix, widths] of Object.entries(GENERATED_WIDTHS)) {
    if (src.startsWith(prefix) && !/\.[a-z0-9]+$/i.test(src)) {
      const base = withBase(src);
      return {
        src: `${base}-${widths[0]}.webp`,
        srcSet: widths.map((w) => `${base}-${w}.webp ${w}w`).join(', '),
      };
    }
  }
  return { src: withBase(src) };
}

/** Poster image for a generated clip: /media/video/x.mp4 -> /media/video/x.webp */
export function posterFor(src: string) {
  return withBase(src).replace(/\.(mp4|webm)$/i, '.webp');
}

// ---------------------------------------------------------------------------
// Images imported from the admin are kept in IndexedDB (this browser only).

const DB_NAME = 'stepbm-media';
const STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putLocalMedia(file: Blob): Promise<string> {
  const db = await openDb();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return `idb:${id}`;
}

async function getLocalMedia(ref: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).get(ref.slice(4));
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => resolve(null);
  });
}

/** Resolves any content src, including `idb:` refs, to something an <img>/<video> can use. */
export function useMediaSrc(src: string | undefined): ResolvedImage | null {
  const [local, setLocal] = useState<{ ref: string; url: string } | null>(null);
  const isLocal = Boolean(src?.startsWith('idb:'));

  useEffect(() => {
    if (!src || !isLocal) return;
    let url: string | null = null;
    let cancelled = false;
    getLocalMedia(src)
      .then((blob) => {
        if (cancelled || !blob) return;
        url = URL.createObjectURL(blob);
        setLocal({ ref: src, url });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, isLocal]);

  if (!src) return null;
  if (isLocal) return local?.ref === src ? { src: local.url } : null;
  return resolveImage(src);
}
