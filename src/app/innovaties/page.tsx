'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  WishlistItem,
  ROADMAP_PHASES,
  ROADMAP_PHASE_LABELS,
  ROADMAP_PHASE_DESCRIPTIONS,
  RoadmapPhase,
  USER_GROUPS,
  USER_GROUP_LABELS,
  UserGroup,
  SENTIMENT_EMOJI,
} from '@/lib/types';
import SiteHeader from '@/components/SiteHeader';
import PhaseTracker from '@/components/PhaseTracker';

export default function InnovatiesPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPhase, setFilterPhase] = useState<'all' | RoadmapPhase>('all');
  const [filterGroup, setFilterGroup] = useState<'all' | UserGroup>('all');

  useEffect(() => {
    fetch('/api/wishlist?track=roadmap&visibility=public')
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    if (filterPhase !== 'all' && item.roadmap_phase !== filterPhase)
      return false;
    if (filterGroup !== 'all') {
      if (!item.user_groups || !item.user_groups.includes(filterGroup))
        return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader
        title="Innovaties 2025-2026"
        subtitle="Wat wij bouwen — fasering, doelgroep en functioneel doel."
        back={{ href: '/', label: '← Boîte à idées' }}
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
        >
          Hier ziet u waar Communities Abroad aan werkt: bestaande tools,
          lopende projecten en plannen in voorbereiding. Per innovatie zijn
          vermeld: voor welke gebruikers het bedoeld is, wat het functionele
          doel is, en in welke fase het zich bevindt. Inhoudelijke vragen of
          opmerkingen? Reageer op het forum.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={filterPhase}
            onChange={(e) =>
              setFilterPhase(e.target.value as 'all' | RoadmapPhase)
            }
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'Mulish, sans-serif',
            }}
          >
            <option value="all">Alle fases</option>
            {ROADMAP_PHASES.map((p) => (
              <option key={p} value={p}>
                {ROADMAP_PHASE_LABELS[p]}
              </option>
            ))}
          </select>

          <select
            value={filterGroup}
            onChange={(e) =>
              setFilterGroup(e.target.value as 'all' | UserGroup)
            }
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'Mulish, sans-serif',
            }}
          >
            <option value="all">Alle gebruikersgroepen</option>
            {USER_GROUPS.map((g) => (
              <option key={g} value={g}>
                {USER_GROUP_LABELS[g]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            Geen innovaties gevonden voor dit filter.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <InnovationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function InnovationCard({ item }: { item: WishlistItem }) {
  const phase = item.roadmap_phase || null;
  const isEvaluatie = phase === 'evaluatie';

  return (
    <article
      className="rounded-lg border p-5"
      style={{
        background: 'rgba(128, 0, 0, 0.04)',
        borderLeft: '4px solid var(--primary)',
        borderColor: 'var(--border)',
      }}
    >
      <header className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <h2
          className="text-lg"
          style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--primary)' }}
        >
          {item.title}
        </h2>
        {phase && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              fontFamily: 'Mulish, sans-serif',
              fontWeight: 600,
            }}
            title={ROADMAP_PHASE_DESCRIPTIONS[phase]}
          >
            {ROADMAP_PHASE_LABELS[phase]}
          </span>
        )}
      </header>

      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-1 mb-3 text-sm">
        {item.user_groups && item.user_groups.length > 0 && (
          <>
            <dt
              className="font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Voor:
            </dt>
            <dd className="flex flex-wrap gap-1">
              {item.user_groups.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {USER_GROUP_LABELS[g]}
                </span>
              ))}
            </dd>
          </>
        )}
        {item.functional_goal && (
          <>
            <dt
              className="font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Doel:
            </dt>
            <dd style={{ color: 'var(--text)' }}>{item.functional_goal}</dd>
          </>
        )}
      </dl>

      {item.description && (
        <div
          className="text-sm mb-4 prose-sm"
          style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
        >
          <ReactMarkdown>{item.description}</ReactMarkdown>
        </div>
      )}

      <div className="my-4">
        <PhaseTracker current={phase} />
      </div>

      {isEvaluatie && (
        <SatisfactionSummary item={item} />
      )}

      <footer className="flex items-center gap-3 flex-wrap pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href={`/innovaties/${item.id}`}
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          → Detailpagina
        </Link>
        {item.forum_url && (
          <a
            href={item.forum_url}
            target="_top"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            → Reageer op het forum
          </a>
        )}
      </footer>
    </article>
  );
}

function SatisfactionSummary({ item }: { item: WishlistItem }) {
  const pos = item.live_satisfaction_positive ?? 0;
  const neu = item.live_satisfaction_neutral ?? 0;
  const neg = item.live_satisfaction_negative ?? 0;
  const total = pos + neu + neg;
  if (total === 0) return null;

  return (
    <div
      className="rounded-md border p-3 mb-3 text-xs"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="font-medium mb-1"
        style={{ color: 'var(--text-muted)', fontFamily: 'Mulish, sans-serif' }}
      >
        Tevredenheid bij gebruik ({total} reacties):
      </div>
      <div
        className="flex items-center gap-3"
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
      </div>
    </div>
  );
}
