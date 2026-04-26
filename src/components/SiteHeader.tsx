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
      <div className="max-w-3xl mx-auto px-4 py-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl mb-1">{title}</h1>
          {subtitle && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {back && (
            <Link
              href={back.href}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
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
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontFamily: 'Mulish, sans-serif',
            }}
          >
            ← Forum
          </a>
        </div>
      </div>
    </header>
  );
}
