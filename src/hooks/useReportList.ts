import { useState, useEffect } from 'react';
import { fetchReportList } from '../api/client';
import type { ReportListItem } from '../api/types';

interface UseReportListResult {
  reports: ReportListItem[];
  loading: boolean;
  error: string | null;
}

export function useReportList(): UseReportListResult {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportList()
      .then(setReports)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { reports, loading, error };
}
