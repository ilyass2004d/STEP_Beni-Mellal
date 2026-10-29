import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/source-sans-3/wght.css';
import '@fontsource-variable/source-sans-3/wght-italic.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { ContentProvider } from './content/store';
import { NotFound } from './NotFound';

const Admin = lazy(() => import('./admin/Admin'));

/**
 * The admin only edits a draft stored in this browser, but it is still kept out
 * of public builds unless explicitly enabled (VITE_ENABLE_ADMIN=true).
 */
export const ADMIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true';

function Root() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return <App />;
  if (path === '/admin' && ADMIN_ENABLED)
    return (
      <Suspense fallback={<p className="admin-loading">Chargement de l'administration…</p>}>
        <Admin />
      </Suspense>
    );
  return <NotFound />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContentProvider>
      <Root />
    </ContentProvider>
  </StrictMode>,
);
