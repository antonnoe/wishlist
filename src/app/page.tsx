'use client';

import { useEffect, useState } from 'react';
import { WishlistItem, PlatformItem, STATUS_LABELS, STATUS_COLORS, Status } from '@/lib/types';
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

  // Build platform label lookup
  const platformLabels: Record<string, string> = {};
  platforms.forEach(p => { platformLabels[p.id] = p.label; });

  // Visible platforms for dropdown (grouped)
  const topLevel = platforms.filter(p => !p.parent_id && p.visible);
  const visibleChildren = (parentId: string) =>
    platforms.filter(p => p.parent_id === parentId && p.visible);

  async function fetchData() {
    try {
      const [itemsRes, platformsRes] = await Promise.all([
        fetch('/api/wishlist?visibility=public'),
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

  async function handleVote(itemId: string) {
    const res = await fetch('/api/wishlist/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist_id: itemId, user_id: userId }),
    });
    if (res.ok) fetchData();
  }

  async function handleSubmit() {
    if (!formTitle.trim() || !formForumName.trim()) return;
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
        }),
      });
      if (res.ok) {
        setFormTitle('');
        setFormDescription('');
        setFormPlatform('overig');
        setFormForumName('');
        setFormRealName('');
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
      // Match exact or parent
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
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Platform filter - grouped */}
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
          >
            <option value="all">Alle platforms</option>
            {topLevel.flatMap((p) => {
              const children = visibleChildren(p.id);
              return [
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>,
                ...children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'\u00A0\u00A0↳ '}{c.label}
                  </option>
                )),
              ];
            })}
          </select>

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

        {/* Confirmation message */}
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

        {/* Submit form */}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Platform / Tool</label>
                <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)}
                  className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                  {topLevel.flatMap((p) => {
                    const children = visibleChildren(p.id);
                    return [
                      <option key={p.id} value={p.id}>{p.label}</option>,
                      ...children.map((c) => (
                        <option key={c.id} value={c.id}>{'\u00A0\u00A0↳ '}{c.label}</option>
                      )),
                    ];
                  })}
                </select>
              </div>
              <button onClick={handleSubmit} disabled={submitting || !formTitle.trim() || !formForumName.trim()}
                className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--primary)' }}>
                {submitting ? 'Bezig...' : 'Indienen'}
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Geen items gevonden.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 flex gap-4 items-start"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <button onClick={() => handleVote(item.id)}
                  className="flex flex-col items-center min-w-[48px] pt-1 rounded-md transition-colors hover:bg-gray-50"
                  title="Stem op dit idee">
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0L20 12H0L10 0Z" fill="var(--primary)" opacity="0.6" />
                  </svg>
                  <span className="text-lg font-semibold mt-1" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                    {item.upvotes}
                  </span>
                </button>

                <div className="flex-1 min-w-0">
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
                  <div className="flex items-center gap-2 flex-wrap">
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
                </div>
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
