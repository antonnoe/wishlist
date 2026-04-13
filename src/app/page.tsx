'use client';

import { useEffect, useState } from 'react';
import { WishlistItem, PLATFORM_LABELS, STATUS_LABELS, STATUS_COLORS, Platform, Status } from '@/lib/types';

export default function Home() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlatform, setFormPlatform] = useState<Platform>('overig');
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

  async function fetchItems() {
    try {
      const res = await fetch('/api/wishlist?visibility=public');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch items:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleVote(itemId: string) {
    const res = await fetch('/api/wishlist/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist_id: itemId, user_id: userId }),
    });
    if (res.ok) {
      fetchItems();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          platform: formPlatform,
          created_by: userId,
        }),
      });
      if (res.ok) {
        setFormTitle('');
        setFormDescription('');
        setFormPlatform('overig');
        setShowForm(false);
        fetchItems();
      }
    } catch (e) {
      console.error('Failed to submit:', e);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = items.filter((item) => {
    if (filterPlatform !== 'all' && item.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const platforms = Object.keys(PLATFORM_LABELS) as Platform[];
  const statuses = Object.keys(STATUS_LABELS) as Status[];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl mb-1">Wishlist</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Ideeën en wensen voor de Communities Abroad tools
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Filters + New button */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
          >
            <option value="all">Alle platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
            ))}
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

        {/* Submit form */}
        {showForm && (
          <div
            className="rounded-lg border p-5 mb-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--primary-border)' }}
          >
            <h2 className="text-lg mb-4">Nieuw idee indienen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Titel *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Kort en duidelijk"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Toelichting
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optioneel: waarom is dit nuttig?"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Platform
                </label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value as Platform)}
                  className="rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formTitle.trim()}
                className="rounded-md px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--primary)', fontFamily: 'Mulish, sans-serif' }}
              >
                {submitting ? 'Bezig...' : 'Indienen'}
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Geen items gevonden.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border p-4 flex gap-4 items-start"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                {/* Vote button */}
                <button
                  onClick={() => handleVote(item.id)}
                  className="flex flex-col items-center min-w-[48px] pt-1 rounded-md transition-colors hover:bg-gray-50"
                  title="Stem op dit idee"
                >
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0L20 12H0L10 0Z" fill="var(--primary)" opacity="0.6" />
                  </svg>
                  <span className="text-lg font-semibold mt-1" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                    {item.upvotes}
                  </span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>
                      {item.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}
                      style={{ fontFamily: 'Mulish, sans-serif' }}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                      {item.description}
                    </p>
                  )}
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontFamily: 'Mulish, sans-serif' }}
                  >
                    {PLATFORM_LABELS[item.platform]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
