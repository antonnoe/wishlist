'use client';

import { useEffect, useState } from 'react';
import { PlatformItem } from '@/lib/types';

export default function PlatformDropdown({
  value,
  onChange,
  platforms,
  showAll = false,
  instanceId = 'pd',
}: {
  value: string;
  onChange: (v: string) => void;
  platforms: PlatformItem[];
  showAll?: boolean;
  instanceId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const topLevel = platforms.filter((p) => !p.parent_id && p.visible);
  const childrenOf = (parentId: string) =>
    platforms.filter((p) => p.parent_id === parentId && p.visible);

  const platformLabels: Record<string, string> = {};
  platforms.forEach((p) => {
    platformLabels[p.id] = p.label;
  });

  const displayLabel =
    value === 'all' ? 'Alle platforms' : platformLabels[value] || value;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const el = document.getElementById(instanceId);
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
        setExpandedParent(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, instanceId]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setExpandedParent(null);
  }

  return (
    <div className="relative" id={instanceId}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setExpandedParent(null);
        }}
        className="rounded-md border px-3 py-2 text-sm flex items-center gap-2 min-w-[160px]"
        style={{
          borderColor: open ? 'var(--primary)' : 'var(--border)',
          fontFamily: 'Mulish, sans-serif',
          background: 'var(--bg-card)',
          cursor: 'pointer',
        }}
      >
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-md border shadow-lg z-50 overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
            minWidth: '220px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {expandedParent === null ? (
            <>
              {showAll ? null : (
                <button
                  type="button"
                  onClick={() => select('all')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: 'Mulish, sans-serif',
                    fontWeight: value === 'all' ? 700 : 400,
                    color:
                      value === 'all' ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  Alle platforms
                </button>
              )}
              {topLevel.map((p) => {
                const kids = childrenOf(p.id);
                const hasKids = kids.length > 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (hasKids) {
                        setExpandedParent(p.id);
                      } else {
                        select(p.id);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                    style={{
                      fontFamily: 'Mulish, sans-serif',
                      fontWeight: value === p.id ? 700 : 400,
                      color: value === p.id ? 'var(--primary)' : 'var(--text)',
                    }}
                  >
                    <span>{p.label}</span>
                    {hasKids && (
                      <span
                        style={{ color: 'var(--text-muted)', fontSize: '11px' }}
                      >
                        ▸
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExpandedParent(null)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors border-b"
                style={{
                  fontFamily: 'Mulish, sans-serif',
                  color: 'var(--primary)',
                  borderColor: 'var(--border)',
                }}
              >
                ← Terug
              </button>
              <button
                type="button"
                onClick={() => select(expandedParent)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  color:
                    value === expandedParent
                      ? 'var(--primary)'
                      : 'var(--text)',
                }}
              >
                {platformLabels[expandedParent] || expandedParent}{' '}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  (alles)
                </span>
              </button>
              {childrenOf(expandedParent).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => select(c.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  style={{
                    fontFamily: 'Mulish, sans-serif',
                    paddingLeft: '24px',
                    fontWeight: value === c.id ? 700 : 400,
                    color: value === c.id ? 'var(--primary)' : 'var(--text)',
                  }}
                >
                  ↳ {c.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
