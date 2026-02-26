import type { ReportData, ResultMetric } from '../../types';
import { ResultsTable } from '../shared/ResultsTable';
import { IlluminanceGrid } from '../heatmap/IlluminanceGrid';

interface FieldResultsSectionProps {
  data: ReportData;
  fieldNumber: number;
  metrics: ResultMetric[];
}

export function FieldResultsSection({ data, fieldNumber, metrics }: FieldResultsSectionProps) {
  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="section-accent w-1 h-8 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-signify-dark">
            Berechnungsergebnis Feld {fieldNumber}
          </h1>
          <p className="text-sm text-signify-gray">
            Erläuterung siehe Glossar
          </p>
        </div>
      </div>

      {/* Results table with pass/fail */}
      <ResultsTable
        title="Fußball Klasse III"
        subtitle="Lichttechnische Ergebnisse nach EN 12193"
        metrics={metrics}
      />

      {/* Illuminance heatmap */}
      <IlluminanceGrid
        points={data.calculationPoints}
        masts={data.lightpoints}
        directions={data.directions}
        fieldLength={data.project.field_length}
        fieldWidth={data.project.field_width}
      />
    </section>
  );
}
