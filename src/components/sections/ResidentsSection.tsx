import type { ReportData, LAIRequirements } from '../../types';
import { PassFailBadge } from '../shared/PassFailBadge';
import { SourceBadge, type DataSource } from '../shared/SourceBadge';
import { ReportMap } from '../map/ReportMap';
import type { GeoCenter } from '../../utils/coordinates';

interface ResidentsSectionProps {
  data: ReportData;
  laiRequirements: LAIRequirements;
  geoCenter: GeoCenter;
  buildingFacades: { label: string; line: { x: number; y: number }[] }[];
}

export function ResidentsSection({ data, laiRequirements, geoCenter, buildingFacades }: ResidentsSectionProps) {
  const { buildings, lightpoints, directions } = data;
  const halfW = data.project.field_width / 2;
  const halfL = data.project.field_length / 2;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="section-accent w-1 h-8 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-signify-dark">
            Anwohner
          </h1>
          <p className="text-sm text-signify-gray">
            Lichtimmissionen und Bewertungsgrundlage
          </p>
        </div>
      </div>

      {/* Two-column: LAI requirements + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LAI Requirements card */}
        <div className="bg-card-white rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-bg-light">
            <h3 className="text-lg font-bold text-signify-dark">Bewertungsgrundlage</h3>
            <p className="text-xs text-signify-gray mt-0.5">nach LAI-Richtlinie 2012</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <InfoRow label="Gebietsart" value={laiRequirements.areaType} source="pdf" />
            <InfoRow label="Bewertungszeit" value={laiRequirements.assessmentTime} source="pdf" />
            <div className="pt-2 mt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-signify-gray uppercase tracking-wider mb-3">
                Grenzwerte
              </p>
              <div className="grid grid-cols-2 gap-3">
                <LimitCard
                  label="Max. E_v"
                  subscript="v"
                  value={`${laiRequirements.evMaxLimit} lux`}
                  source="pdf"
                />
                <LimitCard
                  label="Max. k_s"
                  subscript="s"
                  value={`${laiRequirements.ksMaxLimit}`}
                  source="pdf"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-card-white rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-bg-light">
            <h3 className="text-lg font-bold text-signify-dark">Bewertungsergebnis</h3>
            <p className="text-xs text-signify-gray mt-0.5">Zusammenfassung aller Fassaden</p>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <SummaryCard
                label="Fassaden"
                value={String(buildings.length)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                }
              />
              <SummaryCard
                label="Alle bestanden"
                value={buildings.every((b) => b.evmax <= laiRequirements.evMaxLimit && b.ksmax <= laiRequirements.ksMaxLimit) ? 'Ja' : 'Nein'}
                icon={
                  buildings.every((b) => b.evmax <= laiRequirements.evMaxLimit && b.ksmax <= laiRequirements.ksMaxLimit)
                    ? <PassFailBadge passed={true} size="md" />
                    : <PassFailBadge passed={false} size="md" />
                }
              />
            </div>

            {/* Max values found */}
            <div className="bg-bg-light rounded p-4 border border-gray-100">
              <p className="text-xs font-semibold text-signify-gray uppercase tracking-wider mb-3">
                Höchstwerte über alle Fassaden
              </p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-signify-gray">
                  Max. E<sub className="text-xs">v</sub>
                </span>
                <span className={`text-sm font-bold font-mono ${
                  Math.max(...buildings.map((b) => b.evmax)) <= laiRequirements.evMaxLimit
                    ? 'text-pass-green' : 'text-fail-red'
                }`}>
                  {Math.max(...buildings.map((b) => b.evmax)).toFixed(1).replace('.', ',')} lux
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-signify-gray">
                  Max. k<sub className="text-xs">s</sub>
                </span>
                <span className={`text-sm font-bold font-mono ${
                  Math.max(...buildings.map((b) => b.ksmax)) <= laiRequirements.ksMaxLimit
                    ? 'text-pass-green' : 'text-fail-red'
                }`}>
                  {Math.max(...buildings.map((b) => b.ksmax))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map with field + building outlines */}
      <ReportMap
        geoCenter={geoCenter}
        halfWidth={halfW}
        halfLength={halfL}
        masts={lightpoints}
        directions={directions}
        buildingFacades={buildingFacades}
        showMastLabels={true}
        showBuildingLabels={true}
        height={400}
      />

      {/* Building / Facade table */}
      <div className="bg-card-white rounded-lg border border-border overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-bg-light">
          <h3 className="text-lg font-bold text-signify-dark">Fassadenbewertung</h3>
          <p className="text-xs text-signify-gray mt-0.5">
            Ergebnisse pro Gebäudefassade
          </p>
        </div>
        <div className="px-8 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Fassade
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Höhe
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Höhenlage
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  E<sub>v,max</sub>
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  k<sub>s,max</sub>
                </th>
                <th className="text-center py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((bld, i) => {
                const evPassed = bld.evmax <= laiRequirements.evMaxLimit;
                const ksPassed = bld.ksmax <= laiRequirements.ksMaxLimit;
                const passed = evPassed && ksPassed;

                return (
                  <tr
                    key={bld.id}
                    className="border-b border-gray-50 hover:bg-signify-teal/5 transition-colors"
                  >
                    <td className="py-3">
                      <span className="text-sm font-medium text-signify-dark">
                        Fassade {i + 1}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-signify-dark">
                      <SourceBadge source="dump">{bld.height} m</SourceBadge>
                    </td>
                    <td className="py-3 text-right font-mono text-sm text-signify-dark">
                      <SourceBadge source="dump">{bld.elevation} m</SourceBadge> (<SourceBadge source="invented">{bld.elevation_relative >= 0 ? '+' : ''}{bld.elevation_relative} m</SourceBadge>)
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-semibold font-mono ${evPassed ? 'text-signify-dark' : 'text-fail-red'}`}>
                        <SourceBadge source="pdf">{bld.evmax.toFixed(1).replace('.', ',')} lux</SourceBadge>
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-semibold font-mono ${ksPassed ? 'text-signify-dark' : 'text-fail-red'}`}>
                        <SourceBadge source="pdf">{bld.ksmax}</SourceBadge>
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <PassFailBadge passed={passed} size="md" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── Helpers ─── */

function InfoRow({ label, value, source }: { label: string; value: string; source?: DataSource }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-signify-gray">{label}</span>
      <span className="text-sm font-semibold text-signify-dark">
        {source ? <SourceBadge source={source}>{value}</SourceBadge> : value}
      </span>
    </div>
  );
}

function LimitCard({ label, value, source }: { label: string; subscript?: string; value: string; source?: DataSource }) {
  return (
    <div className="bg-bg-light rounded p-3 border border-gray-100 text-center">
      <p className="text-xs text-signify-gray mb-1">{label}</p>
      <p className="text-lg font-bold text-signify-dark">
        {source ? <SourceBadge source={source}>{value}</SourceBadge> : value}
      </p>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-bg-light rounded p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2 text-signify-teal">
        {icon}
      </div>
      <p className="text-xs text-signify-gray">{label}</p>
      <p className="text-xl font-bold text-signify-dark">{value}</p>
    </div>
  );
}
