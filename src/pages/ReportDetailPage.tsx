import { useParams, Link } from 'react-router-dom';
import { SignifyLogo } from '../components/shared/SignifyLogo';
import { SourceBadge, SourceLegend, SourceBadgeProvider, type DataSource } from '../components/shared/SourceBadge';
import { ThemeSwitcher } from '../components/shared/ThemeSwitcher';
import { FieldDetailSection } from '../components/sections/FieldDetailSection';
import { FieldResultsSection } from '../components/sections/FieldResultsSection';
import { ResidentsSection } from '../components/sections/ResidentsSection';
import { LuminaireSection } from '../components/sections/LuminaireSection';
import { GlossarySection } from '../components/sections/GlossarySection';
import { AbschnittSicherung } from '../components/shared/AbschnittSicherung';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { useReportData } from '../hooks/useReportData';
import { grosseZahl } from '../utils/format';
import { gesamtleistung } from '../utils/dataFallbacks';

function StatCard({ label, value, source }: { label: string; value: string; source?: DataSource }) {
  return (
    <div className="stat-card-bg bg-bg-page p-4">
      <p className="text-xs text-signify-gray mb-1">{label}</p>
      <p className="stat-value text-lg font-semibold text-signify-dark font-mono">
        {source ? <SourceBadge source={source}>{value}</SourceBadge> : value}
      </p>
    </div>
  );
}

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: report, loading, error } = useReportData(id);

  if (loading) return <LoadingSpinner />;
  if (error || !report) return <ErrorMessage message={error} />;

  const data = report.payload;

  // Version und Datum gehoeren zur gedruckten BERECHNUNG, nicht zum Projekt.
  // Bis 10.08.2026 stand hier fest "V1" und das Anlagedatum des Projekts —
  // drei Laeufe desselben Projekts ergaben drei identisch beschriftete
  // Berichte. Aeltere Berichte tragen den calculation-Block nicht; fuer die
  // bleibt es beim alten Verhalten, damit sie sich nicht ruecklings aendern.
  // Gesamtleistung: Projekt-Aggregat, sonst Summe der Masten (s. Helfer).
  const anlagenLeistung = gesamtleistung(data.project.project_wattage, data.lightpoints);

  const version = data.calculation?.version ?? 'V1';
  const berechnungsDatum =
    data.calculation?.created_at ?? data.project.project_creation_date;

  const handlePdfExport = () => {
    window.print();
  };

  return (
    <SourceBadgeProvider>
    <div className="min-h-screen bg-bg-page">
      {/* ─── Document Header ─── */}
      <header className="border-b border-border">
        <div className="max-w-[900px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SignifyLogo className="h-8" />
            <Link
              to="/"
              className="no-print text-xs text-signify-gray hover:text-signify-dark transition-colors"
            >
              Alle Projekte
            </Link>
          </div>
          <div className="flex items-center gap-3 no-print">
            <ThemeSwitcher />
            <button
              onClick={handlePdfExport}
              className="pdf-export-btn bg-signify-dark text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 transition-all"
            >
              PDF Export
            </button>
          </div>
        </div>
      </header>

      {/* ─── Gradient accent line ─── */}
      <div className="gradient-accent" />

      {/* ─── Document body ─── */}
      <div className="max-w-[900px] mx-auto px-8">

        {/* Data source legend (temporary audit) */}
        <div className="pt-6 no-print">
          <SourceLegend />
        </div>

        {/* ─── Cover / Title block ─── */}
        <div id="overview" className="py-10 border-b border-border">
          <p className="text-sm font-medium text-signify-gray uppercase tracking-widest mb-3">
            Beleuchtungsvorschlag
          </p>
          <h1 className="text-3xl font-bold text-signify-dark mb-2 leading-tight">
            <SourceBadge source="pdf">{data.project.project_name}</SourceBadge>
          </h1>
          <p className="text-signify-gray mb-1">
            <SourceBadge source="pdf">{data.project.project_address}</SourceBadge>
          </p>
          <p className="text-signify-gray mb-8">
            <SourceBadge source="pdf">{data.project.project_town}</SourceBadge>
          </p>

          {/* Project meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded overflow-hidden">
            <StatCard label="Feldfläche" value={`${grosseZahl(data.project.field_area)} m²`} source="dump" />
            <StatCard label="Leistung" value={`${grosseZahl(anlagenLeistung)} W`} source="dump" />
            <StatCard label="Masten" value={String(data.lightpoints.length)} source="dump" />
            <StatCard label="Leuchten" value={String(data.luminaireList.length)} source="dump" />
          </div>

          {/* Project details */}
          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-1 text-sm text-signify-gray">
            <span>Projektnummer: <strong className="text-signify-dark">{data.project.project_number}</strong></span>
            <span>Version: <strong className="text-signify-dark">{version}</strong></span>
            <span>Datum: <strong className="text-signify-dark">{berechnungsDatum}</strong></span>
          </div>

          {/* ── Kein Hinweiskasten zur Geometrie mehr (11.08.2026) ───────────
              Hier stand bis heute eine Warnung, wenn Kennzahlen und
              Zeichnungen aus verschiedenen Berechnungen stammten. Sie ist
              raus, aus zwei Gruenden:

              1. Der Fall selbst ist behoben. Seit Migration 0014 haelt jede
                 Berechnung ihre eigene Geometrie fest (Backend
                 calculation_geometry.py); neu gerechnete Laeufe koennen gar
                 nicht mehr auseinanderlaufen.
              2. Uebrig blieb er nur fuer Laeufe von VOR dem 11.08. Fuer die
                 hilft er dem Leser des Berichts nicht — er kann nichts daran
                 aendern, und ein roter Kasten im Beleuchtungsvorschlag liest
                 sich wie ein Mangel der Anlage.

              Die Information bleibt im Payload: `calculation.geometry_matches`
              und `geometry_source` kommen weiter mit und lassen sich jederzeit
              wieder anzeigen oder auswerten — sie werden nur nicht mehr
              gedruckt. Entscheidung Philip, 11.08.2026. */}
        </div>

        {/* ─── Report sections ─── */}
        <main className="space-y-0">
          <div id="field-detail" className="py-10 border-b border-border scroll-mt-16 print-break-before">
            <AbschnittSicherung name="Feldbeschreibung">
              <FieldDetailSection
                data={data}
                fieldNumber={1}
                spec={data.fieldSpec}
                geoCenter={data.geoCenter}
              />
            </AbschnittSicherung>
          </div>

          <div id="field-results" className="py-10 border-b border-border scroll-mt-16 print-break-before">
            <AbschnittSicherung name="Berechnungsergebnis">
              <FieldResultsSection
                data={data}
                fieldNumber={1}
                metrics={data.fieldMetrics}
                spec={data.fieldSpec}
              />
            </AbschnittSicherung>
          </div>

          <div id="residents" className="py-10 border-b border-border scroll-mt-16 print-break-before">
            <AbschnittSicherung name="Anwohner">
              <ResidentsSection
                data={data}
                laiRequirements={data.laiRequirements}
                geoCenter={data.geoCenter}
                buildingFacades={data.buildingFacades}
              />
            </AbschnittSicherung>
          </div>

          <div id="luminaires" className="py-10 border-b border-border scroll-mt-16 print-break-before">
            <AbschnittSicherung name="Leuchten">
              <LuminaireSection data={data} />
            </AbschnittSicherung>
          </div>

          <div id="glossary" className="py-10 scroll-mt-16 print-break-before">
            <AbschnittSicherung name="Glossar">
              <GlossarySection terms={data.glossaryTerms} />
            </AbschnittSicherung>
          </div>
        </main>
      </div>

      {/* ─── Gradient accent line ─── */}
      <div className="gradient-accent" />

      {/* ─── Document Footer ─── */}
      <footer className="bg-bg-page">
        <div className="max-w-[900px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="text-xs text-signify-gray">
            <p>&copy; Signify GmbH</p>
            <p>{berechnungsDatum}</p>
          </div>
          <p className="text-xs text-signify-gray text-center">
            Projekt {data.project.project_number}, Version {version.replace(/^V/, '')}, {data.project.project_name}
          </p>
          <SignifyLogo className="h-6" />
        </div>
      </footer>
    </div>
    </SourceBadgeProvider>
  );
}
