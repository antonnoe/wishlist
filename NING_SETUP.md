# Ning-koppeling — installatie

Voor de "alleen leden kunnen reageren"-functie heeft de Boîte twee dingen
nodig: (1) een env-var op Vercel die de gate aanzet, en (2) een klein
JavaScript-snippet in jouw Ning aangepaste-code-veld dat de ingelogde
gebruiker doorgeeft aan de iframe.

## Stap 1 — Env-var op Vercel

In het Vercel-dashboard van het `wishlist`-project:

1. Settings → Environment Variables
2. Naam: `NEXT_PUBLIC_NING_GATE`
3. Waarde: `true`
4. Environments: alleen **Production** aanvinken (niet Preview/Development)
5. Save

De volgende productie-deploy past de gate toe. Wil je 'm uitzetten? Zet de
waarde op `false` (of verwijder de variable) en deploy opnieuw.

## Stap 2 — Custom-code-snippet op Ning

In jouw Ning admin: **Aangepaste code** (waar Google Analytics ook staat).

Voeg het onderstaande blok toe **onder** je bestaande code. Je bestaande
script (Google Analytics + iframe-height-listener) blijft intact.

```html
<script>
(function () {
  // Alleen iframes met deze URL-substring krijgen de username. Voorkomt
  // dat third-party widgets (bv. embed-spelers, advertenties) onnodig
  // naam-data ontvangen. Pas aan als jouw productie-URL anders is.
  var BOITE_HOST_PATTERNS = [/\.vercel\.app$/i];

  function isBoiteIframe(iframe) {
    try {
      var src = iframe.getAttribute('src') || '';
      if (!src) return false;
      var url = new URL(src, location.href);
      for (var i = 0; i < BOITE_HOST_PATTERNS.length; i++) {
        if (BOITE_HOST_PATTERNS[i].test(url.hostname)) return true;
      }
    } catch (e) {}
    return false;
  }

  // Detecteer ingelogde Ning-gebruiker via meerdere methoden.
  function getNingUser() {
    // Methode 1: Ning's eigen JS-API (xn.currentUser)
    try {
      if (window.xn && window.xn.currentUser && window.xn.currentUser.screenName) {
        return {
          username: window.xn.currentUser.screenName,
          fullName: window.xn.currentUser.fullName || window.xn.currentUser.screenName
        };
      }
    } catch (e) {}

    // Methode 2: legacy globals (_NING_PROFILE_)
    try {
      if (window._NING_PROFILE_ && window._NING_PROFILE_.screen_name) {
        return {
          username: window._NING_PROFILE_.screen_name,
          fullName: window._NING_PROFILE_.full_name || window._NING_PROFILE_.screen_name
        };
      }
    } catch (e) {}

    // Methode 3: DOM-scraping — zoek profile-link in account-menu.
    try {
      var widget = document.querySelector('#xj_module_account, .xg_widget_main_account, [data-component*="account"]');
      var scope = widget || document;
      var anchors = scope.querySelectorAll('a[href*="/profile/"]');
      for (var i = 0; i < anchors.length; i++) {
        var href = anchors[i].getAttribute('href') || '';
        var m = href.match(/\/profile\/([^\/?#]+)/);
        if (m && m[1] && m[1] !== 'edit') {
          return {
            username: m[1],
            fullName: (anchors[i].textContent || '').trim() || m[1]
          };
        }
      }
    } catch (e) {}

    return null;
  }

  function postUserToBoite() {
    var user = getNingUser();
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      if (!isBoiteIframe(iframe)) continue;
      try {
        // Specifieke targetOrigin (de iframe-eigen origin) i.p.v. '*':
        // hierdoor lekt de username niet als de iframe-src tijdens
        // navigation verandert.
        var src = iframe.getAttribute('src') || '';
        var origin = new URL(src, location.href).origin;
        iframe.contentWindow.postMessage(
          { type: 'ning-user', user: user },
          origin
        );
      } catch (e) {}
    }
  }

  // Initial broadcast na load + retries voor late iframe-laadtijd.
  if (document.readyState === 'complete') {
    postUserToBoite();
  } else {
    window.addEventListener('load', postUserToBoite);
  }
  setTimeout(postUserToBoite, 500);
  setTimeout(postUserToBoite, 2000);

  // Reageer op verzoeken van de iframe — maar alleen als origin matcht
  // (anders kan een third-party iframe op de Ning-pagina actief de
  // user-data opvragen).
  window.addEventListener('message', function (e) {
    if (!e || !e.data || e.data.type !== 'ning-user-request') return;
    try {
      var originHost = new URL(e.origin).hostname;
      var ok = false;
      for (var i = 0; i < BOITE_HOST_PATTERNS.length; i++) {
        if (BOITE_HOST_PATTERNS[i].test(originHost)) { ok = true; break; }
      }
      if (!ok) return;
    } catch (err) {
      return;
    }
    postUserToBoite();
  });
})();
</script>
```

Klaar. Bewaar het, ververs de Ning-pagina met de iframe en de Boîte
herkent je als ingelogde gebruiker.

## Stap 3 — Testen

1. **Niet-ingelogd** (open een privé-venster): de Boîte toont een
   slot-banner "Log in op nederlanders.fr". Smileys grijs en
   indien-knop disabled.
2. **Ingelogd**: smileys werken, het indien-formulier vult forumnaam
   automatisch in en die is niet meer aan te passen.

## Wat te doen als het niet werkt

- **Iedereen ziet altijd de slot-banner**: Methode 1 en 2 vonden niets,
  Methode 3 (DOM-scraping) faalt op jouw Ning-skin. Vraag mij dan; ik
  pas de selectors aan.
- **Vercel-deploy nog niet klaar**: kort wachten, daarna pagina herladen.
- **Wel ingelogd maar gate doet niets**: env-var `NEXT_PUBLIC_NING_GATE`
  niet op `true`, of niet in **Production**-environment gezet.

## Kill-switch

Als de detectie ooit stuk blijkt en je iedereen weer wilt laten
reageren: zet `NEXT_PUBLIC_NING_GATE` op `false` in Vercel en redeploy.
De site valt terug op het v1-gedrag (iedereen kan reageren met
getypte forumnaam).
