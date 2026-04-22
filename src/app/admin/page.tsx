'use client';

import { useEffect, useState } from 'react';
import { WishlistItem, PlatformItem, STATUS_LABELS, STATUS_COLORS, Status, Visibility } from '@/lib/types';

type Tab = 'items' | 'platforms';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('items');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  // New item form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlatform, setFormPlatform] = useState<string>('overig');
  const [formStatus, setFormStatus] = useState<Status>('idee');
  const [formVisibility, setFormVisibility] = useState<Visibility>('public');
  const [submitting, setSubmitting] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlatform, setEditPlatform] = useState<string>('overig');
  const [editStatus, setEditStatus] = useState<Status>('idee');
  const [editVisibility, setEditVisibility] = useState<Visibility>('public');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const statuses = Object.keys(STATUS_LABELS) as Status[];

  // Platform helpers
  const platformLabels: Record<string, string> = {};
  platforms.forEach(p => { platformLabels[p.id] = p.label; });
  const topLevel = platforms.filter(p => !p.parent_id);
  const children = (parentId: string) => platforms.filter(p => p.parent_id === parentId);
  const allPlatforms = platforms.filter(p => !p.parent_id);

  function PlatformSelect({ value, onChange, allItems }: { value: string; onChange: (v: string) => void; allItems?: boolean }) {
    const list = allItems ? platforms : platforms.filter(p => p.visible || !p.parent_id);
    const tops = list.filter(p => !p.parent_id);
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', fontFamily: 'Mulish, sans-serif' }}>
        {!allItems && <option value="all">Alle platforms</option>}
        {tops.map((p) => {
          const kids = list.filter(c => c.parent_id === p.id);
          return [
            <option key={p.id} value={p.id}>{p.label}</option>,
            ...kids.map((c) => (
              <option key={c.id} value={c.id}>&nbsp;&nbsp;↳ {c.label}</option>
            )),
          ];
        })}
      </select>
    );
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [itemsRes, platformsRes] = await Promise.all([
        fetch('/api/wishlist', { headers: { 'x-admin-key': adminKey } }),
        fetch('/api/platforms'),
      ]);
      const itemsData = await itemsRes.json();
      const platformsData = await platformsRes.json();
      if (Array.isArray(itemsData)) {
        setItems(itemsData);
        setAuthenticated(true);
      }
      if (Array.isArray(platformsData)) setPlatforms(platformsData);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() { await fetchData(); }

  async function handleSubmit() {
    if (!formTitle.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          title: formTitle.trim(), description: formDescription.trim() || null,
          platform: formPlatform, status: formStatus, visibility: formVisibility, created_by: 'admin',
        }),
      });
      setFormTitle(''); setFormDescription(''); setFormPlatform('overig');
      setFormStatus('idee'); setFormVisibility('public'); setShowForm(false);
      fetchData();
    } finally { setSubmitting(false); }
  }

  async function handleUpdate(id: string) {
    await fetch('/api/wishlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({
        id, title: editTitle, description: editDescription || null,
        platform: editPlatform, status: editStatus, visibility: editVisibility,
        admin_note: editAdminNote || null, url: editUrl || null,
      }),
    });
    setEditingId(null);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
    await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
    fetchData();
  }

  function startEdit(item: WishlistItem) {
    setEditingId(item.id); setEditTitle(item.title); setEditDescription(item.description || '');
    setEditPlatform(item.platform); setEditStatus(item.status); setEditVisibility(item.visibility);
    setEditAdminNote(item.admin_note || ''); setEditUrl(item.url || '');
  }

  async function togglePlatformVisibility(platformId: string, currentVisible: boolean) {
    await fetch('/api/platforms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id: platformId, visible: !currentVisible }),
    });
    fetchData();
  }

  const filtered = items.filter((item) => {
    if (filterPlatform !== 'all') {
      if (item.platform !== filterPlatform && !item.platform.startsWith(filterPlatform + '.')) return false;
    }
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterVisibility !== 'all' && item.visibility !== filterVisibility) return false;
    return true;
  });

  const pendingItems = items.filter(i => i.visibility === 'private' && i.status === 'idee');

  async function handleApprove(id: string) {
    await fetch('/api/wishlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id, visibility: 'public', admin_note: null }),
    });
    fetchData();
  }

  async function handleReject(id: string) {
    if (!confirm('Weet je zeker dat je dit idee wilt afwijzen? Het wordt verwijderd.')) return;
    await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
    fetchData();
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="rounded-lg border p-8 w-full max-w-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-xl mb-4">Admin</h1>
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin wachtwoord" className="w-full rounded-md border px-3 py-2 text-sm mb-3"
            style={{ borderColor: 'var(--border)' }} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} className="w-full rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}>Inloggen</button>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{items.length} items totaal</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://claude.ai/chat/38766adf-53e9-4fb7-a2cc-bb895356a69c" target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              🤖 Beheersessie
            </a>
            <a href="/" className="text-sm underline" style={{ color: 'var(--primary)' }}>← Publieke pagina</a>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-4">
          <button onClick={() => setTab('items')}
            className={`pb-2 text-sm font-medium border-b-2 ${tab === 'items' ? 'border-current' : 'border-transparent'}`}
            style={{ color: tab === 'items' ? 'var(--primary)' : 'var(--text-muted)' }}>
            Items
          </button>
          <button onClick={() => setTab('platforms')}
            className={`pb-2 text-sm font-medium border-b-2 ${tab === 'platforms' ? 'border-current' : 'border-transparent'}`}
            style={{ color: tab === 'platforms' ? 'var(--primary)' : 'var(--text-muted)' }}>
            Platforms & Tools
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Pending moderation banner */}
        {pendingItems.length > 0 && (
          <div className="rounded-lg border-2 p-4 mb-6" style={{ background: '#fff8e1', borderColor: '#f9a825' }}>
            <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'Poppins, sans-serif', color: '#e65100' }}>
              ⏳ {pendingItems.length} idee{pendingItems.length !== 1 ? 'ën' : ''} wachtend op goedkeuring
            </h2>
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.id} className="rounded-md border p-3 flex gap-3 items-start" style={{ background: '#fff', borderColor: '#ffe082' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {platformLabels[item.platform] || item.platform}
                      </span>
                    </div>
                    {item.description && <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Forumnaam: <strong>{item.created_by}</strong>
                      {item.admin_note && <> · {item.admin_note}</>}
                      {' · '}{new Date(item.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(item.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: '#16a34a' }}>
                      ✓ Goedkeuren
                    </button>
                    <button onClick={() => handleReject(item.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: '#dc2626' }}>
                      ✗ Afwijzen
                    </button>
                    <button onClick={() => startEdit(item)}
                      className="rounded-md px-3 py-1.5 text-xs border"
                      style={{ borderColor: 'var(--border)' }}>
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'platforms' ? (
          /* Platforms management */
          <div className="space-y-4">
            {topLevel.map((platform) => {
              const kids = children(platform.id);
              return (
                <div key={platform.id} className="rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{platform.label}</h3>
                    <button onClick={() => togglePlatformVisibility(platform.id, platform.visible)}
                      className={`text-xs px-3 py-1 rounded-full ${platform.visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {platform.visible ? '✅ Zichtbaar' : '👁️‍🗨️ Verborgen'}
                    </button>
                  </div>
                  {kids.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {kids.map((child) => (
                        <div key={child.id} className="flex items-center justify-between py-1">
                          <span className="text-sm" style={{ color: child.visible ? 'var(--text)' : 'var(--text-muted)' }}>
                            ↳ {child.label}
                          </span>
                          <button onClick={() => togglePlatformVisibility(child.id, child.visible)}
                            className={`text-xs px-3 py-1 rounded-full ${child.visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {child.visible ? '✅ Aan' : '⬚ Uit'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Items management */
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <PlatformSelect value={filterPlatform} onChange={setFilterPlatform} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                <option value="all">Alle statussen</option>
                {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}>
                <option value="all">Public + Private</option>
                <option value="public">Alleen public</option>
                <option value="private">Alleen private</option>
              </select>
              <button onClick={() => setShowForm(!showForm)}
                className="ml-auto rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}>
                {showForm ? 'Annuleren' : '+ Nieuw item'}
              </button>
            </div>

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
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Platform / Tool</label>
                    <PlatformSelect value={formPlatform} onChange={setFormPlatform} allItems />
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
                      <option value="public">Public</option>
                      <option value="private">Private</option>
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
                      <div className="space-y-3">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)' }} />
                        <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
                          className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} placeholder="Beschrijving" />
                        <textarea value={editAdminNote} onChange={(e) => setEditAdminNote(e.target.value)} rows={2}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          style={{ borderColor: 'var(--primary-border)', background: 'var(--primary-light)' }}
                          placeholder="Admin-reactie (zichtbaar voor gebruikers als ingevuld)" />
                        <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }}
                          placeholder="URL (optioneel)" />
                        <div className="flex flex-wrap gap-3">
                          <PlatformSelect value={editPlatform} onChange={setEditPlatform} allItems />
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
                            className="rounded-md px-3 py-1 text-sm text-white" style={{ background: 'var(--success)' }}>Opslaan</button>
                          <button onClick={() => setEditingId(null)}
                            className="rounded-md px-3 py-1 text-sm border" style={{ borderColor: 'var(--border)' }}>Annuleren</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-start">
                        <div className="flex flex-col items-center min-w-[64px] pt-1 text-xs" style={{ fontFamily: 'Mulish, sans-serif' }}>
                          <div style={{ color: 'var(--text)' }}>
                            😀 {item.positive_count} · 😐 {item.neutral_count} · 🙁 {item.negative_count}
                          </div>
                          <span style={{ color: 'var(--text-muted)', marginTop: '2px' }}>reacties</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                            {item.visibility === 'private' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">🔒 Private</span>
                            )}
                          </div>
                          {item.description && <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
                          {item.admin_note && (
                            <div className="text-xs mb-2 rounded-md p-2"
                              style={{ background: 'var(--primary-light)', borderLeft: '3px solid var(--primary)' }}>
                              💬 {item.admin_note}
                            </div>
                          )}
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs mb-2 inline-block hover:underline" style={{ color: 'var(--primary)' }}>
                              🔗 {item.url}
                            </a>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                              {platformLabels[item.platform] || item.platform}
                            </span>
                            {item.created_by && item.created_by !== 'admin' && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                door <strong>{item.created_by}</strong>
                              </span>
                            )}
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {new Date(item.created_at).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(item)}
                            className="rounded px-2 py-1 text-xs border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>✏️</button>
                          <button onClick={() => handleDelete(item.id)}
                            className="rounded px-2 py-1 text-xs border hover:bg-red-50" style={{ borderColor: 'var(--border)' }}>🗑️</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
