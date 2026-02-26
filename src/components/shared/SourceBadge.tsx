/**
 * Temporary audit badge showing the data source of a displayed value.
 * Remove once all data flows from production API.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export type DataSource = 'dump' | 'pdf' | 'invented' | 'mismatch';

const SOURCE_CONFIG: Record<DataSource, { color: string; label: string; title: string }> = {
  dump:      { color: '#22C55E', label: 'D',  title: '🟢 DUMP — from PostgreSQL sample dump' },
  pdf:       { color: '#3B82F6', label: 'P',  title: '🔵 PDF — from sample PDF report' },
  invented:  { color: '#EAB308', label: '?',  title: '🟡 INVENTED — no real data source' },
  mismatch:  { color: '#EF4444', label: '!',  title: '⚠️ MISMATCH — dump and PDF differ' },
};

/* ─── Visibility Context ─── */

const SourceBadgeContext = createContext(true);

export function useSourceBadgeVisible() {
  return useContext(SourceBadgeContext);
}

export function SourceBadgeProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);

  return (
    <SourceBadgeContext.Provider value={visible}>
      {children}
      {/* Floating toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-card-white border border-gray-200 shadow-lg rounded-full px-4 py-2.5 text-sm font-medium text-signify-dark hover:bg-gray-50 transition-colors"
        title={visible ? 'Datenquellen-Marker ausblenden' : 'Datenquellen-Marker einblenden'}
      >
        <span
          className="inline-flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
          style={{
            backgroundColor: visible ? '#22C55E' : '#9CA3AF',
            width: 16,
            height: 16,
            fontSize: 9,
            lineHeight: 1,
          }}
        >
          D
        </span>
        {visible ? 'Marker an' : 'Marker aus'}
      </button>
    </SourceBadgeContext.Provider>
  );
}

/* ─── Badge Component ─── */

interface SourceBadgeProps {
  source: DataSource;
  children?: React.ReactNode;
  /** Render inline (default) or as a standalone dot */
  inline?: boolean;
}

export function SourceBadge({ source, children, inline = true }: SourceBadgeProps) {
  const visible = useContext(SourceBadgeContext);
  const { color, label, title } = SOURCE_CONFIG[source];

  if (!visible) {
    return children ? <>{children}</> : null;
  }

  const dot = (
    <span
      title={title}
      className="inline-flex items-center justify-center rounded-full text-white font-bold cursor-help select-none flex-shrink-0"
      style={{
        backgroundColor: color,
        width: 14,
        height: 14,
        fontSize: 8,
        lineHeight: 1,
        verticalAlign: 'middle',
        marginLeft: inline ? 4 : 0,
      }}
    >
      {label}
    </span>
  );

  if (!children) return dot;

  return (
    <span className="inline-flex items-center gap-0">
      {children}
      {dot}
    </span>
  );
}

/** Source legend component for display at the top of the report */
export function SourceLegend() {
  const visible = useContext(SourceBadgeContext);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-signify-gray bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
      <span className="font-semibold text-signify-dark">Datenquellen:</span>
      {(['dump', 'pdf', 'invented', 'mismatch'] as DataSource[]).map((src) => (
        <span key={src} className="flex items-center gap-1">
          <SourceBadge source={src} />
          <span>{SOURCE_CONFIG[src].title.split('—')[1]?.trim()}</span>
        </span>
      ))}
    </div>
  );
}
