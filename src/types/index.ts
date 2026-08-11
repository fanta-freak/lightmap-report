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
  /** Playing Area - maximum horizontal illuminance.
   *  2026-08-07 ergaenzt: Der Bericht nahm Emax bis dahin aus dem
   *  Rasterfeld, das aber zum jeweils LETZTEN Lauf gehoert und nicht zu dem
   *  Lauf, dessen Kennzahlen daneben stehen. Die Engine liefert den Wert
   *  ohnehin mit. */
  pa_ehmax: number;
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
  /** Leistung dieses Mastes in W. Erst ab 10.08.2026 im Payload — aeltere
   *  Berichte haben das Feld nicht, deshalb optional. */
  wattage?: number | null;
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
  /** Alle im Projekt vorkommenden Masthoehen. `mountingHeight` ist nur die
   *  erste davon — bei gemischten Hoehen stand dort bisher eine willkuerliche
   *  Zahl. Ab 10.08.2026 im Payload, deshalb optional. */
  mountingHeights?: number[];
}

/* ─── Identitaet des gedruckten Laufs ─── */

/**
 * Welche Berechnung steht in diesem Bericht?
 *
 * Bis 10.08.2026 stand im Kopf fest "Version: V1" und als Datum das
 * Anlagedatum des PROJEKTS — drei Laeufe ergaben drei identische Koepfe.
 *
 * `geometry_matches`: Kennzahlen kommen aus dem gewaehlten Lauf, Mastliste,
 * Karte und Heatmap dagegen aus der gespeicherten Geometrie. Bis zum
 * 11.08.2026 gab es die nur EINMAL je Projekt — die Rechenkette ueberschrieb
 * dieselben Mast-Zeilen bei jedem Lauf, ein Bericht ueber einen aelteren Lauf
 * zeigte also fremde Masten. Seither legt die Kette je Berechnung einen Abzug
 * an (`geometry_source: 'snapshot'`), und das Flag steht bei neu gerechneten
 * Varianten immer auf true.
 *
 * false heisst jetzt nur noch: dieser Lauf stammt aus der Zeit davor, seine
 * Geometrie ist nicht mehr vorhanden, gezeichnet wird ein spaeterer Stand.
 * `geometry_source` sagt, aus welcher Quelle der Bericht gezeichnet hat —
 * 'snapshot' = Abzug dieses Laufs, 'live' = aktueller Stand des Projekts.
 * Aeltere Berichte kennen das Feld nicht, deshalb optional.
 */
export interface CalculationInfo {
  id: number | null;
  label: string | null;
  version: string | null;
  created_at: string | null;
  best_fitness: number | null;
  geometry_calculation_id: number | null;
  geometry_matches: boolean;
  geometry_source?: 'snapshot' | 'live';
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
  /** Leistung dieses Mastes in W (aus lightpoints.wattage). */
  wattage?: number | null;
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
  /** Fehlt in Berichten von vor dem 10.08.2026. */
  calculation?: CalculationInfo;
  fieldSpec: FieldSpecification;
  laiRequirements: LAIRequirements;
  glossaryTerms: GlossaryTerm[];
  fieldMetrics: ResultMetric[];
  buildingFacades: BuildingFacade[];
}
