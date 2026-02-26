/* ─── Core Data Types (matching PostgreSQL schema) ─── */

export interface Project {
  id: number;
  project_name: string;
  project_number: string | null;
  project_address: string | null;
  project_town: string | null;
  project_creation_date: string | null;
  field_length: number;
  field_width: number;
  field_area: number;
  project_wattage: number;
  utm_epsg_code: string | null;
  elevation: number;
}

export interface FieldResult {
  id: number;
  project_id: number;
  /** Total Area - average horizontal illuminance */
  ta_ehave: number;
  /** Total Area - minimum horizontal illuminance */
  ta_ehmin: number;
  /** Total Area - uniformity (Emin/Eave) */
  ta_u: number;
  /** Playing Area - average horizontal illuminance */
  pa_ehave: number;
  /** Playing Area - minimum horizontal illuminance */
  pa_ehmin: number;
  /** Playing Area - uniformity (Emin/Eave) */
  pa_u: number;
  /** Glare Rating RG */
  rg: number;
}

export interface CalculationPoint {
  id: number;
  project_id: number;
  /** Grid x position (local coordinates) */
  x: number;
  /** Grid y position (local coordinates) */
  y: number;
  /** Horizontal illuminance (lux) */
  eh: number;
  /** Vertical illuminance (lux) — NULL in dump */
  ev: number | null;
  /** Relux reference value — NULL in dump */
  eh_relux: number | null;
  /** Delta between calculated and reference — NULL in dump */
  eh_delta: number | null;
  /** Percentage difference — NULL in dump */
  eh_percentage: number | null;
  /** Glare contribution angles (e.g. "169.01 / 73.37") */
  cg_angles: string | null;
  /** Glare contribution intensities — NULL in dump */
  cg_int: string | null;
  /** Candela value */
  cd: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface LightPoint {
  id: number;
  project_id: number;
  x: number;
  y: number;
  mastheight: number;
  direction_id: number | null;
  tilt: number;
  ldt_file_name: string | null;
}

export interface Direction {
  id: number;
  project_id: number;
  /** NULL in dump — vector is derived from geometrylocal LineString */
  vector: Vector3D | null;
  /** Aiming line: [mastPosition, aimingPoint] in local coords */
  aimingLine?: { x: number; y: number }[];
}

export interface Building {
  id: number;
  project_id: number;
  height: number;
  elevation: number;
  elevation_relative: number;
  ksmax: number;
  evmax: number;
}

export interface BuildingPoint {
  id: number;
  building_id: number;
  level: number;
  normal: Vector3D;
  ks_max: number;
  ev_max: number;
}

export interface Luminaire {
  id: number;
  name: string;
  num_lamps: number[];
  type_lamps: string[];
  flux: number[];
  colour: string[];
  rendering: string[];
  wattage: number[];
  lamp_type: string[];
  ldtpath: string;
  ldtfilename: string;
}

/* ─── Field Specification ─── */

export interface FieldSpecification {
  sportType: string;
  standard: string;
  lightingClass: string;
  colorTemperature: string;
  maintenanceFactor: number;
  mountingHeight: number;
}

/* ─── LAI Requirements (Residents / Light immission) ─── */

export interface LAIRequirements {
  areaType: string;
  assessmentTime: string;
  evMaxLimit: number;
  ksMaxLimit: number;
}

/* ─── Glossary ─── */

export interface GlossaryTerm {
  term: string;
  subscript?: string;
  definition: string;
  category: 'lighting' | 'lai';
}

/* ─── Report-specific types ─── */

export interface ResultMetric {
  label: string;
  /** Subscript text, e.g. "m" for E_m */
  subscript?: string;
  requirement: string;
  result: string;
  passed: boolean;
  unit?: string;
  /** Data source for audit badge (dump, pdf, invented, mismatch) */
  source?: 'dump' | 'pdf' | 'invented' | 'mismatch';
}

export interface LuminaireListEntry {
  luminaireName: string;
  mastNumber: number;
  position: Vector3D;
  aimingPoint: { x: number; y: number };
  rotation: number;
  tilt: number;
  colorDot: string;
}

export interface ReportData {
  project: Project;
  results: FieldResult[];
  calculationPoints: CalculationPoint[];
  lightpoints: LightPoint[];
  directions: Direction[];
  buildings: Building[];
  buildingPoints: BuildingPoint[];
  luminaires: Luminaire[];
  luminaireList: LuminaireListEntry[];
}

/* ─── Full API payload (ReportData + supplementary data) ─── */

export type { GeoCenter } from '../utils/coordinates';

export interface BuildingFacade {
  label: string;
  line: { x: number; y: number }[];
}

export interface ReportPayload extends ReportData {
  geoCenter: import('../utils/coordinates').GeoCenter;
  fieldSpec: FieldSpecification;
  laiRequirements: LAIRequirements;
  glossaryTerms: GlossaryTerm[];
  fieldMetrics: ResultMetric[];
  buildingFacades: BuildingFacade[];
}
