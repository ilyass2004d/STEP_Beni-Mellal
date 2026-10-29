export function Footer({ signature }: { signature: string }) {
  return (
    <footer className="footer" data-tone="dark">
      <div className="footer__inner">
        <p className="footer__brand">
          STEP <em>Béni Mellal</em>
        </p>
        <p className="footer__sign">{signature}</p>
        <p className="footer__note">
          Présentation pédagogique et visuelle, qui ne se substitue pas à la documentation officielle de la station.
        </p>
        <a className="footer__top" href="#accueil">
          Haut de page ↑
        </a>
      </div>
    </footer>
  );
}
