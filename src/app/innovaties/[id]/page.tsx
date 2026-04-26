'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  WishlistItem,
  ROADMAP_PHASE_LABELS,
  ROADMAP_PHASE_DESCRIPTIONS,
  USER_GROUP_LABELS,
  USER_GROUP_DESCRIPTIONS,
  SENTIMENT_EMOJI,
} from '@/lib/types';
import SiteHeader from '@/components/SiteHeader';
import PhaseTracker from '@/components/PhaseTracker';

export default function InnovatieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<WishlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch('/api/wishlist?track=roadmap&visibility=public')
      .then((res) => res.json())
      .then((data: WishlistItem[]) => {
        if (!Array.isArray(data)) {
          setNotFound(true);
          return;
        }
        const found = data.find((i) => i.id === id) || null;
        if (!found) {
          setNotFound(true);
        } else {
          setItem(found);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader
        title="Innovatie"
        subtitle="Detailpagina"
        back={{ href: '/innovaties', label: '← Innovaties' }}
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : notFound || !item ? (
          <div
            className="rounded-lg border p-6"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <p
              className="text-base mb-3"
              style={{ color: 'var(--text)' }}
            >
              Deze innovatie bestaat niet (meer).
            </p>
            <Link
              href="/innovaties"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              ← Terug naar het overzicht
            </Link>
          </div>
        ) : (
          <Detail item={item} />
        )}
      </main>
    </div>
  );
}

function Detail({ item }: { item: WishlistItem }) {
  const phase = item.roadmap_phase || null;
  const isEvaluatie = phase === 'evaluatie';

  return (
    <article
      className="rounded-lg border p-6"
      style={{
        background: 'rgba(128, 0, 0, 0.04)',
        borderLeft: '4px solid var(--primary)',
        borderColor: 'var(--border)',
      }}
    >
      <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <h2
          className="text-2xl"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: 'var(--primary)',
            margin: 0,
          }}
        >
          {item.title}
        </h2>
        {phase && (
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              fontFamily: 'Mulish, sans-serif',
              fontWeight: 600,
            }}
          >
            {ROADMAP_PHASE_LABELS[phase]}
          </span>
        )}
      </header>

      {item.user_groups && item.user_groups.length > 0 && (
        <section className="mb-5">
          <h3
            className="text-sm uppercase tracking-wide mb-2"
            style={{
              fontFamily: 'Mulish, sans-serif',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Voor wie
          </h3>
          <ul className="space-y-1.5 text-sm">
            {item.user_groups.map((g) => (
              <li key={g} style={{ color: 'var(--text)' }}>
                <span
                  className="font-semibold"
                  style={{ color: 'var(--primary)' }}
                >
                  {USER_GROUP_LABELS[g]}
                </span>{' '}
                — {USER_GROUP_DESCRIPTIONS[g]}
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.functional_goal && (
        <section className="mb-5">
          <h3
            className="text-sm uppercase tracking-wide mb-2"
            style={{
              fontFamily: 'Mulish, sans-serif',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Functioneel doel
          </h3>
          <p
            className="text-base"
            style={{ color: 'var(--text)', lineHeight: 1.7 }}
          >
            {item.functional_goal}
          </p>
        </section>
      )}

      {item.description && (
        <section className="mb-5">
          <h3
            className="text-sm uppercase tracking-wide mb-2"
            style={{
              fontFamily: 'Mulish, sans-serif',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Beschrijving
          </h3>
          <div
            className="text-base prose-sm"
            style={{ color: 'var(--text)', lineHeight: 1.8 }}
          >
            <ReactMarkdown>{item.description}</ReactMarkdown>
          </div>
        </section>
      )}

      <section className="mb-5">
        <h3
          className="text-sm uppercase tracking-wide mb-3"
          style={{
            fontFamily: 'Mulish, sans-serif',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          Fase
        </h3>
        <PhaseTracker current={phase} />
        {phase && (
          <p
            className="text-sm mt-3"
            style={{ color: 'var(--text-muted)' }}
          >
            <strong style={{ color: 'var(--primary)' }}>
              {ROADMAP_PHASE_LABELS[phase]}
            </strong>{' '}
            — {ROADMAP_PHASE_DESCRIPTIONS[phase]}
          </p>
        )}
      </section>

      {isEvaluatie && <SatisfactionPanel item={item} />}

      <footer
        className="pt-4 mt-4 border-t flex items-center gap-3 flex-wrap"
        style={{ borderColor: 'var(--border)' }}
      >
        <a
          href="https://www.nederlanders.fr"
          target="_top"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--primary)', textDecoration: 'none' }}
        >
          → Reageer op het forum
        </a>
        <Link
          href="/innovaties"
          className="text-sm hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          ← Alle innovaties
        </Link>
      </footer>
    </article>
  );
}

function SatisfactionPanel({ item }: { item: WishlistItem }) {
  const pos = item.live_satisfaction_positive ?? 0;
  const neu = item.live_satisfaction_neutral ?? 0;
  const neg = item.live_satisfaction_negative ?? 0;
  const total = pos + neu + neg;

  return (
    <section
      className="rounded-md border p-4 mb-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <h3
        className="text-sm uppercase tracking-wide mb-2"
        style={{
          fontFamily: 'Mulish, sans-serif',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}
      >
        Tevredenheid bij gebruik
      </h3>
      {total === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nog geen reacties geregistreerd.
        </p>
      ) : (
        <div
          className="flex items-center gap-6 text-sm"
          style={{ color: 'var(--text)' }}
        >
          <span>
            {SENTIMENT_EMOJI.positive} {pos}
          </span>
          <span>
            {SENTIMENT_EMOJI.neutral} {neu}
          </span>
          <span>
            {SENTIMENT_EMOJI.negative} {neg}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            ({total} totaal)
          </span>
        </div>
      )}
      <p
        className="text-xs mt-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Deze cijfers worden geregistreerd vanuit het gebruik van de tool zelf.
        Op deze pagina zijn ze ter inzage; reageren gebeurt op het forum.
      </p>
    </section>
  );
}
