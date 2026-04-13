'use client';

import { useEffect, useState } from 'react';
import { WishlistItem, PLATFORM_LABELS, STATUS_LABELS, STATUS_COLORS, Platform, Status, Visibility } from '@/lib/types';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  // New item form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlatform, setFormPlatform] = useState<Platform>('overig');
  const [formStatus, setFormStatus] = useState<Status>('idee');
  const [formVisibility, setFormVisibility] = useState<Visibility>('public');
  const [submitting, setSubmitting] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlatform, setEditPlatform] = useState<Platform>('overig');
  const [editStatus, setEditStatus] = useState<Status>('idee');
  const [editVisibility, setEditVisibility] = useState<Visibility>('public');

  const platforms = Object.keys(PLATFORM_LABELS) as Platform[];
  const statuses = Object.keys(STATUS_LABELS) as Status[];

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await fetchItems();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          platform: formPlatform,
          status: formStatus,
          visibility: formVisibility,
          created_by: 'admin',
        }),
      });
      setFormTitle('');
      setFormDescription('');
      setFormPlatform('overig');
      setFormStatus('idee');
      setFormVisibility('public');
      setShowForm(false);
      fetchItems();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: string) {
    await fetch('/api/wishlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({
        id,
        title: editTitle,
        description: editDescription || null,
        platform: editPlatform,
        status: editStatus,
        visibility: editVisibility,
      }),
    });
    setEditingId(null);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
    await fetch(`/api/wishlist?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    });
    fetchItems();
  }

  function startEdit(item: WishlistItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditPlatform(item.platform);
    setEditStatus(item.status);
    setEditVisibility(item.visibility);
  }

  const filtered = items.filter((item) => {
    if (filterPlatform !== 'all' && item.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterVisibility !== 'all' && item.visibility !== filterVisibility) return false;
    return true;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="rounded-lg border p-8 w-full max-w-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-xl mb-4">Admin</h1>
          <div>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin wachtwoord"
              className="w-full rounded-md border px-3 py-2 text-sm mb-3"
              style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
            />
            <button
              onClick={handleLogin}
              className="w-full rounded-md px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--primary)' }}
            >
              Inloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl mb-1">Boîte à idées — Admin</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {items.length} items totaal
            </p>
          </div>
          <a href="/" className="text-sm underline" style={{ color: 'var(--primary)' }}>
            ← Publieke pagina
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
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

          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}
          >
            <option value="all">Public + Private</option>
            <option value="public">Alleen public</option>
            <option value="private">Alleen private</option>
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            {showForm ? 'Annuleren' : '+ Nieuw item'}
          </button>
        </div>

        {/* New item form */}
        {showForm && (
          <div className="rounded-lg border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--primary-border)' }}>
            <h2 className="text-lg mb-4">Nieuw item</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Titel *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Beschrijving</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Platform</label>
                <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value as Platform)}
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                  {platforms.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as Status)}
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                  {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Zichtbaarheid</label>
                <select value={formVisibility} onChange={(e) => setFormVisibility(e.target.value as Visibility)}
                  className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                  <option value="public">Public (zichtbaar voor abonnees)</option>
                  <option value="private">Private (alleen admin)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleSubmit} disabled={submitting || !formTitle.trim()}
                  className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {submitting ? 'Bezig...' : 'Toevoegen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-lg border p-4"
                style={{
                  background: item.visibility === 'private' ? 'var(--primary-light)' : 'var(--bg-card)',
                  borderColor: item.visibility === 'private' ? 'var(--primary-border)' : 'var(--border)',
                }}>
                {editingId === item.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)' }} />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
                      className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} />
                    <div className="flex flex-wrap gap-3">
                      <select value={editPlatform} onChange={(e) => setEditPlatform(e.target.value as Platform)}
                        className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)' }}>
                        {platforms.map((p) => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
                      </select>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Status)}
                        className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)' }}>
                        {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                      <select value={editVisibility} onChange={(e) => setEditVisibility(e.target.value as Visibility)}
                        className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)' }}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                      <button onClick={() => handleUpdate(item.id)}
                        className="rounded-md px-3 py-1 text-sm text-white" style={{ background: 'var(--success)' }}>
                        Opslaan
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="rounded-md px-3 py-1 text-sm border" style={{ borderColor: 'var(--border)' }}>
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center min-w-[48px] pt-1">
                      <span className="text-lg font-semibold" style={{ color: 'var(--primary)', fontFamily: 'Poppins, sans-serif' }}>
                        {item.upvotes}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>votes</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {item.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                        {item.visibility === 'private' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">🔒 Private</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                          {PLATFORM_LABELS[item.platform]}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)}
                        className="rounded px-2 py-1 text-xs border hover:bg-gray-50"
                        style={{ borderColor: 'var(--border)' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="rounded px-2 py-1 text-xs border hover:bg-red-50"
                        style={{ borderColor: 'var(--border)' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
