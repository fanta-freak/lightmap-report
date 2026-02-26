import type { ReportListItem, ReportDetail } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchReportList(): Promise<ReportListItem[]> {
  const res = await fetch(`${API_BASE}/api/reports`);
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
  return res.json();
}

export async function fetchReport(id: string): Promise<ReportDetail> {
  const res = await fetch(`${API_BASE}/api/reports/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Report not found');
    throw new Error(`Failed to fetch report: ${res.status}`);
  }
  return res.json();
}
