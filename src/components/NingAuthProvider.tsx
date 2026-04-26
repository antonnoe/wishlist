'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Origin van de Ning-host. Berichten van andere origins worden genegeerd.
const NING_ORIGIN = 'https://nederlandersfr.ning.com';

// Stel hoe lang we wachten op een postMessage van Ning voordat we
// "niet ingelogd" tonen. Houd kort genoeg dat de UI niet aanvoelt
// als hangende, lang genoeg dat trage Ning-laadtijden gevangen zijn.
const AUTH_TIMEOUT_MS = 2500;

export type NingUser = {
  username: string;
  fullName?: string;
};

type NingAuthValue = {
  user: NingUser | null;
  loading: boolean;
  // gateEnabled = staan we op "alleen ingelogd"-stand of op "iedereen"?
  // Wordt server-side bepaald via env-var en client-side ook getoond
  // zodat UI consistent reageert.
  gateEnabled: boolean;
};

const NingAuthContext = createContext<NingAuthValue>({
  user: null,
  loading: true,
  gateEnabled: false,
});

export function NingAuthProvider({
  children,
  gateEnabled,
}: {
  children: React.ReactNode;
  gateEnabled: boolean;
}) {
  const [user, setUser] = useState<NingUser | null>(null);
  // Lazy init: zonder gate is loading direct false (geen wachten op
  // postMessage). Met gate beginnen we wel met loading=true en wachten
  // tot postMessage of timeout het uitschakelt.
  const [loading, setLoading] = useState(gateEnabled);

  useEffect(() => {
    if (!gateEnabled) return;

    function handleMessage(e: MessageEvent) {
      // Strikte origin-check — bericht moet van Ning komen.
      if (e.origin !== NING_ORIGIN) return;
      const data = e.data as { type?: string; user?: NingUser | null };
      if (!data || data.type !== 'ning-user') return;
      setUser(data.user ?? null);
      setLoading(false);
    }

    window.addEventListener('message', handleMessage);

    // Vraag actief aan parent (Ning-pagina) om de gebruiker — voor het
    // geval het Ning-script al klaar was voor onze listener er was.
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'ning-user-request' }, NING_ORIGIN);
      }
    } catch {
      /* cross-origin restrictions zijn ok, parent stuurt vanzelf */
    }

    // Fallback: na timeout stoppen we met laden, zodat UI iets toont.
    const timeout = window.setTimeout(() => setLoading(false), AUTH_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.clearTimeout(timeout);
    };
  }, [gateEnabled]);

  const value = useMemo<NingAuthValue>(
    () => ({ user, loading, gateEnabled }),
    [user, loading, gateEnabled]
  );

  return (
    <NingAuthContext.Provider value={value}>
      {children}
    </NingAuthContext.Provider>
  );
}

export function useNingAuth() {
  return useContext(NingAuthContext);
}

// Geeft een user_id terug dat de API kan gebruiken. Bij ingelogde
// Ning-gebruiker krijgt deze het prefix `ning_` (geen botsing met
// anonieme `user_xxx`-IDs uit localStorage). Wanneer de gate uit
// staat valt dit terug op de bestaande anonieme localStorage-flow.
export function ningUserIdOrNull(user: NingUser | null): string | null {
  if (!user || !user.username) return null;
  return 'ning_' + user.username;
}
