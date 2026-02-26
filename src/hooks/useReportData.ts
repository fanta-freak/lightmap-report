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

interface UseReportDataResult {
  data: ReportDetail | null;
  loading: boolean;
  error: string | null;
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
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}
