import type { ReportPayload } from '../types';

export interface ReportListItem {
  id: number;
  project_name: string;
  project_number: string | null;
  project_town: string | null;
  project_wattage: number | null;
  created_at: string;
  /** Glare Rating RG from results[0] */
  rg: number | null;
  /** Uniformity Emin/Em from results[0].ta_u */
  uniformity: number | null;
}

export interface ReportDetail {
  id: number;
  project_name: string;
  project_number: string | null;
  created_at: string;
  payload: ReportPayload;
}
