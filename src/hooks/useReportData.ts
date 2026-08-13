import { useState, useEffect } from 'react';
import { fetchReport } from '../api/client';
import type { ReportDetail } from '../api/types';
import {
  mockReportData,
  mockFieldMetrics,
  mockFieldSpec,
  mockLAIRequirements,
  mockGlossaryTerms,
} from '../mock/mockData';
import { mockGeoCenter, mockBuildingFacades } from '../mock/mockGeo';
import { synthesizeLuminaireList, computeFieldMetrics } from '../utils/dataFallbacks';

interface UseReportDataResult {
  data: ReportDetail | null;
  loading: boolean;
  error: string | null;
}

/**
 * Apply data fallbacks and key normalization:
 * - Map `building_facades` (snake_case) → `buildingFacades` (camelCase)
 * - Synthesize missing luminaireList from lightpoints + directions + luminaires
 * - Auto-compute fieldMetrics from results[] + calculationPoints if empty
 */
/**
 * Zahlenfelder retten, die als Text ankommen.
 *
 * 2026-08-07: Reports von vor dem 20.05.2026 tragen in leeren Zahlenfeldern
 * den Text `"Test"` — der Sender ersetzte damals jedes fehlende Feld durch
 * diesen Platzhalter. In Koordinaten wird daraus NaN, die Karte wirft
 * `Invalid LngLat object: (NaN, Infinity)`, React bricht ab und der Nutzer
 * sieht eine weisse Seite (nachgewiesen an Report 10). Derselbe String hat
 * auch die Reportliste in der API abgeraeumt.
 *
 * Aus einem unbrauchbaren Wert wird hier `null`. Die Anzeige zeigt dann
 * einen Gedankenstrich, und wer die Koordinaten braucht, kann den Punkt
 * ueberspringen — beides besser als eine leere Seite.
 */
function zahlOderNull(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function punkteBereinigen<T extends { x?: unknown; y?: unknown }>(liste: T[] | undefined): T[] {
  if (!Array.isArray(liste)) return [];
  return liste
    .map((e) => ({ ...e, x: zahlOderNull(e.x), y: zahlOderNull(e.y) }))
    .filter((e) => e.x !== null && e.y !== null) as unknown as T[];
}

function applyFallbacks(report: ReportDetail): ReportDetail {
  const p = report.payload;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = p as any;

  // Masten und Rechenpunkte von Textwerten befreien (s. zahlOderNull).
  const lightpoints = punkteBereinigen(p.lightpoints);
  const calculationPoints = punkteBereinigen(p.calculationPoints);

  // Map snake_case key → camelCase (API sends building_facades, frontend expects buildingFacades)
  const buildingFacades =
    p.buildingFacades && p.buildingFacades.length > 0
      ? p.buildingFacades
      : raw.building_facades && raw.building_facades.length > 0
        ? raw.building_facades
        : [];

  // Synthesize luminaireList from lightpoints + directions + luminaires
  const luminaireList =
    p.luminaireList && p.luminaireList.length > 0
      ? p.luminaireList
      : synthesizeLuminaireList(lightpoints, p.directions, p.luminaires);

  // Auto-compute fieldMetrics from results[] + calculationPoints if empty.
  // fieldSpec liefert seit 13.08.2026 die editierbaren Norm-Vorgaben
  // (emTarget/uoTarget/rgMax) fuer die Vorgabe-Spalte und den Nachweis.
  const fieldMetrics =
    p.fieldMetrics && p.fieldMetrics.length > 0
      ? p.fieldMetrics
      : computeFieldMetrics(calculationPoints, p.results, p.fieldSpec);

  // Always attach glossary from mock data (not expected from API)
  const glossaryTerms =
    p.glossaryTerms && p.glossaryTerms.length > 0
      ? p.glossaryTerms
      : mockGlossaryTerms;

  return {
    ...report,
    payload: {
      ...p,
      lightpoints,
      calculationPoints,
      buildingFacades,
      luminaireList,
      fieldMetrics,
      glossaryTerms,
    },
  };
}

export function useReportData(id: string | undefined): UseReportDataResult {
  const [data, setData] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === 'mock') {
      setData({
        id: 0,
        project_name: mockReportData.project.project_name,
        project_number: mockReportData.project.project_number,
        created_at: new Date().toISOString(),
        payload: {
          ...mockReportData,
          geoCenter: mockGeoCenter,
          fieldSpec: mockFieldSpec,
          laiRequirements: mockLAIRequirements,
          glossaryTerms: mockGlossaryTerms,
          fieldMetrics: mockFieldMetrics,
          buildingFacades: mockBuildingFacades,
        },
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchReport(id)
      .then((report) => setData(applyFallbacks(report)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}
