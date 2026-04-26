export default function LoginRequiredBanner({
  variant = 'info',
  message,
}: {
  variant?: 'info' | 'warning';
  message?: string;
}) {
  const isWarning = variant === 'warning';
  return (
    <div
      role="status"
      className="rounded-lg border p-4 mb-4 flex items-start gap-3"
      style={{
        background: isWarning ? '#fff8e1' : 'var(--primary-light)',
        borderColor: isWarning ? '#f9a825' : 'var(--primary-border)',
      }}
    >
      <span aria-hidden style={{ fontSize: '20px', lineHeight: 1 }}>
        🔒
      </span>
      <div className="flex-1">
        <p
          className="text-sm font-medium mb-1"
          style={{
            color: isWarning ? '#e65100' : 'var(--primary)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {message || 'Log in op nederlanders.fr om mee te reageren'}
        </p>
        <p
          className="text-xs"
          style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}
        >
          Reacties en smileys zijn voor leden van het forum. Open{' '}
          <a
            href="https://www.nederlanders.fr"
            target="_top"
            className="underline"
            style={{ color: 'var(--primary)' }}
          >
            nederlanders.fr
          </a>{' '}
          en log in, daarna kunt u hier meedoen.
        </p>
      </div>
    </div>
  );
}
