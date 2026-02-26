import type { ReportPayload } from '../types';

export interface ReportListItem {
  id: number;
  project_name: string;
  project_number: string | null;
  project_town: string | null;
  project_wattage: number | null;
  created_at: string;
}

export interface ReportDetail {
  id: number;
  project_name: string;
  project_number: string | null;
  created_at: string;
  payload: ReportPayload;
}
