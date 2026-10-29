import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import published from './content.json';
import type { SiteContent } from './types';

/**
 * Content source abstraction.
 *
 * Today the only implementation is `localDraftStore`: the published content is
 * the bundled content.json, and the admin can keep a *draft* in this browser's
 * localStorage. Nothing is shared between devices. To add a real backend
 * (e.g. Supabase), implement `ContentStore` and swap it in `ContentProvider`.
 */
export interface ContentStore {
  loadDraft(): SiteContent | null;
  saveDraft(content: SiteContent): void;
  clearDraft(): void;
  isPreviewEnabled(): boolean;
  setPreviewEnabled(on: boolean): void;
}

const DRAFT_KEY = 'stepbm.content.draft.v1';
const PREVIEW_KEY = 'stepbm.content.preview';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, quota): draft simply isn't kept */
  }
}

export const localDraftStore: ContentStore = {
  loadDraft() {
    const raw = safeGet(DRAFT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SiteContent;
      return parsed.version === 1 ? parsed : null;
    } catch {
      return null;
    }
  },
  saveDraft(content) {
    safeSet(DRAFT_KEY, JSON.stringify(content));
  },
  clearDraft() {
    safeSet(DRAFT_KEY, null);
  },
  isPreviewEnabled() {
    return safeGet(PREVIEW_KEY) === '1';
  },
  setPreviewEnabled(on) {
    safeSet(PREVIEW_KEY, on ? '1' : null);
  },
};

export const publishedContent = published as SiteContent;

interface ContentContextValue {
  content: SiteContent;
  /** true when the visitor's own browser is showing a local admin draft */
  isDraftPreview: boolean;
  exitPreview(): void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children, store = localDraftStore }: { children: ReactNode; store?: ContentStore }) {
  const [state, setState] = useState(() => {
    const draft = store.isPreviewEnabled() ? store.loadDraft() : null;
    return { content: draft ?? publishedContent, isDraftPreview: Boolean(draft) };
  });

  const exitPreview = useCallback(() => {
    store.setPreviewEnabled(false);
    setState({ content: publishedContent, isDraftPreview: false });
  }, [store]);

  const value = useMemo(() => ({ ...state, exitPreview }), [state, exitPreview]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>');
  return ctx;
}

export function sortedVisibleComponents(content: SiteContent) {
  return content.components.filter((c) => c.visible).sort((a, b) => a.order - b.order);
}
