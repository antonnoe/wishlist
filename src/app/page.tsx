'use client';

import { useEffect, useState } from 'react';
import { WishlistItem, PlatformItem, STATUS_LABELS, STATUS_COLORS, Status, Sentiment, SENTIMENT_EMOJI } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlatform, setFormPlatform] = useState<string>('overig');
  const [formForumName, setFormForumName] = useState('');
  const [formRealName, setFormRealName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
  platforms.forEach(p => { platformLabels[p.id] = p.label; });

  async function fetchData() {
    try {
      const [itemsRes, platformsRes] = await Promise.all([
        fetch(`/api/wishlist?visibility=public&user_id=${encodeURIComponent(userId)}`),
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

  useEffect(() => { fetchData(); }, []);

  async function handleSentiment(itemId: string, sentiment: Sentiment) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const prevSentiment = item.user_sentiment;
      const updated = { ...item };

      if (prevSentiment === 'positive') updated.positive_count = Math.max(0, updated.positive_count - 1);
      if (prevSentiment === 'neutral') updated.neutral_count = Math.max(0, updated.neutral_count - 1);
      if (prevSentiment === 'negative') updated.negative_count = Math.max(0, updated.negative_count - 1);

      if (prevSentiment === sentiment) {
        updated.user_sentiment = null;
      } else {
        updated.user_sentiment = sentiment;
        if (sentiment === 'positive') updated.positive_count += 1;
        if (sentiment === 'neutral') updated.neutral_count += 1;
        if (sentiment === 'negative') updated.negative_count += 1;
      }
      return updated;
    }));

    const res = await fetch('/api/wishlist/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist_id: itemId, user_id: userId, sentiment }),
    });
    if (!res.ok) {
      fetchData();
    }
  }

  async function handleSubmit() {
    if (!formTitle.trim() || !formForumName.trim()) return;

    // Valideer URL indien ingevuld
    const trimmedUrl = formUrl.trim();
    if (trimmedUrl) {
      try {
        const parsed = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          alert('De URL moet met http:// of https:// beginnen.');
          return;
        }
      } catch {
        alert('De ingevulde URL is niet geldig.');
        return;
      }
    }

    const finalUrl = trimmedUrl
      ? (trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`)
      : null;

    setSubmitting(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          platform: formPlatform,
          created_by: formForumName.trim(),
          visibility: 'private',
          admin_note: formRealName.trim() ? `Ingediend door: ${formRealName.trim()} (${formForumName.trim()})` : null,
          url: finalUrl,
        }),
      });
      if (res.ok) {
        setFormTitle('');
        setFormDescription('');
        setFormPlatform('overig');
        setFormForumName('');
        setFormRealName('');
        setFormUrl('');
        setShowForm(false);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = items.filter((item) => {
    if (filterPlatform !== 'all') {
      if (item.platform !== filterPlatform && !item.platform.startsWith(filterPlatform + '.')) return false;
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
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-1">Boîte à idées</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Ideeën en wensen voor de Communities Abroad tools
            </p>
          </div>
          <a href="https://www.nederlanders.fr" target="_top"
            className="rounded-md px-3 py-1.5 text-xs font-medium shrink-0"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', textDecoration: 'none', fontFamily: 'Mulish, sans-serif' }}>
            ← Terug naar forum
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <FAQ />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <PlatformDropdown
            value={filterPlatform}
            onChange={setFilterPlatform}
            platforms={platforms}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
          >
            <option value="all">Alle statussen</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', fontFamily: 'Mulish, sans-serif' }}
          >
            {showForm ? 'Annuleren' : '+ Nieuw idee'}
          </button>
        </div>

        {submitted && (
          <div className="rounded-lg border p-4 mb-6" style={{ background: '#e8f5e9', borderColor: '#4caf50' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#2e7d32' }}>
              ✓ Hartelijk dank voor uw idee!
            </p>
            <p className="text-sm" style={{ color: '#2e7d32' }}>
              We zullen uw suggestie beoordelen en daarna plaatsen. Als er al een gelijksoortig idee bestaat, voegen we uw stem daaraan toe.
            </p>
          </div>
        )}

        {showForm && (
          <div className="rounded-lg border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--primary-border)' }}>
            <h2 className="text-lg mb-4">Nieuw idee indienen</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Uw idee wordt na beoordeling door de beheerder geplaatst.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Uw forumnaam *</label>
                  <input type="text" value={formForumName} onChange={(e) => setFormForumName(e.target.value)}
                    placeholder="Zoals op nederlanders.fr"
                    className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Uw naam <span className="font-normal">(optioneel)</span></label>
                  <input type="text" value={formRealName} onChange={(e) => setFormRealName(e.target.value)}
                    placeholder="Voornaam of volledige naam"
                    className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Titel *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Kort en duidelijk"
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Toelichting</label>
                <textarea value={formDescription}
                  onChange={(e) => {
                    const words = e.target.value.split(/\s+/).filter(Boolean);
                    if (words.length <= 150) setFormDescription(e.target.value);
                  }}
                  placeholder="Optioneel: waarom is dit nuttig? (max 150 woorden)" rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formDescription.split(/\s+/).filter(Boolean).length}/150 woorden
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Relevante link <span className="font-normal">(optioneel)</span>
                </label>
                <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://voorbeeld.nl/relevante-pagina"
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Bijvoorbeeld een voorbeeld, bron of referentiesite.
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Platform / Tool</label>
                <PlatformDropdown
                  value={formPlatform}
                  onChange={setFormPlatform}
                  platforms={platforms}
                  showAll
                />
              </div>
              <button onClick={handleSubmit} disabled={submitting || !formTitle.trim() || !formForumName.trim()}
                className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--primary)' }}>
                {submitting ? 'Bezig...' : 'Indienen'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Geen items gevonden.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-lg border p-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>
                    {item.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                {item.description && (
                  <div className="text-sm mb-2 prose-sm overflow-y-auto" style={{ color: 'var(--text-muted)', maxHeight: '120px' }}>
                    <ReactMarkdown>{item.description}</ReactMarkdown>
                  </div>
                )}
                {(item.admin_note || item.url) && (
                  <AdminNote note={item.admin_note || null} url={item.url || null} />
                )}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontFamily: 'Mulish, sans-serif' }}>
                    {getPlatformLabel(item.platform)}
                  </span>
                  {item.created_by && item.created_by !== 'admin' && item.created_by !== 'anonymous' && !item.created_by.startsWith('user_') && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      door {item.created_by}
                    </span>
                  )}
                </div>

                <SentimentBar item={item} onSentiment={handleSentiment} />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-8 text-right">
        <a href="/admin" className="text-xs opacity-20 hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          admin
        </a>
      </footer>
    </div>
  );
}

function SentimentBar({ item, onSentiment }: {
  item: WishlistItem;
  onSentiment: (id: string, s: Sentiment) => void;
}) {
  const options: { key: Sentiment; count: number }[] = [
    { key: 'positive', count: item.positive_count },
    { key: 'neutral', count: item.neutral_count },
    { key: 'negative', count: item.negative_count },
  ];

  return (
    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
      {options.map(({ key, count }) => {
        const isActive = item.user_sentiment === key;
        return (
          <button
            key={key}
            onClick={() => onSentiment(item.id, key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all hover:scale-105"
            style={{
              background: isActive ? 'var(--primary-light)' : 'transparent',
              border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
              fontFamily: 'Mulish, sans-serif',
            }}
            title={isActive ? 'Klik om weer weg te halen' : 'Uw reactie'}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{SENTIMENT_EMOJI[key]}</span>
            <span className="text-sm font-medium" style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState<boolean>(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('boite_faq_open') : null;
    setOpen(stored === null ? true : stored === 'true');
    setMounted(true);
  }, []);

  function toggleMain() {
    const next = !open;
    setOpen(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('boite_faq_open', String(next));
    }
  }

  const questions = [
    {
      q: 'Wat is de Boîte à idées?',
      a: 'Een openbare plek waar u ideeën, wensen en suggesties kunt delen voor de websites en hulpmiddelen van Communities Abroad: Nederlanders.fr, Infofrankrijk.com, Café Claude, Dossier Frankrijk, Briefhulp-FR, Financieel Kompas en Energieportaal.',
    },
    {
      q: 'Voor wie is dit?',
      a: 'Voor iedereen. U hoeft geen abonnee of lid te zijn. Lezen, reageren met een smiley en een idee indienen kan vrij.',
    },
    {
      q: 'Hoe werkt de smiley-reactie?',
      a: '😀 = u vindt dit een goed idee · 😐 = neutraal · 🙁 = u ziet er niets in. Klikken op dezelfde smiley haalt uw reactie weer weg. U kunt per idee maar één smiley geven.',
    },
    {
      q: 'Wat gebeurt er met mijn idee?',
      a: 'Nieuwe ideeën worden eerst door de beheerder bekeken voordat ze openbaar verschijnen. Gelijksoortige ideeën worden samengevoegd. Daarna krijgt een idee een status: Idee → Gepland → Bezig → Live (of in uitzonderlijke gevallen: Verworpen, met toelichting).',
    },
    {
      q: 'Blijft mijn naam zichtbaar?',
      a: 'Uw forumnaam komt bij het idee te staan. Uw optionele echte naam is alleen voor de beheerder en wordt niet publiek getoond.',
    },
  ];

  if (!mounted) return null;

  return (
    <div className="rounded-lg border mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <button
        onClick={toggleMain}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        <span className="font-semibold" style={{ color: 'var(--primary)' }}>
          Hoe werkt de Boîte à idées?
        </span>
        <span style={{ color: 'var(--primary)', fontSize: '14px' }}>
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          {questions.map((item, idx) => {
            const isOpen = openItem === idx;
            return (
              <div key={idx} className="rounded-md" style={{ background: isOpen ? 'var(--primary-light)' : 'transparent' }}>
                <button
                  onClick={() => setOpenItem(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-sm"
                  style={{ fontFamily: 'Mulish, sans-serif' }}
                >
                  <span className="font-medium" style={{ color: 'var(--text)' }}>
                    {item.q}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontFamily: 'Mulish, sans-serif' }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminNote({ note, url }: { note: string | null; url: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button onClick={() => setOpen(!open)}
        className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
        <span>{open ? '▾' : '▸'}</span>
        Reactie beheerder
      </button>
      {open && (
        <div className="mt-1 text-sm rounded-md p-3 prose-sm"
          style={{ background: 'var(--primary-light)', color: 'var(--text)', borderLeft: '3px solid var(--primary)' }}>
          {note && <ReactMarkdown>{note}</ReactMarkdown>}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium hover:underline"
              style={{ color: 'var(--primary)' }}>
              🔗 Meer informatie
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformDropdown({
  value,
  onChange,
  platforms,
  showAll = false,
}: {
  value: string;
  onChange: (v: string) => void;
  platforms: PlatformItem[];
  showAll?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const topLevel = platforms.filter(p => !p.parent_id && p.visible);
  const childrenOf = (parentId: string) =>
    platforms.filter(p => p.parent_id === parentId && p.visible);

  const platformLabels: Record<string, string> = {};
  platforms.forEach(p => { platformLabels[p.id] = p.label; });

  const displayLabel = value === 'all'
    ? 'Alle platforms'
    : platformLabels[value] || value;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const el = document.getElementById('pd-' + (showAll ? 'form' : 'filter'));
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
        setExpandedParent(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, showAll]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setExpandedParent(null);
  }

  return (
    <div className="relative" id={'pd-' + (showAll ? 'form' : 'filter')}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setExpandedParent(null); }}
        className="rounded-md border px-3 py-2 text-sm flex items-center gap-2 min-w-[160px]"
        style={{
          borderColor: open ? 'var(--primary)' : 'var(--border)',
          fontFamily: 'Mulish, sans-serif',
          background: 'var(--bg-card)',
          cursor: 'pointer',
        }}
      >
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-md border shadow-lg z-50 overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
            minWidth: '220px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {expandedParent === null ? (
            <>
              {showAll ? null : (
                <button
                  type="button"
                  onClick={() => select('all')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: 'Mulish, sans-serif',
                    fontWeight: value === 'all' ? 700 : 400,
                    color: value === 'all' ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  Alle platforms
                </button>
              )}
              {topLevel.map((p) => {
                const kids = childrenOf(p.id);
                const hasKids = kids.length > 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (hasKids) {
                        setExpandedParent(p.id);
                      } else {
                        select(p.id);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                    style={{
                      fontFamily: 'Mulish, sans-serif',
                      fontWeight: value === p.id ? 700 : 400,
                      color: value === p.id ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    <span>{p.label}</span>
                    {hasKids && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>▸</span>}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExpandedParent(null)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors border-b"
                style={{
                  fontFamily: 'Mulish, sans-serif',
                  color: 'var(--primary)',
                  borderColor: 'var(--border)',
                }}
              >
                ← Terug
              </button>
              <button
                type="button"
                onClick={() => select(expandedParent)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color: value === expandedParent ? 'var(--primary)' : 'var(--text)',
                }}
              >
                {platformLabels[expandedParent] || expandedParent} <span style={{ fontWeight: 400, fontSize: '11px', color: 'var(--text-muted)' }}>(alles)</span>
              </button>
              {childrenOf(expandedParent).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: 'Mulish, sans-serif',
                    paddingLeft: '24px',
                    fontWeight: value === c.id ? 700 : 400,
                    color: value === c.id ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  ↳ {c.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
