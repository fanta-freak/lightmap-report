import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SignifyLogo } from '../components/shared/SignifyLogo';
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher';
import { useReportList } from '../hooks/useReportList';
import type { ReportListItem } from '../api/types';

function ReportCard({ report }: { report: ReportListItem }) {
  const date = new Date(report.created_at).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rg = report.rg != null ? Number(report.rg) : null;
  const uniformity = report.uniformity != null ? Number(report.uniformity) : null;

  return (
    <Link
      to={`/report/${report.id}`}
      className="flex items-center gap-5 bg-card-white border border-border rounded-lg px-5 py-4 hover:border-signify-dark/30 hover:shadow-md transition-all"
    >
      {/* Left: name + meta */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-signify-dark leading-snug truncate">
          {report.project_name}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-signify-gray">
          {report.project_number && (
            <span className="font-mono">{report.project_number}</span>
          )}
          {report.project_town && (
            <span>{report.project_town}</span>
          )}
        </div>
      </div>

      {/* Center: key metrics */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        {uniformity != null && (
          <MetricPill
            label="E"
            subscript="min/m"
            value={uniformity.toFixed(2).replace('.', ',')}
            passed={uniformity > 0.5}
          />
        )}
        {rg != null && (
          <MetricPill
            label="R"
            subscript="G"
            value={rg.toFixed(1).replace('.', ',')}
            passed={rg < 55}
          />
        )}
      </div>

      {/* Right: wattage + date */}
      <div className="flex-shrink-0 text-right">
        {report.project_wattage != null && (
          <p className="text-sm font-mono font-semibold text-signify-dark">
            {Number(report.project_wattage).toLocaleString('de-DE')} W
          </p>
        )}
        <p className="text-xs text-signify-gray mt-0.5">{date}</p>
      </div>
    </Link>
  );
}

function MetricPill({ label, subscript, value, passed }: {
  label: string; subscript: string; value: string; passed: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold ${
      passed ? 'bg-pass-green/10 text-pass-green' : 'bg-fail-red/10 text-fail-red'
    }`}>
      {label}<sub className="text-[9px]">{subscript}</sub>{' '}{value}
      <span className="ml-0.5">{passed ? '✓' : '✗'}</span>
    </span>
  );
}

/** Group reports by project_name, sorted alphabetically. Reports within each group sorted newest first. */
function useGroupedReports(reports: ReportListItem[]) {
  return useMemo(() => {
    const groups = new Map<string, ReportListItem[]>();
    for (const r of reports) {
      const key = r.project_name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    // Sort groups alphabetically by project name
    const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'de'));
    // Within each group, reports are already newest-first from the API
    return sorted;
  }, [reports]);
}

export function ProjectListPage() {
  const { reports, loading, error } = useReportList();
  const grouped = useGroupedReports(reports);

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-[900px] mx-auto px-8 py-5 flex items-center justify-between">
          <SignifyLogo className="h-8" />
          <ThemeSwitcher />
        </div>
      </header>

      <div className="gradient-accent" />

      <div className="max-w-[900px] mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold text-signify-dark mb-1">
          LightMap Berichte
        </h1>
        <p className="text-sm text-signify-gray mb-8">
          Alle Beleuchtungsvorschläge im Überblick
        </p>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <div
              className="inline-block w-6 h-6 border-2 border-signify-gray/30 border-t-signify-dark rounded-full animate-spin"
              role="status"
            />
            <p className="mt-3 text-sm text-signify-gray">Laden...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-card-white border border-border rounded-lg p-8 text-center">
            <p className="text-signify-dark font-medium mb-2">
              Berichte konnten nicht geladen werden
            </p>
            <p className="text-sm text-signify-gray mb-4">{error}</p>
            <Link
              to="/report/mock"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-signify-dark rounded hover:opacity-90 transition-colors"
            >
              Demo-Bericht anzeigen
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="bg-card-white border border-border rounded-lg p-8 text-center">
            <p className="text-signify-dark font-medium mb-2">
              Keine Berichte vorhanden
            </p>
            <p className="text-sm text-signify-gray mb-4">
              Berichte werden über die LightMap Planner API erstellt.
            </p>
            <Link
              to="/report/mock"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-signify-dark rounded hover:opacity-90 transition-colors"
            >
              Demo-Bericht anzeigen
            </Link>
          </div>
        )}

        {/* Grouped report cards */}
        {!loading && !error && grouped.length > 0 && (
          <div className="flex flex-col gap-8">
            {grouped.map(([projectName, groupReports]) => (
              <div key={projectName}>
                {/* Project name header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-bold text-signify-dark">{projectName}</h2>
                  <span className="text-xs text-signify-gray font-mono">
                    {groupReports.length} {groupReports.length === 1 ? 'Bericht' : 'Berichte'}
                  </span>
                </div>
                <div className="border-b border-border mb-3" />
                {/* Reports within group, newest first */}
                <div className="flex flex-col gap-2">
                  {groupReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dev fallback link */}
        {!loading && !error && reports.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/report/mock"
              className="text-xs text-signify-gray hover:text-signify-dark transition-colors"
            >
              Demo-Bericht (Mock-Daten)
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
