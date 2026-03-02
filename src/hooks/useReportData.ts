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
function applyFallbacks(report: ReportDetail): ReportDetail {
  const p = report.payload;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = p as any;

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
      : synthesizeLuminaireList(p.lightpoints, p.directions, p.luminaires);

  // Auto-compute fieldMetrics from results[] + calculationPoints if empty
  const fieldMetrics =
    p.fieldMetrics && p.fieldMetrics.length > 0
      ? p.fieldMetrics
      : computeFieldMetrics(p.calculationPoints, p.results);

  // Always attach glossary from mock data (not expected from API)
  const glossaryTerms =
    p.glossaryTerms && p.glossaryTerms.length > 0
      ? p.glossaryTerms
      : mockGlossaryTerms;

  return {
    ...report,
    payload: {
      ...p,
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
