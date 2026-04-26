'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PlatformItem } from '@/lib/types';
import SiteHeader from '@/components/SiteHeader';
import PlatformDropdown from '@/components/PlatformDropdown';
import LoginRequiredBanner from '@/components/LoginRequiredBanner';
import { useNingAuth } from '@/components/NingAuthProvider';

const ALLOWED_DOMAINS = [
  'infofrankrijk.com',
  'nedergids.nl',
  'nederlanders.fr',
  'cafeclaude.fr',
  'dossierfrankrijk.nl',
];

export default function IdeeIndienenPage() {
  const auth = useNingAuth();
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPlatform, setFormPlatform] = useState<string>('overig');
  const [formForumName, setFormForumName] = useState('');
  const [formRealName, setFormRealName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bij actieve gate + ingelogd: forumnaam wordt vooraf gevuld en vergrendeld
  const lockedForumName = auth.gateEnabled && auth.user
    ? auth.user.username
    : null;
  const canSubmit = !auth.gateEnabled || !!auth.user;

  useEffect(() => {
    if (lockedForumName && !formForumName) {
      setFormForumName(lockedForumName);
    }
  }, [lockedForumName, formForumName]);

  useEffect(() => {
    fetch('/api/platforms')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlatforms(data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!canSubmit) return;
    if (!formTitle.trim() || !formForumName.trim()) return;

    const trimmedUrl = formUrl.trim();
    let finalUrl: string | null = null;

    if (trimmedUrl) {
      let parsed: URL;
      try {
        parsed = new URL(
          trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`
        );
      } catch {
        setError('De ingevulde URL is niet geldig.');
        return;
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setError('De URL moet met http:// of https:// beginnen.');
        return;
      }
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const isAllowed = ALLOWED_DOMAINS.some(
        (d) => host === d || host.endsWith('.' + d)
      );
      if (!isAllowed) {
        setError(
          'Alleen links naar eigen sites: ' + ALLOWED_DOMAINS.join(', ') + '.'
        );
        return;
      }
      finalUrl = parsed.toString();
    }

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
          track: 'idea',
          status: 'idee',
          admin_note: formRealName.trim()
            ? `Ingediend door: ${formRealName.trim()} (${formForumName.trim()})`
            : null,
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
        setSubmitted(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Er ging iets mis. Probeer het later opnieuw.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader
        title="Idee indienen"
        subtitle="Wens, suggestie of zorgpunt? Geef het door."
        back={{ href: '/', label: '← Boîte à idées' }}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {auth.gateEnabled && !auth.loading && !auth.user && (
          <LoginRequiredBanner message="Log in op nederlanders.fr om een idee in te dienen" />
        )}
        {submitted ? (
          <div
            className="rounded-lg border p-6"
            style={{ background: '#e8f5e9', borderColor: '#4caf50' }}
          >
            <h2
              className="text-lg mb-2"
              style={{ color: '#2e7d32', fontFamily: 'Poppins, sans-serif' }}
            >
              ✓ Hartelijk dank voor uw idee!
            </h2>
            <p className="text-sm mb-4" style={{ color: '#2e7d32' }}>
              We zullen uw suggestie beoordelen en daarna plaatsen. Als er al
              een gelijksoortig idee bestaat, voegen we uw stem daaraan toe.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/ideeen"
                className="rounded-md px-4 py-2 text-sm font-medium text-white"
                style={{
                  background: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                Bekijk de Ideeënbus
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="rounded-md px-4 py-2 text-sm border"
                style={{ borderColor: 'var(--border)' }}
              >
                Nog een idee indienen
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg border p-5"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--primary-border)',
            }}
          >
            <p
              className="text-sm mb-5"
              style={{ color: 'var(--text-muted)' }}
            >
              Uw idee wordt na beoordeling door de beheerder geplaatst.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Uw forumnaam *
                  </label>
                  <input
                    type="text"
                    value={formForumName}
                    onChange={(e) => {
                      if (!lockedForumName) setFormForumName(e.target.value);
                    }}
                    placeholder="Zoals op nederlanders.fr"
                    readOnly={!!lockedForumName}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'var(--border)',
                      background: lockedForumName ? 'var(--primary-light)' : undefined,
                      cursor: lockedForumName ? 'not-allowed' : undefined,
                    }}
                  />
                  {lockedForumName && (
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Automatisch ingevuld vanuit uw nederlanders.fr-account.
                    </span>
                  )}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Uw naam{' '}
                    <span className="font-normal">(optioneel)</span>
                  </label>
                  <input
                    type="text"
                    value={formRealName}
                    onChange={(e) => setFormRealName(e.target.value)}
                    placeholder="Voornaam of volledige naam"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Titel *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Kort en duidelijk"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Toelichting
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => {
                    const words = e.target.value.split(/\s+/).filter(Boolean);
                    if (words.length <= 150) setFormDescription(e.target.value);
                  }}
                  placeholder="Optioneel: waarom is dit nuttig? (max 150 woorden)"
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)' }}
                />
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {formDescription.split(/\s+/).filter(Boolean).length}/150
                  woorden
                </span>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Relevante link{' '}
                  <span className="font-normal">(optioneel)</span>
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://voorbeeld.nl/relevante-pagina"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border)' }}
                />
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Alleen links naar eigen sites:{' '}
                  {ALLOWED_DOMAINS.join(', ')}.
                </span>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Platform / Tool
                </label>
                <PlatformDropdown
                  value={formPlatform}
                  onChange={setFormPlatform}
                  platforms={platforms}
                  showAll
                  instanceId="pd-indien-form"
                />
              </div>

              {error && (
                <div
                  className="rounded-md border p-3 text-sm"
                  style={{
                    background: '#fff5f5',
                    borderColor: '#fecaca',
                    color: '#b91c1c',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !canSubmit ||
                  !formTitle.trim() ||
                  !formForumName.trim()
                }
                className="rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--primary)' }}
              >
                {submitting ? 'Bezig...' : 'Indienen'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
