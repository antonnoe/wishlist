// Inline script dat top-level toegang naar de Vercel-deployment
// detecteert en doorstuurt naar de Ning-pagina waar de iframe in zit.
// Wordt server-rendered in <head> zodat de redirect plaatsvindt vóór
// React hydrateert — geen flash van content.
//
// Geen redirect bij:
//   - localhost (lokale dev)
//   - Vercel preview-URLs (`wishlist-git-*`) — ik moet die kunnen testen
//   - /admin (Anton logt daar direct in, niet via iframe)

const REDIRECT_TARGET = 'https://www.nederlanders.fr/boite-a-idees';

export default function FrameOnlyRedirect() {
  const script = `
(function(){
  try {
    var h = location.hostname;
    var p = location.pathname;
    var isLocal = h === 'localhost' || h === '127.0.0.1';
    var isPreview = h.indexOf('wishlist-git-') === 0;
    var isAdmin = p.indexOf('/admin') === 0;
    if (!isLocal && !isPreview && !isAdmin && window.self === window.top) {
      location.replace(${JSON.stringify(REDIRECT_TARGET)});
    }
  } catch (e) { /* fail-open: zelden, maar nooit een fout opwerpen die de pagina sloopt */ }
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
