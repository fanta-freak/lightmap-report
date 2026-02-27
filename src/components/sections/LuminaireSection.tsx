import type { ReportData } from '../../types';
import { SourceBadge, type DataSource } from '../shared/SourceBadge';

interface LuminaireSectionProps {
  data: ReportData;
}

export function LuminaireSection({ data }: LuminaireSectionProps) {
  const { luminaireList, luminaires, project } = data;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="section-accent w-1 h-8 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-signify-dark">Leuchtenliste</h1>
          <p className="text-sm text-signify-gray">
            Leuchten und Positionen
          </p>
        </div>
      </div>

      {/* Luminaire positions table */}
      <div className="bg-card-white rounded-lg border border-border overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-bg-light">
          <h3 className="text-lg font-bold text-signify-dark">Leuchtenpositionen</h3>
          <p className="text-xs text-signify-gray mt-0.5">
            {luminaireList.length} Leuchten auf {data.lightpoints.length} Masten
          </p>
        </div>
        <div className="px-4 py-4 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-xs font-semibold text-signify-gray uppercase tracking-wider">
                  Leuchte
                </th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-signify-gray uppercase tracking-wider">
                  Mast
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-signify-gray uppercase tracking-wider">
                  Position (X, Y, Z)
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-signify-gray uppercase tracking-wider">
                  Ausrichtpunkt (X, Y)
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-signify-gray uppercase tracking-wider">
                  Rotation
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-signify-gray uppercase tracking-wider">
                  Neigung
                </th>
              </tr>
            </thead>
            <tbody>
              {luminaireList.map((entry, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 hover:bg-signify-teal/5 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.colorDot }}
                      />
                      <span className="text-sm text-signify-dark truncate max-w-[220px]" title={entry.luminaireName}>
                        {entry.luminaireName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-signify-dark text-white text-xs font-bold">
                      {entry.mastNumber}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{fmt(entry.position.x)}, {fmt(entry.position.y)}, {fmt(entry.position.z)}</SourceBadge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{fmt(entry.aimingPoint.x)}, {fmt(entry.aimingPoint.y)}</SourceBadge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{entry.rotation}°</SourceBadge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{entry.tilt}°</SourceBadge>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Summary row */}
            <tfoot>
              <tr className="bg-signify-teal/5">
                <td colSpan={2} className="py-3 px-3 text-sm font-bold text-signify-dark">
                  Gesamt: {luminaireList.length} Leuchten
                </td>
                <td colSpan={4} className="py-3 px-3 text-right text-sm font-bold text-signify-dark">
                  Gesamtleistung: <SourceBadge source="dump">{project.project_wattage.toLocaleString('de-DE')} W</SourceBadge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Luminaire datasheets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {luminaires.map((lum) => (
          <div
            key={lum.id}
            className="bg-card-white rounded-lg border border-border overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-bg-light">
              <h4 className="text-base font-bold text-signify-dark">{lum.name}</h4>
              <p className="text-xs text-signify-gray mt-0.5">Leuchtendatenblatt</p>
            </div>
            <div className="px-6 py-5">
              {/* Luminaire illustration */}
              <div className="bg-bg-light rounded border border-border p-4 mb-5 flex items-center justify-center min-h-[140px]">
                <img
                  src={`${import.meta.env.BASE_URL}images/luminaire-default.webp`}
                  alt={lum.name}
                  className="max-h-[120px] object-contain"
                />
              </div>

              <div className="space-y-3">
                <DataRow label="Lichtstrom" value={`${lum.flux[0].toLocaleString('de-DE')} lm`} source="dump" />
                <DataRow label="Leistung" value={`${lum.wattage[0].toLocaleString('de-DE')} W`} source="dump" />
                <DataRow label="Lampentyp" value={lum.lamp_type.join(', ')} source="dump" />
                <DataRow label="Farbtemperatur" value={lum.colour.join(', ')} source="dump" />
                <DataRow label="Farbwiedergabe" value={`Ra ${lum.rendering.join(', ')}`} source="dump" />
                <DataRow label="Anzahl Lampen" value={String(lum.num_lamps[0])} source="dump" />
                <DataRow label="LDT-Datei" value={lum.ldtfilename} source="dump" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function fmt(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

function DataRow({ label, value, source }: { label: string; value: string; source?: DataSource }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-sm text-signify-gray">{label}</span>
      <span className="text-sm font-semibold text-signify-dark font-mono">
        {source ? <SourceBadge source={source}>{value}</SourceBadge> : value}
      </span>
    </div>
  );
}
