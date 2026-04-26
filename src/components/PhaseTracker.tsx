import { ROADMAP_PHASES, ROADMAP_PHASE_LABELS, RoadmapPhase } from '@/lib/types';

export default function PhaseTracker({
  current,
  size = 'md',
}: {
  current: RoadmapPhase | null | undefined;
  size?: 'sm' | 'md';
}) {
  const idx = current ? ROADMAP_PHASES.indexOf(current) : -1;
  const dot = size === 'sm' ? 10 : 14;
  const lineH = size === 'sm' ? 2 : 3;

  return (
    <div
      className="flex items-center gap-1 w-full"
      role="img"
      aria-label={
        current
          ? `Fase: ${ROADMAP_PHASE_LABELS[current]} (${idx + 1} van ${ROADMAP_PHASES.length})`
          : 'Fase onbekend'
      }
    >
      {ROADMAP_PHASES.map((phase, i) => {
        const reached = idx >= i;
        const isCurrent = idx === i;
        return (
          <div key={phase} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: '50%',
                  background: reached ? 'var(--primary)' : 'transparent',
                  border: `2px solid ${reached ? 'var(--primary)' : 'var(--border)'}`,
                  boxShadow: isCurrent
                    ? '0 0 0 3px var(--primary-light)'
                    : 'none',
                }}
              />
              <span
                className="text-[10px] uppercase tracking-wide whitespace-nowrap"
                style={{
                  color: reached ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'Mulish, sans-serif',
                  fontWeight: isCurrent ? 700 : 500,
                }}
              >
                {ROADMAP_PHASE_LABELS[phase]}
              </span>
            </div>
            {i < ROADMAP_PHASES.length - 1 && (
              <div
                className="flex-1"
                style={{
                  height: lineH,
                  background:
                    idx > i ? 'var(--primary)' : 'var(--border)',
                  borderRadius: lineH,
                  marginBottom: 14,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
