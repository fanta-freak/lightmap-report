import type { ResultMetric } from '../../types';
import { PassFailBadge } from './PassFailBadge';
import { SourceBadge } from './SourceBadge';

interface ResultsTableProps {
  title: string;
  subtitle: string;
  metrics: ResultMetric[];
}

export function ResultsTable({ title, subtitle, metrics }: ResultsTableProps) {
  return (
    <div className="bg-card-white rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-bg-light">
        <h2 className="text-2xl font-bold text-signify-dark">{title}</h2>
        <p className="text-sm text-signify-gray mt-1">{subtitle}</p>
      </div>

      {/* Table */}
      <div className="px-8 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider w-[50%]">
                Kenngröße
              </th>
              <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider w-[20%]">
                Vorgabe
              </th>
              <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider w-[20%]">
                Ergebnis
              </th>
              <th className="text-center py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider w-[10%]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr
                key={index}
                className="border-b border-gray-50 hover:bg-signify-teal/3 transition-colors"
              >
                <td className="py-4 pr-4">
                  <span className="text-base text-signify-dark font-medium">
                    {metric.label}
                    {metric.subscript && (
                      <sub className="text-xs text-signify-gray ml-0.5">
                        {metric.subscript}
                      </sub>
                    )}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className="text-sm text-signify-gray font-mono">
                    {metric.requirement ? <SourceBadge source="pdf">{metric.requirement}</SourceBadge> : '\u2014'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className={`text-base font-semibold font-mono ${
                    metric.passed ? 'text-signify-dark' : 'text-fail-red'
                  }`}>
                    <SourceBadge source={metric.source ?? 'pdf'}>{metric.result}</SourceBadge>
                  </span>
                </td>
                <td className="py-4 text-center">
                  {metric.requirement && (
                    <PassFailBadge passed={metric.passed} size="md" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
