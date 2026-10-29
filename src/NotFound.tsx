export function NotFound() {
  return (
    <main className="not-found" data-tone="dark">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="section-title">
        Ce chemin ne mène <em>nulle part.</em>
      </h1>
      <p className="section-lead">La page demandée n'existe pas ou a été déplacée.</p>
      <a className="btn btn--primary" href={import.meta.env.BASE_URL}>
        Revenir à l'accueil
      </a>
    </main>
  );
}
