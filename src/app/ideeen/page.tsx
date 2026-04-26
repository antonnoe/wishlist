'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  WishlistItem,
  PlatformItem,
  STATUS_LABELS,
  STATUS_COLORS,
  Status,
  Sentiment,
  SENTIMENT_EMOJI,
} from '@/lib/types';
import SiteHeader from '@/components/SiteHeader';
import PlatformDropdown from '@/components/PlatformDropdown';

export default function IdeeenPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('wishlist_user_id');
      if (!id) {
        id = 'user_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('wishlist_user_id', id);
      }
      return id;
    }
    return 'anonymous';
  });

  const platformLabels: Record<string, string> = {};
  platforms.forEach((p) => {
    platformLabels[p.id] = p.label;
  });

  async function fetchData() {
    try {
      const [itemsRes, platformsRes] = await Promise.all([
        fetch(
          `/api/wishlist?track=idea&visibility=public&user_id=${encodeURIComponent(userId)}`
        ),
        fetch('/api/platforms'),
      ]);
      const itemsData = await itemsRes.json();
      const platformsData = await platformsRes.json();
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setPlatforms(Array.isArray(platformsData) ? platformsData : []);
    } catch (e) {
      console.error('Failed to fetch:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSentiment(itemId: string, sentiment: Sentiment) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const prevSentiment = item.user_sentiment;
        const updated = { ...item };
        if (prevSentiment === 'positive')
          updated.positive_count = Math.max(0, updated.positive_count - 1);
        if (prevSentiment === 'neutral')
          updated.neutral_count = Math.max(0, updated.neutral_count - 1);
        if (prevSentiment === 'negative')
          updated.negative_count = Math.max(0, updated.negative_count - 1);
        if (prevSentiment === sentiment) {
          updated.user_sentiment = null;
        } else {
          updated.user_sentiment = sentiment;
          if (sentiment === 'positive') updated.positive_count += 1;
          if (sentiment === 'neutral') updated.neutral_count += 1;
          if (sentiment === 'negative') updated.negative_count += 1;
        }
        return updated;
      })
    );

    const res = await fetch('/api/wishlist/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wishlist_id: itemId,
        user_id: userId,
        sentiment,
      }),
    });
    if (!res.ok) {
      fetchData();
    }
  }

  const filtered = items.filter((item) => {
    if (filterPlatform !== 'all') {
      if (
        item.platform !== filterPlatform &&
        !item.platform.startsWith(filterPlatform + '.')
      )
        return false;
    }
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const statuses = Object.keys(STATUS_LABELS) as Status[];

  function getPlatformLabel(id: string): string {
    return platformLabels[id] || id;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader
        title="Ideeën"
        subtitle="Wat u wilt — wensen, suggesties en zorgpunten van leden en bezoekers."
        back={{ href: '/', label: '← Boîte à idées' }}
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}
        >
          Reageer met een smiley op ideeën van anderen, of dien uw eigen idee
          in.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <PlatformDropdown
            value={filterPlatform}
            onChange={setFilterPlatform}
            platforms={platforms}
            instanceId="pd-ideeen-filter"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'Mulish, sans-serif',
            }}
          >
            <option value="all">Alle statussen</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <Link
            href="/idee-indienen"
            className="ml-auto rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{
              background: 'var(--primary)',
              fontFamily: 'Mulish, sans-serif',
              textDecoration: 'none',
            }}
          >
            + Idee indienen
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Geen ideeën gevonden.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3
                    className="text-base font-semibold"
                    style={{
                      color: 'var(--text)',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {item.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                {item.description && (
                  <div
                    className="text-sm mb-2 prose-sm overflow-y-auto"
                    style={{
                      color: 'var(--text-muted)',
                      maxHeight: '120px',
                    }}
                  >
                    <ReactMarkdown>{item.description}</ReactMarkdown>
                  </div>
                )}
                {(item.admin_note || item.url) && (
                  <AdminNote
                    note={item.admin_note || null}
                    url={item.url || null}
                  />
                )}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontFamily: 'Mulish, sans-serif',
                    }}
                  >
                    {getPlatformLabel(item.platform)}
                  </span>
                  {item.created_by &&
                    item.created_by !== 'admin' &&
                    item.created_by !== 'anonymous' &&
                    !item.created_by.startsWith('user_') && (
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        door {item.created_by}
                      </span>
                    )}
                </div>

                <SentimentBar item={item} onSentiment={handleSentiment} />

                {item.forum_url && (
                  <a
                    href={item.forum_url}
                    target="_top"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-sm hover:underline"
                    style={{ color: 'var(--primary)', fontFamily: 'Mulish, sans-serif' }}
                  >
                    → Reageer op het forum
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SentimentBar({
  item,
  onSentiment,
}: {
  item: WishlistItem;
  onSentiment: (id: string, s: Sentiment) => void;
}) {
  const options: { key: Sentiment; count: number }[] = [
    { key: 'positive', count: item.positive_count },
    { key: 'neutral', count: item.neutral_count },
    { key: 'negative', count: item.negative_count },
  ];

  return (
    <div
      className="flex items-center gap-2 pt-2 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      {options.map(({ key, count }) => {
        const isActive = item.user_sentiment === key;
        return (
          <button
            key={key}
            onClick={() => onSentiment(item.id, key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all hover:scale-105"
            style={{
              background: isActive ? 'var(--primary-light)' : 'transparent',
              border: isActive
                ? '1px solid var(--primary)'
                : '1px solid var(--border)',
              fontFamily: 'Mulish, sans-serif',
            }}
            title={isActive ? 'Klik om weer weg te halen' : 'Uw reactie'}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>
              {SENTIMENT_EMOJI[key]}
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AdminNote({
  note,
  url,
}: {
  note: string | null;
  url: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-medium flex items-center gap-1"
        style={{ color: 'var(--primary)' }}
      >
        <span>{open ? '▾' : '▸'}</span>
        Reactie beheerder
      </button>
      {open && (
        <div
          className="mt-1 text-sm rounded-md p-3 prose-sm"
          style={{
            background: 'var(--primary-light)',
            color: 'var(--text)',
            borderLeft: '3px solid var(--primary)',
          }}
        >
          {note && <ReactMarkdown>{note}</ReactMarkdown>}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              🔗 Meer informatie
            </a>
          )}
        </div>
      )}
    </div>
  );
}
