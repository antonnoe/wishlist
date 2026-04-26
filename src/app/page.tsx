'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import SiteHeader from '@/components/SiteHeader';

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Wat is het verschil tussen Innovaties en Ideeën?',
    a: 'Innovaties zijn projecten van Communities Abroad — wat wij bouwen. Ideeën zijn van gebruikers — wat u wilt. Beide voeden elkaar.',
  },
  {
    q: 'Waarom kan ik geen smiley geven op innovaties?',
    a: 'Innovaties zijn geen democratische lijst om over te stemmen. Ze worden gebouwd op basis van behoefte, haalbaarheid en prioriteit. Wie een innovatie heeft gebruikt, krijgt later in de tool zelf de kans om feedback te geven op de ervaring. Inhoudelijke vragen of opmerkingen: zie het forum.',
  },
  {
    q: 'Wat gebeurt er met mijn idee?',
    a: 'Elk idee wordt gelezen en beoordeeld. De status verandert van “Idee” naar “Gepland”, “Bezig” of “Live” wanneer ik daartoe besluit, op basis van haalbaarheid, draagvlak en prioriteit.',
  },
  {
    q: 'Hoe werken de smileys?',
    a: 'Op ideeën in de Ideeënbus kunt u 😀, 😐 of 🙁 klikken om aan te geven hoe een idee leeft. Eén stem per persoon per idee. Op innovaties werken smileys niet — daar is de Roadmap voor.',
  },
  {
    q: 'Wordt mijn naam getoond?',
    a: 'Uw forumnaam komt bij het idee te staan. Uw optionele echte naam is alleen voor de beheerder en wordt niet publiek getoond.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader
        title="Boîte à idées"
        subtitle="Wat wij bouwen, en wat u wilt."
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <section className="mb-8">
          <p
            className="text-base"
            style={{ color: 'var(--text)', fontFamily: 'Mulish, sans-serif' }}
          >
            Een open dialoog tussen Communities Abroad en de gebruikers van
            onze websites en tools. Hier vindt u twee lijnen die elkaar voeden:
            wat wij bouwen, en wat u wilt.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <ChoiceCard
            href="/idee-indienen"
            icon="💡"
            title="Dien uw idee in"
            description="Wens, suggestie of zorgpunt? Geef het door."
          />
          <ChoiceCard
            href="/ideeen"
            icon="📋"
            title="Bekijk ideeën van anderen"
            description="Stem mee met smileys."
          />
          <ChoiceCard
            href="/innovaties"
            icon="🚀"
            title="Innovaties 2025-2026"
            description="Wat wij bouwen, in welke fase, voor wie."
          />
        </section>

        <FAQ items={FAQ_ITEMS} />
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-8 text-right">
        <Link
          href="/admin"
          className="text-xs opacity-20 hover:opacity-60 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          admin
        </Link>
      </footer>
    </div>
  );
}

function ChoiceCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border p-6 flex flex-col gap-2 transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        textDecoration: 'none',
        color: 'var(--text)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ fontSize: '32px', lineHeight: 1 }}>{icon}</div>
      <h2
        className="text-lg group-hover:underline"
        style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--primary)' }}
      >
        {title}
      </h2>
      <p
        className="text-sm"
        style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
      >
        {description}
      </p>
    </Link>
  );
}

const FAQ_STORAGE_KEY = 'boite_faq_open_v2';

function subscribeFaqStorage(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

function getFaqOpen(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(FAQ_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const open = useSyncExternalStore(
    subscribeFaqStorage,
    getFaqOpen,
    () => true
  );

  function toggleMain() {
    if (typeof window === 'undefined') return;
    const next = !open;
    window.localStorage.setItem(FAQ_STORAGE_KEY, String(next));
    window.dispatchEvent(new StorageEvent('storage', { key: FAQ_STORAGE_KEY }));
  }

  return (
    <div
      className="rounded-lg border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={toggleMain}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        <span className="font-semibold" style={{ color: 'var(--primary)' }}>
          Veelgestelde vragen
        </span>
        <span style={{ color: 'var(--primary)', fontSize: '14px' }}>
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div
          className="px-5 pb-4 space-y-2"
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '12px',
          }}
        >
          {items.map((item, idx) => {
            const isOpen = openItem === idx;
            return (
              <div
                key={idx}
                className="rounded-md"
                style={{
                  background: isOpen ? 'var(--primary-light)' : 'transparent',
                }}
              >
                <button
                  onClick={() => setOpenItem(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-sm gap-3"
                  style={{ fontFamily: 'Mulish, sans-serif' }}
                >
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text)' }}
                  >
                    {item.q}
                  </span>
                  <span
                    style={{ color: 'var(--text-muted)', fontSize: '12px' }}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="px-3 pb-3 text-sm"
                    style={{
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      fontFamily: 'Mulish, sans-serif',
                    }}
                  >
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
