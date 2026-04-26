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
    // Ning rendert de eigen profile-URL in de header bij ingelogde gebruikers.
    try {
      // Voorkeur voor account-widget
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

  function postUserToIframes() {
    var user = getNingUser();
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try {
        // We sturen naar elke iframe; alleen de Boîte luistert ernaar
        // en doet zelf de origin-check.
        iframes[i].contentWindow.postMessage(
          { type: 'ning-user', user: user },
          '*'
        );
      } catch (e) {}
    }
  }

  // Stuur direct, en nogmaals na 500ms en 2000ms voor het geval
  // de iframe iets later laadt.
  if (document.readyState === 'complete') {
    postUserToIframes();
  } else {
    window.addEventListener('load', postUserToIframes);
  }
  setTimeout(postUserToIframes, 500);
  setTimeout(postUserToIframes, 2000);

  // Als de iframe expliciet vraagt om de user (bv. na late hydratie),
  // sturen we 'm direct.
  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.type === 'ning-user-request') {
      postUserToIframes();
    }
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
