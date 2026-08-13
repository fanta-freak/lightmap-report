import type { ReportData, ResultMetric, FieldSpecification } from '../../types';
import { ResultsTable } from '../shared/ResultsTable';
import { IlluminanceGrid } from '../heatmap/IlluminanceGrid';

interface FieldResultsSectionProps {
  data: ReportData;
  fieldNumber: number;
  metrics: ResultMetric[];
  spec?: FieldSpecification;
}

export function FieldResultsSection({ data, fieldNumber, metrics, spec }: FieldResultsSectionProps) {
  // 10.08.2026: Der Titel stand fest auf "Fußball Klasse III" — auch fuer ein
  // Tennisprojekt. Sportart kommt jetzt aus der Projektart (Backend), die
  // Klasse weiterhin aus der Vorgabe im fieldSpec.
  const titel = [spec?.sportType, spec?.lightingClass].filter(Boolean).join(' ')
    || 'Fußball Klasse III';
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
      {/* 13.08.2026: bei editierten Norm-Vorgaben (fieldSpec.normEdited)
          nicht mehr "nach EN 12193" behaupten — der Nachweis lief gegen
          die angepassten Werte (siehe Vorgabe-Spalte). */}
      <ResultsTable
        title={titel}
        subtitle={
          spec?.normEdited
            ? 'Lichttechnische Ergebnisse nach editierten Vorgaben (Basis EN 12193)'
            : 'Lichttechnische Ergebnisse nach EN 12193'
        }
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
