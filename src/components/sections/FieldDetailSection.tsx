import type { ReportData, FieldSpecification } from '../../types';
import { ReportMap } from '../map/ReportMap';
import type { GeoCenter } from '../../utils/coordinates';
import { SourceBadge, type DataSource } from '../shared/SourceBadge';

interface FieldDetailSectionProps {
  data: ReportData;
  fieldNumber: number;
  spec: FieldSpecification;
  geoCenter: GeoCenter;
}

export function FieldDetailSection({ data, fieldNumber, spec, geoCenter }: FieldDetailSectionProps) {
  const { project, lightpoints, directions } = data;
  const halfW = project.field_width / 2;
  const halfL = project.field_length / 2;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="section-accent w-1 h-8 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-signify-dark">
            Feldbeschreibung Feld {fieldNumber}
          </h1>
          <p className="text-sm text-signify-gray">
            Technische Daten und Mastpositionen
          </p>
        </div>
      </div>

      {/* Two-column: Specs + Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lighting specification card */}
        <div className="bg-card-white rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-bg-light">
            <h3 className="text-lg font-bold text-signify-dark">Beleuchtungsdaten</h3>
            <p className="text-xs text-signify-gray mt-0.5">Lichttechnische Vorgaben</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <SpecRow label="Sportart" value={spec.sportType} source="pdf" />
            <SpecRow label="Normgrundlage" value={spec.standard} source="pdf" />
            <SpecRow label="Beleuchtungsklasse" value={spec.lightingClass} source="pdf" />
            <SpecRow label="Farbtemperatur" value={spec.colorTemperature} source="pdf" />
            <SpecRow label="Wartungsfaktor" value={spec.maintenanceFactor.toFixed(2).replace('.', ',')} source="pdf" />
            <SpecRow label="Masthöhe" value={`${spec.mountingHeight} m`} source="dump" />
          </div>
        </div>

        {/* Field dimensions card */}
        <div className="bg-card-white rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-bg-light">
            <h3 className="text-lg font-bold text-signify-dark">Felddimensionen</h3>
            <p className="text-xs text-signify-gray mt-0.5">Maße und Flächen</p>
          </div>
          <div className="px-6 py-5">
            {/* Visual field diagram */}
            <div className="flex justify-center mb-6">
              <FieldDiagram
                length={project.field_length}
                width={project.field_width}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DimCard label="Länge" value={`${project.field_length} m`} source="dump" />
              <DimCard label="Breite" value={`${project.field_width} m`} source="dump" />
              <DimCard label="Gesamtfläche" value={`${project.field_area.toLocaleString('de-DE')} m²`} source="dump" />
              <DimCard label="Koordinatenbereich" value={`±${halfL} × ±${halfW} m`} source="dump" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive map */}
      <ReportMap
        geoCenter={geoCenter}
        halfWidth={halfW}
        halfLength={halfL}
        masts={lightpoints}
        directions={directions}
        showMastLabels={true}
        showBuildingLabels={false}
        height={400}
      />

      {/* Mast positions table */}
      <div className="bg-card-white rounded-lg border border-border overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-bg-light">
          <h3 className="text-lg font-bold text-signify-dark">Mastpositionen</h3>
          <p className="text-xs text-signify-gray mt-0.5">
            Maste wurden auf Basis der grafischen Eingabe symmetriert
          </p>
        </div>
        <div className="px-8 py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Mast
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  X (Breite)
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Y (Länge)
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Höhe
                </th>
                <th className="text-right py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider">
                  Neigung
                </th>
                <th className="text-left py-3 text-sm font-semibold text-signify-gray uppercase tracking-wider pl-4">
                  Leuchtentyp
                </th>
              </tr>
            </thead>
            <tbody>
              {lightpoints.map((mast, i) => (
                <tr
                  key={mast.id}
                  className="border-b border-gray-50 hover:bg-signify-teal/5 transition-colors"
                >
                  <td className="py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-signify-dark text-white text-sm font-bold">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{mast.x.toFixed(1).replace('.', ',')} m</SourceBadge>
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{mast.y.toFixed(1).replace('.', ',')} m</SourceBadge>
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{mast.mastheight} m</SourceBadge>
                  </td>
                  <td className="py-3 text-right font-mono text-sm text-signify-dark">
                    <SourceBadge source="dump">{mast.tilt}°</SourceBadge>
                  </td>
                  <td className="py-3 text-left pl-4">
                    <span className="text-sm text-signify-dark truncate block max-w-[260px]" title={mast.ldt_file_name ?? ''}>
                      {mast.ldt_file_name ?? <SourceBadge source="dump"><span className="italic text-signify-gray">NULL</span></SourceBadge>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── Helpers ─── */

function SpecRow({ label, value, source }: { label: string; value: string; source?: DataSource }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-signify-gray">{label}</span>
      <span className="text-sm font-semibold text-signify-dark">
        {source ? <SourceBadge source={source}>{value}</SourceBadge> : value}
      </span>
    </div>
  );
}

function DimCard({ label, value, source }: { label: string; value: string; source?: DataSource }) {
  return (
    <div className="bg-bg-light rounded p-3 border border-gray-100">
      <p className="text-xs text-signify-gray mb-0.5">{label}</p>
      <p className="text-base font-bold text-signify-dark">
        {source ? <SourceBadge source={source}>{value}</SourceBadge> : value}
      </p>
    </div>
  );
}

function FieldDiagram({ length, width }: { length: number; width: number }) {
  // Landscape SVG: horizontal = length, vertical = width
  const svgW = 240;
  const svgH = (width / length) * svgW;
  const pad = 24;

  return (
    <svg width={svgW + pad * 2} height={svgH + pad * 2} className="text-signify-gray">
      {/* Field outline */}
      <rect
        x={pad}
        y={pad}
        width={svgW}
        height={svgH}
        fill="none"
        stroke="#00B8A9"
        strokeWidth={2}
        rx={4}
      />
      {/* Center line */}
      <line
        x1={pad + svgW / 2}
        y1={pad}
        x2={pad + svgW / 2}
        y2={pad + svgH}
        stroke="#00B8A9"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      {/* Center circle */}
      <circle
        cx={pad + svgW / 2}
        cy={pad + svgH / 2}
        r={Math.min(svgW, svgH) * 0.15}
        fill="none"
        stroke="#00B8A9"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      {/* Length label (bottom) */}
      <text
        x={pad + svgW / 2}
        y={pad + svgH + 18}
        textAnchor="middle"
        className="text-xs font-semibold"
        fill="#1A1A2E"
      >
        {length} m
      </text>
      {/* Width label (right) */}
      <text
        x={pad + svgW + 18}
        y={pad + svgH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold"
        fill="#1A1A2E"
        transform={`rotate(-90, ${pad + svgW + 18}, ${pad + svgH / 2})`}
      >
        {width} m
      </text>
    </svg>
  );
}
