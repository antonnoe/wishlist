import Link from 'next/link';

export default function SiteHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
}) {
  return (
    <header
      className="border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      {/* Nav-balk: altijd bovenaan, los van titel, prominent zichtbaar */}
      <nav
        className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)' }}
        aria-label="Hoofdnavigatie"
      >
        {back && (
          <Link
            href={back.href}
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontFamily: 'Mulish, sans-serif',
            }}
          >
            {back.label}
          </Link>
        )}
        <a
          href="https://www.nederlanders.fr"
          target="_top"
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            textDecoration: 'none',
            fontFamily: 'Mulish, sans-serif',
          }}
        >
          ← Forum
        </a>
      </nav>

      {/* Titelblok */}
      <div className="max-w-3xl mx-auto px-4 py-5">
        <h1 className="text-2xl mb-1">{title}</h1>
        {subtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
