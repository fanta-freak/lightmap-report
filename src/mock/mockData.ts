import type {
  Project,
  FieldResult,
  CalculationPoint,
  LightPoint,
  Direction,
  Building,
  Luminaire,
  LuminaireListEntry,
  ResultMetric,
  ReportData,
  FieldSpecification,
  LAIRequirements,
  GlossaryTerm,
} from '../types';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DATA SOURCE LEGEND (temporary audit)                       ║
 * ║                                                             ║
 * ║  🟢 DUMP  — extracted from PostgreSQL sample dump           ║
 * ║  🔵 PDF   — read from the sample PDF report                ║
 * ║  🟡 INVENTED — made up / estimated (no source)             ║
 * ║  ⚠️  MISMATCH — dump and PDF differ (different configs)    ║
 * ║                                                             ║
 * ║  NOTE: Dump project = "Test" with BVP518 luminaire          ║
 * ║        PDF project  = "Sportplatz Hamburg" with BVP528       ║
 * ║        They share the same field geometry but different      ║
 * ║        lighting configurations.                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* ─── Project ─── */
export const mockProject: Project = {
  id: 4,                                                        // 🟢 DUMP
  project_name: 'Sportplatz Hamburg – Röntgenstraße',           // 🔵 PDF p1 (dump: "Test")
  project_number: 'SST-12341',                                  // 🔵 PDF p1 (dump: NULL)
  project_address: 'Röntgenstraße 22, 22335 Hamburg, Germany',  // 🔵 PDF p1 (dump: NULL)
  project_town: '22335 Hamburg',                                 // 🔵 PDF p1 (dump: NULL)
  project_creation_date: '12.12.2025',                           // 🔵 PDF p1 (dump: NULL)
  field_length: 106.84,                                           // 🟢 DUMP (derived: calc grid y extent = -53.42 to +53.42)
  field_width: 72.68,                                             // 🟢 DUMP (derived: calc grid x extent = -36.34 to +36.34)
  field_area: 7767,                                               // 🟢 DUMP (derived: 106.84 × 72.68)
  project_wattage: 6036,                                         // 🟢 DUMP (derived: 6 luminaires × 1006 W)
  utm_epsg_code: 'EPSG:32632',                               // 🟢 DUMP
  elevation: 32,                                           // 🟢 DUMP
};

/* ─── Results ─── */
// 🟢 DUMP (calculated) — derived from 273 calc grid points
// Results table is empty in the dump; values computed from eh grid.
// No PA boundary in dump → pa values = ta values (same grid).
// RG cannot be computed from eh alone → set to null.
export const mockResults: FieldResult[] = [
  {
    id: 1,                                                       // 🟡 INVENTED
    project_id: 4,                                               // 🟢 DUMP
    ta_ehave: 42.58,                                             // 🟢 DUMP (calc: mean of 273 eh values)
    ta_ehmin: 0.07,                                              // 🟢 DUMP (calc: min of 273 eh values)
    ta_u: 0.00,                                                  // 🟢 DUMP (calc: 0.07 / 42.58 ≈ 0.002)
    pa_ehave: 42.58,                                             // 🟢 DUMP (no PA boundary → same as TA)
    pa_ehmin: 0.07,                                              // 🟢 DUMP (no PA boundary → same as TA)
    pa_u: 0.00,                                                  // 🟢 DUMP (no PA boundary → same as TA)
    rg: null as unknown as number,                               // ❌ not computable from eh grid
  },
];

/* ─── Result metrics for the results table ─── */
// Mixed sources — calculated from dump where possible, requirements from PDF
export const mockFieldMetrics: ResultMetric[] = [
  { label: 'Mittlerer Wartungswert E', subscript: 'm', requirement: '> 75 lux', result: '43 lux', passed: false, source: 'dump' },           // 🟢 DUMP (mean of 273 eh)
  { label: 'Gleichmäßigkeit E', subscript: 'min/m', requirement: '> 0,50', result: '0,00', passed: false, source: 'dump' },                   // 🟢 DUMP (0.07/42.58)
  { label: 'Blendindex R', subscript: 'G', requirement: '< 55', result: '—', passed: true, source: 'invented' },                             // ❌ not computable
  { label: 'Verhältnis Beleuchtungsstärke T', subscript: 'a/Pa', requirement: '> 75 %', result: '—', passed: true, source: 'invented' },      // ❌ no PA boundary
  { label: 'Verhältnis Gleichmäßigkeit T', subscript: 'a/Pa', requirement: '> 75 %', result: '—', passed: true, source: 'invented' },         // ❌ no PA boundary
  { label: 'Ungleichmäßigkeit E', subscript: 'min/max', requirement: '', result: '0,00', passed: true, source: 'dump' },                      // 🟢 DUMP (0.07/210.48)
  { label: 'E', subscript: 'min', requirement: '', result: '0,1 lux', passed: true, source: 'dump' },                                        // 🟢 DUMP
  { label: 'E', subscript: 'max', requirement: '', result: '210,5 lux', passed: true, source: 'dump' },                                      // 🟢 DUMP
];

/* ─── Calculation Points ─── */
// 🟢 DUMP — 273 real calculation points (13 x 21 grid)
// Grid extends beyond field boundaries (includes spill light).
// Coordinate swap applied: our_x = dump_y (width), our_y = dump_x (length).
// eh, cd, cg_angles are real values. ev/eh_relux/eh_delta/eh_percentage/cg_int are NULL in dump.
export const mockCalculationPoints: CalculationPoint[] = [
  { id: 820, project_id: 4, x: -36.34, y: -53.42, eh: 196.6, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '169.014468 / 73.36748', cg_int: null, cd: 0.19 },
  { id: 821, project_id: 4, x: -30.29, y: -53.42, eh: 174.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '166.738144 / 73.275889', cg_int: null, cd: 0.18 },
  { id: 822, project_id: 4, x: -24.23, y: -53.42, eh: 161.19, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.346333 / 73.206573', cg_int: null, cd: 0.19 },
  { id: 823, project_id: 4, x: -18.17, y: -53.42, eh: 75.19, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '161.838995 / 73.163593', cg_int: null, cd: 0.19 },
  { id: 824, project_id: 4, x: -12.11, y: -53.42, eh: 4.23, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '159.21785 / 73.15119', cg_int: null, cd: 0.2 },
  { id: 825, project_id: 4, x: -6.06, y: -53.42, eh: 0.53, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '156.48668 / 73.17365', cg_int: null, cd: 0.22 },
  { id: 826, project_id: 4, x: 0.0, y: -53.42, eh: 0.16, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '153.651577 / 73.235137', cg_int: null, cd: 0.24 },
  { id: 827, project_id: 4, x: 6.06, y: -53.42, eh: 0.54, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '150.721132 / 73.33948', cg_int: null, cd: 0.25 },
  { id: 828, project_id: 4, x: 12.11, y: -53.42, eh: 4.4, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '147.706502 / 73.489941', cg_int: null, cd: 0.25 },
  { id: 829, project_id: 4, x: 18.17, y: -53.42, eh: 76.61, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '144.621343 / 73.688979', cg_int: null, cd: 0.21 },
  { id: 830, project_id: 4, x: 24.23, y: -53.42, eh: 161.57, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '141.481577 / 73.93802', cg_int: null, cd: 0.19 },
  { id: 831, project_id: 4, x: 30.29, y: -53.42, eh: 174.87, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '138.304992 / 74.237284', cg_int: null, cd: 0.17 },
  { id: 832, project_id: 4, x: 36.34, y: -53.42, eh: 196.67, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.110691 / 74.585672', cg_int: null, cd: 0.15 },
  { id: 833, project_id: 4, x: -36.34, y: -48.08, eh: 164.75, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '170.389522 / 73.09882', cg_int: null, cd: 0.2 },
  { id: 834, project_id: 4, x: -30.29, y: -48.08, eh: 197.02, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '168.06808 / 72.981479', cg_int: null, cd: 0.19 },
  { id: 835, project_id: 4, x: -24.23, y: -48.08, eh: 141.82, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '165.619684 / 72.886367', cg_int: null, cd: 0.19 },
  { id: 836, project_id: 4, x: -18.17, y: -48.08, eh: 13.56, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '163.043314 / 72.818131', cg_int: null, cd: 0.2 },
  { id: 837, project_id: 4, x: -12.11, y: -48.08, eh: 0.98, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '160.339906 / 72.781712', cg_int: null, cd: 0.2 },
  { id: 838, project_id: 4, x: -6.06, y: -48.08, eh: 0.38, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '157.512746 / 72.782207', cg_int: null, cd: 0.23 },
  { id: 839, project_id: 4, x: 0.0, y: -48.08, eh: 0.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '154.567829 / 72.824664', cg_int: null, cd: 0.25 },
  { id: 840, project_id: 4, x: 6.06, y: -48.08, eh: 0.39, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '151.514129 / 72.913829', cg_int: null, cd: 0.26 },
  { id: 841, project_id: 4, x: 12.11, y: -48.08, eh: 0.99, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '148.363752 / 73.053852', cg_int: null, cd: 0.27 },
  { id: 842, project_id: 4, x: 18.17, y: -48.08, eh: 14.17, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '145.131897 / 73.247972', cg_int: null, cd: 0.23 },
  { id: 843, project_id: 4, x: 24.23, y: -48.08, eh: 143.52, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '141.83661 / 73.498219', cg_int: null, cd: 0.2 },
  { id: 844, project_id: 4, x: 30.29, y: -48.08, eh: 196.58, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '138.498312 / 73.805158', cg_int: null, cd: 0.18 },
  { id: 845, project_id: 4, x: 36.34, y: -48.08, eh: 164.35, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.139114 / 74.167731', cg_int: null, cd: 0.17 },
  { id: 846, project_id: 4, x: -36.34, y: -42.73, eh: 147.03, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.862482 / 72.822033', cg_int: null, cd: 0.22 },
  { id: 847, project_id: 4, x: -30.29, y: -42.73, eh: 155.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '169.498284 / 72.675515', cg_int: null, cd: 0.2 },
  { id: 848, project_id: 4, x: -24.23, y: -42.73, eh: 17.67, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '166.994484 / 72.550791', cg_int: null, cd: 0.2 },
  { id: 849, project_id: 4, x: -18.17, y: -42.73, eh: 1.07, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.348769 / 72.453149', cg_int: null, cd: 0.21 },
  { id: 850, project_id: 4, x: -12.11, y: -42.73, eh: 0.54, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '161.560975 / 72.388336', cg_int: null, cd: 0.21 },
  { id: 851, project_id: 4, x: -6.06, y: -42.73, eh: 0.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '158.633601 / 72.362403', cg_int: null, cd: 0.23 },
  { id: 852, project_id: 4, x: 0.0, y: -42.73, eh: 0.19, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '155.572308 / 72.381476', cg_int: null, cd: 0.25 },
  { id: 853, project_id: 4, x: 6.06, y: -42.73, eh: 0.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '152.386324 / 72.451448', cg_int: null, cd: 0.27 },
  { id: 854, project_id: 4, x: 12.11, y: -42.73, eh: 0.55, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '149.088701 / 72.577608', cg_int: null, cd: 0.28 },
  { id: 855, project_id: 4, x: 18.17, y: -42.73, eh: 1.09, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '145.696356 / 72.764228', cg_int: null, cd: 0.26 },
  { id: 856, project_id: 4, x: 24.23, y: -42.73, eh: 18.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '142.229812 / 73.014156', cg_int: null, cd: 0.22 },
  { id: 857, project_id: 4, x: 30.29, y: -42.73, eh: 156.32, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '138.712648 / 73.328461', cg_int: null, cd: 0.19 },
  { id: 858, project_id: 4, x: 36.34, y: -42.73, eh: 146.27, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.170639 / 73.706193', cg_int: null, cd: 0.18 },
  { id: 859, project_id: 4, x: -36.34, y: -37.39, eh: 95.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '173.44202 / 72.537975', cg_int: null, cd: 0.23 },
  { id: 860, project_id: 4, x: -30.29, y: -37.39, eh: 28.23, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.038539 / 72.35846', cg_int: null, cd: 0.22 },
  { id: 861, project_id: 4, x: -24.23, y: -37.39, eh: 1.35, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '168.48157 / 72.19978', cg_int: null, cd: 0.21 },
  { id: 862, project_id: 4, x: -18.17, y: -37.39, eh: 0.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '165.767116 / 72.067919', cg_int: null, cd: 0.22 },
  { id: 863, project_id: 4, x: -12.11, y: -37.39, eh: 0.49, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '162.893497 / 71.969532', cg_int: null, cd: 0.22 },
  { id: 864, project_id: 4, x: -6.06, y: -37.39, eh: 0.27, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '159.862027 / 71.911788', cg_int: null, cd: 0.23 },
  { id: 865, project_id: 4, x: 0.0, y: -37.39, eh: 0.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '156.677687 / 71.902121', cg_int: null, cd: 0.26 },
  { id: 866, project_id: 4, x: 6.06, y: -37.39, eh: 0.27, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '153.34973 / 71.947859', cg_int: null, cd: 0.28 },
  { id: 867, project_id: 4, x: 12.11, y: -37.39, eh: 0.49, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '149.892104 / 72.055761', cg_int: null, cd: 0.3 },
  { id: 868, project_id: 4, x: 18.17, y: -37.39, eh: 0.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '146.323604 / 72.23147', cg_int: null, cd: 0.28 },
  { id: 869, project_id: 4, x: 24.23, y: -37.39, eh: 1.37, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '142.667647 / 72.478958', cg_int: null, cd: 0.24 },
  { id: 870, project_id: 4, x: 30.29, y: -37.39, eh: 29.11, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '138.951619 / 72.800024', cg_int: null, cd: 0.21 },
  { id: 871, project_id: 4, x: 36.34, y: -37.39, eh: 95.25, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.205803 / 73.193933', cg_int: null, cd: 0.19 },
  { id: 872, project_id: 4, x: -36.34, y: -32.05, eh: 11.83, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '175.137459 / 72.247885', cg_int: null, cd: 0.25 },
  { id: 873, project_id: 4, x: -30.29, y: -32.05, eh: 1.97, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '172.699551 / 72.031151', cg_int: null, cd: 0.23 },
  { id: 874, project_id: 4, x: -24.23, y: -32.05, eh: 0.81, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '170.093014 / 71.833605', cg_int: null, cd: 0.23 },
  { id: 875, project_id: 4, x: -18.17, y: -32.05, eh: 0.65, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '167.311674 / 71.661961', cg_int: null, cd: 0.23 },
  { id: 876, project_id: 4, x: -12.11, y: -32.05, eh: 0.28, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.351802 / 71.523876', cg_int: null, cd: 0.23 },
  { id: 877, project_id: 4, x: -6.06, y: -32.05, eh: 0.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '161.212978 / 71.42782', cg_int: null, cd: 0.24 },
  { id: 878, project_id: 4, x: 0.0, y: -32.05, eh: 0.09, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '157.89901 / 71.382804', cg_int: null, cd: 0.26 },
  { id: 879, project_id: 4, x: 6.06, y: -32.05, eh: 0.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '154.418805 / 71.397953', cg_int: null, cd: 0.28 },
  { id: 880, project_id: 4, x: 12.11, y: -32.05, eh: 0.29, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '150.787051 / 71.481924', cg_int: null, cd: 0.32 },
  { id: 881, project_id: 4, x: 18.17, y: -32.05, eh: 0.65, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '147.024556 / 71.642196', cg_int: null, cd: 0.31 },
  { id: 882, project_id: 4, x: 24.23, y: -32.05, eh: 0.81, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '143.158108 / 71.884295', cg_int: null, cd: 0.26 },
  { id: 883, project_id: 4, x: 30.29, y: -32.05, eh: 2.01, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '139.219719 / 72.21108', cg_int: null, cd: 0.22 },
  { id: 884, project_id: 4, x: 36.34, y: -32.05, eh: 11.77, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.245276 / 72.622203', cg_int: null, cd: 0.21 },
  { id: 885, project_id: 4, x: -36.34, y: -26.71, eh: 1.22, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '176.958722 / 71.953492', cg_int: null, cd: 0.26 },
  { id: 886, project_id: 4, x: -30.29, y: -26.71, eh: 1.05, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '174.492955 / 71.69492', cg_int: null, cd: 0.25 },
  { id: 887, project_id: 4, x: -24.23, y: -26.71, eh: 1.02, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.842197 / 71.452999', cg_int: null, cd: 0.24 },
  { id: 888, project_id: 4, x: -18.17, y: -26.71, eh: 0.61, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '168.997501 / 71.235169', cg_int: null, cd: 0.24 },
  { id: 889, project_id: 4, x: -12.11, y: -26.71, eh: 0.25, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '165.952397 / 71.05017', cg_int: null, cd: 0.24 },
  { id: 890, project_id: 4, x: -6.06, y: -26.71, eh: 0.09, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '162.703995 / 70.907952', cg_int: null, cd: 0.24 },
  { id: 891, project_id: 4, x: 0.0, y: -26.71, eh: 0.07, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '159.254222 / 70.819414', cg_int: null, cd: 0.26 },
  { id: 892, project_id: 4, x: 6.06, y: -26.71, eh: 0.09, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '155.61106 / 70.795923', cg_int: null, cd: 0.28 },
  { id: 893, project_id: 4, x: 12.11, y: -26.71, eh: 0.25, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '151.78961 / 70.8486', cg_int: null, cd: 0.33 },
  { id: 894, project_id: 4, x: 18.17, y: -26.71, eh: 0.62, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '147.812761 / 70.987388', cg_int: null, cd: 0.35 },
  { id: 895, project_id: 4, x: 24.23, y: -26.71, eh: 1.02, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '143.711204 / 71.219985', cg_int: null, cd: 0.29 },
  { id: 896, project_id: 4, x: 30.29, y: -26.71, eh: 1.05, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '139.522606 / 71.550801', cg_int: null, cd: 0.24 },
  { id: 897, project_id: 4, x: 36.34, y: -26.71, eh: 1.22, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.2899 / 71.980144', cg_int: null, cd: 0.24 },
  { id: 898, project_id: 4, x: -36.34, y: -21.37, eh: 1.66, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '178.916234 / 71.657125', cg_int: null, cd: 0.26 },
  { id: 899, project_id: 4, x: -30.29, y: -21.37, eh: 1.92, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '176.431269 / 71.351736', cg_int: null, cd: 0.26 },
  { id: 900, project_id: 4, x: -24.23, y: -21.37, eh: 2.13, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '173.743853 / 71.059327', cg_int: null, cd: 0.25 },
  { id: 901, project_id: 4, x: -18.17, y: -21.37, eh: 1.47, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '170.841548 / 70.788003', cg_int: null, cd: 0.25 },
  { id: 902, project_id: 4, x: -12.11, y: -21.37, eh: 0.48, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '167.71427 / 70.547619', cg_int: null, cd: 0.25 },
  { id: 903, project_id: 4, x: -6.06, y: -21.37, eh: 0.16, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.355682 / 70.349772', cg_int: null, cd: 0.26 },
  { id: 904, project_id: 4, x: 0.0, y: -21.37, eh: 0.08, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '160.764819 / 70.207588', cg_int: null, cd: 0.27 },
  { id: 905, project_id: 4, x: 6.06, y: -21.37, eh: 0.16, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '156.947847 / 70.135218', cg_int: null, cd: 0.29 },
  { id: 906, project_id: 4, x: 12.11, y: -21.37, eh: 0.49, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '152.919692 / 70.14698', cg_int: null, cd: 0.34 },
  { id: 907, project_id: 4, x: 18.17, y: -21.37, eh: 1.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '148.70523 / 70.256148', cg_int: null, cd: 0.38 },
  { id: 908, project_id: 4, x: 24.23, y: -21.37, eh: 2.12, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '144.339626 / 70.473476', cg_int: null, cd: 0.33 },
  { id: 909, project_id: 4, x: 30.29, y: -21.37, eh: 1.92, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '139.867501 / 70.805671', cg_int: null, cd: 0.26 },
  { id: 910, project_id: 4, x: 36.34, y: -21.37, eh: 1.65, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.340755 / 71.254127', cg_int: null, cd: 0.26 },
  { id: 911, project_id: 4, x: -36.34, y: -16.03, eh: 4.77, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '181.020764 / 71.36184', cg_int: null, cd: 0.27 },
  { id: 912, project_id: 4, x: -30.29, y: -16.03, eh: 20.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '178.527779 / 71.004379', cg_int: null, cd: 0.27 },
  { id: 913, project_id: 4, x: -24.23, y: -16.03, eh: 35.86, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '175.814041 / 70.654798', cg_int: null, cd: 0.27 },
  { id: 914, project_id: 4, x: -18.17, y: -16.03, eh: 8.7, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '172.862772 / 70.321729', cg_int: null, cd: 0.27 },
  { id: 915, project_id: 4, x: -12.11, y: -16.03, eh: 0.64, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '169.6592 / 70.016089', cg_int: null, cd: 0.27 },
  { id: 916, project_id: 4, x: -6.06, y: -16.03, eh: 0.29, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '166.192243 / 69.751234', cg_int: null, cd: 0.28 },
  { id: 917, project_id: 4, x: 0.0, y: -16.03, eh: 0.21, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '162.45664 / 69.54286', cg_int: null, cd: 0.28 },
  { id: 918, project_id: 4, x: 6.06, y: -16.03, eh: 0.29, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '158.455387 / 69.408538', cg_int: null, cd: 0.31 },
  { id: 919, project_id: 4, x: 12.11, y: -16.03, eh: 0.65, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '154.202208 / 69.366729', cg_int: null, cd: 0.37 },
  { id: 920, project_id: 4, x: 18.17, y: -16.03, eh: 9.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '149.723581 / 69.435235', cg_int: null, cd: 0.43 },
  { id: 921, project_id: 4, x: 24.23, y: -16.03, eh: 35.78, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '145.059699 / 69.629153', cg_int: null, cd: 0.39 },
  { id: 922, project_id: 4, x: 30.29, y: -16.03, eh: 20.29, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '140.263762 / 69.958619', cg_int: null, cd: 0.28 },
  { id: 923, project_id: 4, x: 36.34, y: -16.03, eh: 4.7, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.399242 / 70.426821', cg_int: null, cd: 0.28 },
  { id: 924, project_id: 4, x: -36.34, y: -10.68, eh: 102.19, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '183.28316 / 71.07157', cg_int: null, cd: 0.27 },
  { id: 925, project_id: 4, x: -30.29, y: -10.68, eh: 112.95, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '180.796324 / 70.656635', cg_int: null, cd: 0.27 },
  { id: 926, project_id: 4, x: -24.23, y: -10.68, eh: 130.79, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '178.070016 / 70.242732', cg_int: null, cd: 0.28 },
  { id: 927, project_id: 4, x: -18.17, y: -10.68, eh: 20.88, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '175.082172 / 69.838744', cg_int: null, cd: 0.28 },
  { id: 928, project_id: 4, x: -12.11, y: -10.68, eh: 0.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.812018 / 69.456467', cg_int: null, cd: 0.28 },
  { id: 929, project_id: 4, x: -6.06, y: -10.68, eh: 0.44, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '168.24207 / 69.111008', cg_int: null, cd: 0.29 },
  { id: 930, project_id: 4, x: 0.0, y: -10.68, eh: 0.37, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.36082 / 68.820928', cg_int: null, cd: 0.31 },
  { id: 931, project_id: 4, x: 6.06, y: -10.68, eh: 0.44, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '160.166077 / 68.607922', cg_int: null, cd: 0.33 },
  { id: 932, project_id: 4, x: 12.11, y: -10.68, eh: 0.74, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '155.668639 / 68.49579', cg_int: null, cd: 0.4 },
  { id: 933, project_id: 4, x: 18.17, y: -10.68, eh: 21.78, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '150.895664 / 68.508507', cg_int: null, cd: 0.48 },
  { id: 934, project_id: 4, x: 24.23, y: -10.68, eh: 131.03, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '145.892762 / 68.667405', cg_int: null, cd: 0.47 },
  { id: 935, project_id: 4, x: 30.29, y: -10.68, eh: 112.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '140.723739 / 68.98781', cg_int: null, cd: 0.33 },
  { id: 936, project_id: 4, x: 36.34, y: -10.68, eh: 102.08, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.46722 / 69.475872', cg_int: null, cd: 0.32 },
  { id: 937, project_id: 4, x: -36.34, y: -5.34, eh: 176.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '185.71398 / 70.791258', cg_int: null, cd: 0.26 },
  { id: 938, project_id: 4, x: -30.29, y: -5.34, eh: 163.03, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '183.250934 / 70.313522', cg_int: null, cd: 0.28 },
  { id: 939, project_id: 4, x: -24.23, y: -5.34, eh: 182.07, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '180.52995 / 69.827875', cg_int: null, cd: 0.28 },
  { id: 940, project_id: 4, x: -18.17, y: -5.34, eh: 21.6, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '177.522658 / 69.342997', cg_int: null, cd: 0.29 },
  { id: 941, project_id: 4, x: -12.11, y: -5.34, eh: 0.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '174.200775 / 68.871166', cg_int: null, cd: 0.3 },
  { id: 942, project_id: 4, x: -6.06, y: -5.34, eh: 0.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '170.538321 / 68.429023', cg_int: null, cd: 0.31 },
  { id: 943, project_id: 4, x: 0.0, y: -5.34, eh: 0.38, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '166.514906 / 68.038126', cg_int: null, cd: 0.33 },
  { id: 944, project_id: 4, x: 6.06, y: -5.34, eh: 0.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '162.12018 / 67.725002', cg_int: null, cd: 0.36 },
  { id: 945, project_id: 4, x: 12.11, y: -5.34, eh: 0.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '157.359195 / 67.520243', cg_int: null, cd: 0.43 },
  { id: 946, project_id: 4, x: 18.17, y: -5.34, eh: 22.79, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '152.257888 / 67.456244', cg_int: null, cd: 0.53 },
  { id: 947, project_id: 4, x: 24.23, y: -5.34, eh: 182.48, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '146.867222 / 67.563373', cg_int: null, cd: 0.57 },
  { id: 948, project_id: 4, x: 30.29, y: -5.34, eh: 162.99, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '141.264067 / 67.864928', cg_int: null, cd: 0.41 },
  { id: 949, project_id: 4, x: 36.34, y: -5.34, eh: 176.81, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.547203 / 68.371993', cg_int: null, cd: 0.38 },
  { id: 950, project_id: 4, x: -36.34, y: 0.0, eh: 210.2, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '188.322981 / 70.526994', cg_int: null, cd: 0.26 },
  { id: 951, project_id: 4, x: -30.29, y: 0.0, eh: 183.34, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '185.905288 / 69.98152', cg_int: null, cd: 0.28 },
  { id: 952, project_id: 4, x: -24.23, y: 0.0, eh: 199.65, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '183.212413 / 69.416759', cg_int: null, cd: 0.29 },
  { id: 953, project_id: 4, x: -18.17, y: 0.0, eh: 21.41, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '180.208694 / 68.840503', cg_int: null, cd: 0.3 },
  { id: 954, project_id: 4, x: -12.11, y: 0.0, eh: 0.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '176.856684 / 68.264806', cg_int: null, cd: 0.32 },
  { id: 955, project_id: 4, x: -6.06, y: 0.0, eh: 0.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '173.119394 / 67.707258', cg_int: null, cd: 0.33 },
  { id: 956, project_id: 4, x: 0.0, y: 0.0, eh: 0.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '168.964082 / 67.192219', cg_int: null, cd: 0.36 },
  { id: 957, project_id: 4, x: 6.06, y: 0.0, eh: 0.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.367948 / 66.751575', cg_int: null, cd: 0.39 },
  { id: 958, project_id: 4, x: 12.11, y: 0.0, eh: 0.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '159.32576 / 66.424363', cg_int: null, cd: 0.45 },
  { id: 959, project_id: 4, x: 18.17, y: 0.0, eh: 22.84, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '153.858611 / 66.254404', cg_int: null, cd: 0.58 },
  { id: 960, project_id: 4, x: 24.23, y: 0.0, eh: 200.0, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '148.021679 / 66.285266', cg_int: null, cd: 0.67 },
  { id: 961, project_id: 4, x: 30.29, y: 0.0, eh: 183.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '141.907689 / 66.552701', cg_int: null, cd: 0.48 },
  { id: 962, project_id: 4, x: 36.34, y: 0.0, eh: 210.48, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.642677 / 67.076135', cg_int: null, cd: 0.46 },
  { id: 963, project_id: 4, x: -36.34, y: 5.34, eh: 166.97, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '191.118435 / 70.286106', cg_int: null, cd: 0.26 },
  { id: 964, project_id: 4, x: -30.29, y: 5.34, eh: 156.87, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '188.771937 / 69.668776', cg_int: null, cd: 0.28 },
  { id: 965, project_id: 4, x: -24.23, y: 5.34, eh: 176.54, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '186.135561 / 69.018085', cg_int: null, cd: 0.29 },
  { id: 966, project_id: 4, x: -18.17, y: 5.34, eh: 21.88, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '183.165555 / 68.33996', cg_int: null, cd: 0.32 },
  { id: 967, project_id: 4, x: -12.11, y: 5.34, eh: 0.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '179.813677 / 67.645094', cg_int: null, cd: 0.34 },
  { id: 968, project_id: 4, x: -6.06, y: 5.34, eh: 0.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '176.029107 / 66.950891', cg_int: null, cd: 0.35 },
  { id: 969, project_id: 4, x: 0.0, y: 5.34, eh: 0.38, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.762371 / 66.283673', cg_int: null, cd: 0.37 },
  { id: 970, project_id: 4, x: 6.06, y: 5.34, eh: 0.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '166.972196 / 65.68071', cg_int: null, cd: 0.41 },
  { id: 971, project_id: 4, x: 12.11, y: 5.34, eh: 0.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '161.635937 / 65.191089', cg_int: null, cd: 0.47 },
  { id: 972, project_id: 4, x: 18.17, y: 5.34, eh: 23.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '155.763174 / 64.873917', cg_int: null, cd: 0.62 },
  { id: 973, project_id: 4, x: 24.23, y: 5.34, eh: 177.01, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '149.409816 / 64.792136', cg_int: null, cd: 0.76 },
  { id: 974, project_id: 4, x: 30.29, y: 5.34, eh: 156.81, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '142.687132 / 65.001289', cg_int: null, cd: 0.59 },
  { id: 975, project_id: 4, x: 36.34, y: 5.34, eh: 167.04, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.758625 / 65.535212', cg_int: null, cd: 0.54 },
  { id: 976, project_id: 4, x: -36.34, y: 10.68, eh: 91.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '194.106283 / 70.077186', cg_int: null, cd: 0.27 },
  { id: 977, project_id: 4, x: -30.29, y: 10.68, eh: 104.7, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '191.861252 / 69.385262', cg_int: null, cd: 0.29 },
  { id: 978, project_id: 4, x: -24.23, y: 10.68, eh: 122.3, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '189.315912 / 68.643082', cg_int: null, cd: 0.3 },
  { id: 979, project_id: 4, x: -18.17, y: 10.68, eh: 21.2, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '186.418045 / 67.853411', cg_int: null, cd: 0.33 },
  { id: 980, project_id: 4, x: -12.11, y: 10.68, eh: 0.72, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '183.107322 / 67.023916', cg_int: null, cd: 0.35 },
  { id: 981, project_id: 4, x: -6.06, y: 10.68, eh: 0.42, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '179.316253 / 66.169862', cg_int: null, cd: 0.39 },
  { id: 982, project_id: 4, x: 0.0, y: 10.68, eh: 0.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '174.9735 / 65.317638', cg_int: null, cd: 0.4 },
  { id: 983, project_id: 4, x: 6.06, y: 10.68, eh: 0.43, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '170.01124 / 64.508786', cg_int: null, cd: 0.45 },
  { id: 984, project_id: 4, x: 12.11, y: 10.68, eh: 0.73, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.378498 / 63.803391', cg_int: null, cd: 0.52 },
  { id: 985, project_id: 4, x: 18.17, y: 10.68, eh: 22.1, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '158.061451 / 63.280372', cg_int: null, cd: 0.71 },
  { id: 986, project_id: 4, x: 24.23, y: 10.68, eh: 122.62, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '151.108315 / 63.031049', cg_int: null, cd: 0.89 },
  { id: 987, project_id: 4, x: 30.29, y: 10.68, eh: 104.46, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '143.650054 / 63.142964', cg_int: null, cd: 0.75 },
  { id: 988, project_id: 4, x: 36.34, y: 10.68, eh: 91.57, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '135.902424 / 63.675491', cg_int: null, cd: 0.69 },
  { id: 989, project_id: 4, x: -36.34, y: 16.03, eh: 3.19, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '197.289132 / 69.910009', cg_int: null, cd: 0.27 },
  { id: 990, project_id: 4, x: -30.29, y: 16.03, eh: 9.63, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '195.180095 / 69.142801', cg_int: null, cd: 0.3 },
  { id: 991, project_id: 4, x: -24.23, y: 16.03, eh: 22.78, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '192.766654 / 68.305754', cg_int: null, cd: 0.32 },
  { id: 992, project_id: 4, x: -18.17, y: 16.03, eh: 7.37, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '189.988504 / 67.39688', cg_int: null, cd: 0.34 },
  { id: 993, project_id: 4, x: -12.11, y: 16.03, eh: 0.62, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '186.772746 / 66.418562', cg_int: null, cd: 0.37 },
  { id: 994, project_id: 4, x: -6.06, y: 16.03, eh: 0.27, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '183.033003 / 65.380929', cg_int: null, cd: 0.4 },
  { id: 995, project_id: 4, x: 0.0, y: 16.03, eh: 0.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '178.670784 / 64.306896', cg_int: null, cd: 0.45 },
  { id: 996, project_id: 4, x: 6.06, y: 16.03, eh: 0.27, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '173.58169 / 63.239038', cg_int: null, cd: 0.48 },
  { id: 997, project_id: 4, x: 12.11, y: 16.03, eh: 0.63, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '167.67046 / 62.247389', cg_int: null, cd: 1.06 },
  { id: 998, project_id: 4, x: 18.17, y: 16.03, eh: 7.6, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '160.879292 / 61.434913', cg_int: null, cd: 1.72 },
  { id: 999, project_id: 4, x: 24.23, y: 16.03, eh: 22.74, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '153.230067 / 60.933857', cg_int: null, cd: 1.7 },
  { id: 1000, project_id: 4, x: 30.29, y: 16.03, eh: 9.44, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '144.869084 / 60.884245', cg_int: null, cd: 1.18 },
  { id: 1001, project_id: 4, x: 36.34, y: 16.03, eh: 3.19, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '136.085474 / 61.392145', cg_int: null, cd: 0.91 },
  { id: 1002, project_id: 4, x: -36.34, y: 21.37, eh: 1.51, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '200.665134 / 69.795287', cg_int: null, cd: 0.29 },
  { id: 1003, project_id: 4, x: -30.29, y: 21.37, eh: 1.82, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '198.73023 / 68.954893', cg_int: null, cd: 0.31 },
  { id: 1004, project_id: 4, x: -24.23, y: 21.37, eh: 1.93, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '196.495459 / 68.022899', cg_int: null, cd: 0.34 },
  { id: 1005, project_id: 4, x: -18.17, y: 21.37, eh: 1.35, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '193.89393 / 66.990798', cg_int: null, cd: 0.37 },
  { id: 1006, project_id: 4, x: -12.11, y: 21.37, eh: 0.44, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '190.84117 / 65.852911', cg_int: null, cd: 0.4 },
  { id: 1007, project_id: 4, x: -6.06, y: 21.37, eh: 0.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '187.231374 / 64.610066', cg_int: null, cd: 0.43 },
  { id: 1008, project_id: 4, x: 0.0, y: 21.37, eh: 0.07, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '182.934861 / 63.27596', cg_int: null, cd: 0.48 },
  { id: 1009, project_id: 4, x: 6.06, y: 21.37, eh: 0.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '177.799894 / 61.88739', cg_int: null, cd: 1.12 },
  { id: 1010, project_id: 4, x: 12.11, y: 21.37, eh: 0.44, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.66545 / 60.51879', cg_int: null, cd: 2.41 },
  { id: 1011, project_id: 4, x: 18.17, y: 21.37, eh: 1.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.395716 / 59.298277', cg_int: null, cd: 4.81 },
  { id: 1012, project_id: 4, x: 24.23, y: 21.37, eh: 1.93, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '155.947046 / 58.414629', cg_int: null, cd: 5.65 },
  { id: 1013, project_id: 4, x: 30.29, y: 21.37, eh: 1.81, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '146.460354 / 58.094525', cg_int: null, cd: 5.58 },
  { id: 1014, project_id: 4, x: 36.34, y: 21.37, eh: 1.5, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '136.326381 / 58.532417', cg_int: null, cd: 5.8 },
  { id: 1015, project_id: 4, x: -36.34, y: 26.71, eh: 1.35, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '204.226877 / 69.744237', cg_int: null, cd: 0.32 },
  { id: 1016, project_id: 4, x: -30.29, y: 26.71, eh: 1.03, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '202.506602 / 68.836263', cg_int: null, cd: 0.35 },
  { id: 1017, project_id: 4, x: -24.23, y: 26.71, eh: 0.97, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '200.501887 / 67.813744', cg_int: null, cd: 0.38 },
  { id: 1018, project_id: 4, x: -18.17, y: 26.71, eh: 0.58, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '198.142207 / 66.659967', cg_int: null, cd: 0.41 },
  { id: 1019, project_id: 4, x: -12.11, y: 26.71, eh: 0.23, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '195.334724 / 65.358195', cg_int: null, cd: 0.44 },
  { id: 1020, project_id: 4, x: -6.06, y: 26.71, eh: 0.1, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '191.956815 / 63.894846', cg_int: null, cd: 0.48 },
  { id: 1021, project_id: 4, x: 0.0, y: 26.71, eh: 0.07, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '187.847352 / 62.266199', cg_int: null, cd: 0.96 },
  { id: 1022, project_id: 4, x: 6.06, y: 26.71, eh: 0.1, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '182.799261 / 60.49137', cg_int: null, cd: 2.19 },
  { id: 1023, project_id: 4, x: 12.11, y: 26.71, eh: 0.23, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '176.561243 / 58.635168', cg_int: null, cd: 4.26 },
  { id: 1024, project_id: 4, x: 18.17, y: 26.71, eh: 0.59, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '168.867766 / 56.842196', cg_int: null, cd: 7.26 },
  { id: 1025, project_id: 4, x: 24.23, y: 26.71, eh: 0.97, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '159.531189 / 55.371398', cg_int: null, cd: 7.73 },
  { id: 1026, project_id: 4, x: 30.29, y: 26.71, eh: 1.04, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '148.620986 / 54.590789', cg_int: null, cd: 8.96 },
  { id: 1027, project_id: 4, x: 36.34, y: 26.71, eh: 1.35, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '136.657709 / 54.86826', cg_int: null, cd: 15.22 },
  { id: 1028, project_id: 4, x: -36.34, y: 32.05, eh: 18.78, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '207.960413 / 69.767923', cg_int: null, cd: 0.37 },
  { id: 1029, project_id: 4, x: -30.29, y: 32.05, eh: 2.74, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '206.495687 / 68.802046', cg_int: null, cd: 0.42 },
  { id: 1030, project_id: 4, x: -24.23, y: 32.05, eh: 0.82, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '204.774642 / 67.699023', cg_int: null, cd: 0.45 },
  { id: 1031, project_id: 4, x: -18.17, y: 32.05, eh: 0.66, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '202.72765 / 66.432721', cg_int: null, cd: 0.48 },
  { id: 1032, project_id: 4, x: -12.11, y: 32.05, eh: 0.31, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '200.259502 / 64.972734', cg_int: null, cd: 0.5 },
  { id: 1033, project_id: 4, x: -6.06, y: 32.05, eh: 0.17, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '197.238058 / 63.285845', cg_int: null, cd: 0.59 },
  { id: 1034, project_id: 4, x: 0.0, y: 32.05, eh: 0.1, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '193.47786 / 61.340991', cg_int: null, cd: 1.72 },
  { id: 1035, project_id: 4, x: 6.06, y: 32.05, eh: 0.17, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '188.718165 / 59.122117', cg_int: null, cd: 4.29 },
  { id: 1036, project_id: 4, x: 12.11, y: 32.05, eh: 0.31, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '182.599699 / 56.657329', cg_int: null, cd: 6.24 },
  { id: 1037, project_id: 4, x: 18.17, y: 32.05, eh: 0.66, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '174.661962 / 54.076752', cg_int: null, cd: 8.29 },
  { id: 1038, project_id: 4, x: 24.23, y: 32.05, eh: 0.83, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.428839 / 51.703221', cg_int: null, cd: 7.93 },
  { id: 1039, project_id: 4, x: 30.29, y: 32.05, eh: 2.83, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '151.711828 / 50.122218', cg_int: null, cd: 28.61 },
  { id: 1040, project_id: 4, x: 36.34, y: 32.05, eh: 18.69, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '137.142083 / 50.052718', cg_int: null, cd: 180.24 },
  { id: 1041, project_id: 4, x: -36.34, y: 37.39, eh: 106.87, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '211.844645 / 69.876396', cg_int: null, cd: 0.41 },
  { id: 1042, project_id: 4, x: -30.29, y: 37.39, eh: 39.89, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '210.674243 / 68.866602', cg_int: null, cd: 0.47 },
  { id: 1043, project_id: 4, x: -24.23, y: 37.39, eh: 1.57, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '209.289162 / 67.6994', cg_int: null, cd: 0.54 },
  { id: 1044, project_id: 4, x: -18.17, y: 37.39, eh: 0.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '207.626542 / 66.33896', cg_int: null, cd: 0.61 },
  { id: 1045, project_id: 4, x: -12.11, y: 37.39, eh: 0.51, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '205.597547 / 64.73988', cg_int: null, cd: 0.67 },
  { id: 1046, project_id: 4, x: -6.06, y: 37.39, eh: 0.28, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '203.07335 / 62.845537', cg_int: null, cd: 0.85 },
  { id: 1047, project_id: 4, x: 0.0, y: 37.39, eh: 0.16, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '199.862041 / 60.588367', cg_int: null, cd: 2.72 },
  { id: 1048, project_id: 4, x: 6.06, y: 37.39, eh: 0.29, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '195.670341 / 57.896805', cg_int: null, cd: 6.72 },
  { id: 1049, project_id: 4, x: 12.11, y: 37.39, eh: 0.51, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '190.042369 / 54.721248', cg_int: null, cd: 8.44 },
  { id: 1050, project_id: 4, x: 18.17, y: 37.39, eh: 0.71, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '182.276964 / 51.108085', cg_int: null, cd: 7.83 },
  { id: 1051, project_id: 4, x: 24.23, y: 37.39, eh: 1.6, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '171.39237 / 47.372729', cg_int: null, cd: 13.97 },
  { id: 1052, project_id: 4, x: 30.29, y: 37.39, eh: 41.08, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '156.460319 / 44.377092', cg_int: null, cd: 293.16 },
  { id: 1053, project_id: 4, x: 36.34, y: 37.39, eh: 106.81, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '137.917236 / 43.557184', cg_int: null, cd: 651.03 },
  { id: 1054, project_id: 4, x: -36.34, y: 42.73, eh: 148.87, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '215.851276 / 70.077707', cg_int: null, cd: 0.34 },
  { id: 1055, project_id: 4, x: -30.29, y: 42.73, eh: 170.99, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '215.008825 / 69.04204', cg_int: null, cd: 0.43 },
  { id: 1056, project_id: 4, x: -24.23, y: 42.73, eh: 29.9, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '214.006211 / 67.833258', cg_int: null, cd: 0.53 },
  { id: 1057, project_id: 4, x: -18.17, y: 42.73, eh: 1.31, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '212.793796 / 66.406915', cg_int: null, cd: 0.66 },
  { id: 1058, project_id: 4, x: -12.11, y: 42.73, eh: 0.55, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '211.299555 / 64.703507', cg_int: null, cd: 0.78 },
  { id: 1059, project_id: 4, x: -6.06, y: 42.73, eh: 0.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '209.415273 / 62.642765', cg_int: null, cd: 0.99 },
  { id: 1060, project_id: 4, x: 0.0, y: 42.73, eh: 0.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '206.971573 / 60.116605', cg_int: null, cd: 2.84 },
  { id: 1061, project_id: 4, x: 6.06, y: 42.73, eh: 0.36, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '203.690471 / 56.983104', cg_int: null, cd: 7.31 },
  { id: 1062, project_id: 4, x: 12.11, y: 42.73, eh: 0.55, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '199.090804 / 53.071914', cg_int: null, cd: 7.49 },
  { id: 1063, project_id: 4, x: 18.17, y: 42.73, eh: 1.34, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '192.295033 / 48.238602', cg_int: null, cd: 12.76 },
  { id: 1064, project_id: 4, x: 24.23, y: 42.73, eh: 31.32, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '181.666184 / 42.585393', cg_int: null, cd: 207.36 },
  { id: 1065, project_id: 4, x: 30.29, y: 42.73, eh: 171.82, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '164.518832 / 37.109222', cg_int: null, cd: 797.49 },
  { id: 1066, project_id: 4, x: 36.34, y: 42.73, eh: 148.16, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '139.356432 / 34.615806', cg_int: null, cd: 553.8 },
  { id: 1067, project_id: 4, x: -36.34, y: 48.08, eh: 168.43, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '219.945486 / 70.376918', cg_int: null, cd: 0.27 },
  { id: 1068, project_id: 4, x: -30.29, y: 48.08, eh: 192.94, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '219.456434 / 69.336628', cg_int: null, cd: 0.31 },
  { id: 1069, project_id: 4, x: -24.23, y: 48.08, eh: 155.1, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '218.87221 / 68.114124', cg_int: null, cd: 0.39 },
  { id: 1070, project_id: 4, x: -18.17, y: 48.08, eh: 20.25, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '218.162201 / 66.658925', cg_int: null, cd: 0.48 },
  { id: 1071, project_id: 4, x: -12.11, y: 48.08, eh: 1.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '217.281196 / 64.90108', cg_int: null, cd: 0.6 },
  { id: 1072, project_id: 4, x: -6.06, y: 48.08, eh: 0.4, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '216.159582 / 62.741631', cg_int: null, cd: 0.79 },
  { id: 1073, project_id: 4, x: 0.0, y: 48.08, eh: 0.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '214.684558 / 60.037785', cg_int: null, cd: 2.59 },
  { id: 1074, project_id: 4, x: 6.06, y: 48.08, eh: 0.4, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '212.661178 / 56.58055', cg_int: null, cd: 7.37 },
  { id: 1075, project_id: 4, x: 12.11, y: 48.08, eh: 1.18, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '209.723388 / 52.065173', cg_int: null, cd: 14.66 },
  { id: 1076, project_id: 4, x: 18.17, y: 48.08, eh: 21.02, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '205.104551 / 46.073457', cg_int: null, cd: 168.62 },
  { id: 1077, project_id: 4, x: 24.23, y: 48.08, eh: 156.84, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '196.952692 / 38.183001', cg_int: null, cd: 771.07 },
  { id: 1078, project_id: 4, x: 30.29, y: 48.08, eh: 192.7, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '180.07187 / 28.761689', cg_int: null, cd: 604.85 },
  { id: 1079, project_id: 4, x: 36.34, y: 48.08, eh: 168.1, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '142.94167 / 22.340737', cg_int: null, cd: 395.76 },
  { id: 1080, project_id: 4, x: -36.34, y: 53.42, eh: 200.92, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '224.087406 / 70.775284', cg_int: null, cd: 0.27 },
  { id: 1081, project_id: 4, x: -30.29, y: 53.42, eh: 171.04, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '223.966468 / 69.7534', cg_int: null, cd: 0.3 },
  { id: 1082, project_id: 4, x: -24.23, y: 53.42, eh: 153.73, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '223.821757 / 68.548229', cg_int: null, cd: 0.37 },
  { id: 1083, project_id: 4, x: -18.17, y: 53.42, eh: 79.41, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '223.645504 / 67.107052', cg_int: null, cd: 0.45 },
  { id: 1084, project_id: 4, x: -12.11, y: 53.42, eh: 4.8, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '223.42614 / 65.355577', cg_int: null, cd: 0.54 },
  { id: 1085, project_id: 4, x: -6.06, y: 53.42, eh: 0.53, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '223.14565 / 63.186248', cg_int: null, cd: 0.71 },
  { id: 1086, project_id: 4, x: 0.0, y: 53.42, eh: 0.15, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '222.774374 / 60.438685', cg_int: null, cd: 1.98 },
  { id: 1087, project_id: 4, x: 6.06, y: 53.42, eh: 0.54, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '222.259776 / 56.866249', cg_int: null, cd: 9.48 },
  { id: 1088, project_id: 4, x: 12.11, y: 53.42, eh: 5.0, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '221.499183 / 52.078847', cg_int: null, cd: 58.3 },
  { id: 1089, project_id: 4, x: 18.17, y: 53.42, eh: 80.82, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '220.261429 / 45.451324', cg_int: null, cd: 566.8 },
  { id: 1090, project_id: 4, x: 24.23, y: 53.42, eh: 153.99, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '217.896059 / 36.020711', cg_int: null, cd: 624.47 },
  { id: 1091, project_id: 4, x: 30.29, y: 53.42, eh: 171.33, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '211.627749 / 22.634121', cg_int: null, cd: 412.17 },
  { id: 1092, project_id: 4, x: 36.34, y: 53.42, eh: 201.08, ev: null, eh_relux: null, eh_delta: null, eh_percentage: null, cg_angles: '165.699999 / 6.865622', cg_int: null, cd: 340.75 },
];

/* ─── Light Points (masts) ─── */
// 🟢 DUMP — positions decoded from geometrylocal WKB. Coord swap applied.
// mastheight: 🟢 DUMP (16m)
// tilt: 🟢 DUMP (10° — PDF has 35°/29° for different luminaire config)
// x/y: 🟢 DUMP (NULL in dump columns, decoded from WKB geometrylocal)
// ldt_file_name: NULL in dump
export const mockLightpoints: LightPoint[] = [
  { id: 19, project_id: 4, x: -39.45, y: 57.15, mastheight: 16, direction_id: 19, tilt: 10, ldt_file_name: null },
  { id: 20, project_id: 4, x: -39.45, y: -0.37, mastheight: 16, direction_id: 20, tilt: 10, ldt_file_name: null },
  { id: 21, project_id: 4, x: -39.45, y: -57.89, mastheight: 16, direction_id: 21, tilt: 10, ldt_file_name: null },
  { id: 22, project_id: 4, x: 39.38, y: -57.89, mastheight: 16, direction_id: 22, tilt: 10, ldt_file_name: null },
  { id: 23, project_id: 4, x: 39.38, y: -0.37, mastheight: 16, direction_id: 23, tilt: 10, ldt_file_name: null },
  { id: 24, project_id: 4, x: 39.38, y: 57.15, mastheight: 16, direction_id: 24, tilt: 10, ldt_file_name: null },
];

/* ─── Directions (aiming vectors) ─── */
// 🟢 DUMP — decoded from geometrylocal WKB LineStrings.
// vector field is NULL in dump. We derive the aiming line from geometry.
// Each direction has a LineString: [mast_position, aiming_point].
export const mockDirections: Direction[] = [
  { id: 19, project_id: 4, vector: null, aimingLine: [{ x: -39.45, y: 57.15 }, { x: -28.84, y: 46.55 }] },
  { id: 20, project_id: 4, vector: null, aimingLine: [{ x: -39.45, y: -0.37 }, { x: -24.45, y: -0.37 }] },
  { id: 21, project_id: 4, vector: null, aimingLine: [{ x: -39.45, y: -57.89 }, { x: -28.84, y: -47.29 }] },
  { id: 22, project_id: 4, vector: null, aimingLine: [{ x: 39.38, y: -57.89 }, { x: 28.77, y: -47.29 }] },
  { id: 23, project_id: 4, vector: null, aimingLine: [{ x: 39.38, y: -0.37 }, { x: 24.38, y: -0.37 }] },
  { id: 24, project_id: 4, vector: null, aimingLine: [{ x: 39.38, y: 57.15 }, { x: 28.77, y: 46.55 }] },
];

/* ─── Luminaire list entries ─── */
// ⚠️ MISMATCH — constructed from DUMP lightpoint/direction data + DUMP luminaire name.
// Position/aiming from dump. Rotation/colorDot are 🟡 INVENTED.
// PDF has BVP528 data; dump has BVP518. Using dump values here.
export const mockLuminaireList: LuminaireListEntry[] = [
  { luminaireName: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO', mastNumber: 1, position: { x: -39.45, y: 57.15, z: 16 }, aimingPoint: { x: -28.84, y: 46.55 }, rotation: 0, tilt: 10, colorDot: '#3B82F6' },
  { luminaireName: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO', mastNumber: 2, position: { x: -39.45, y: -0.37, z: 16 }, aimingPoint: { x: -24.45, y: -0.37 }, rotation: 0, tilt: 10, colorDot: '#22C55E' },
  { luminaireName: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO', mastNumber: 3, position: { x: -39.45, y: -57.89, z: 16 }, aimingPoint: { x: -28.84, y: -47.29 }, rotation: 0, tilt: 10, colorDot: '#EF4444' },
  { luminaireName: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO', mastNumber: 4, position: { x: 39.38, y: -57.89, z: 16 }, aimingPoint: { x: 28.77, y: -47.29 }, rotation: 0, tilt: 10, colorDot: '#F59E0B' },
  { luminaireName: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO', mastNumber: 5, position: { x: 39.38, y: -0.37, z: 16 }, aimingPoint: { x: 24.38, y: -0.37 }, rotation: 0, tilt: 10, colorDot: '#8B5CF6' },
  { luminaireName: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO', mastNumber: 6, position: { x: 39.38, y: 57.15, z: 16 }, aimingPoint: { x: 28.77, y: 46.55 }, rotation: 0, tilt: 10, colorDot: '#EC4899' },
];

/* ─── Buildings (facades) ─── */
// 🟢 DUMP — id, height, elevation, elevation_relative are real.
// ksmax, evmax: NULL in dump. Values below from 🔵 PDF p8.
// ⚠️ PDF shows 8 facades with results; dump only has 3 facades.
export const mockBuildings: Building[] = [
  { id: 10, project_id: 4, height: 8, elevation: 35, elevation_relative: 3, ksmax: 62, evmax: 2.3 },  // struct: 🟢 DUMP, ks/ev: 🔵 PDF p8
  { id: 11, project_id: 4, height: 8, elevation: 34, elevation_relative: 2, ksmax: 61, evmax: 2.1 },  // struct: 🟢 DUMP, ks/ev: 🔵 PDF p8
  { id: 12, project_id: 4, height: 8, elevation: 34, elevation_relative: 2, ksmax: 59, evmax: 1.5 },  // struct: 🟢 DUMP, ks/ev: 🔵 PDF p8
];

/* ─── Luminaire Library ─── */
// 🟢 DUMP — real luminaire from dump (BVP518, different from PDF's BVP528)
export const mockLuminaires: Luminaire[] = [
  {
    id: 1,                                                       // 🟢 DUMP
    name: 'BVP518 OUT T35 1xLED1720-4S/740/740 E3/D4I A35-MB LO',  // 🟢 DUMP (⚠️ PDF: "BVP528 2590/740 A35-NB LO")
    num_lamps: [1],                                              // 🟢 DUMP
    type_lamps: ['LED1720-4S/740'],                              // 🟢 DUMP
    flux: [172000],                                              // 🟢 DUMP (⚠️ PDF: 259000)
    colour: ['4000'],                                            // 🟢 DUMP
    rendering: ['70'],                                           // 🟢 DUMP (⚠️ PDF: 80)
    wattage: [1006],                                             // 🟢 DUMP (⚠️ PDF: 1506)
    lamp_type: ['LED'],                                              // 🟡 INVENTED
    ldtpath: 'Stadiums_MB_LO_check_fields/',                         // 🟢 DUMP
    ldtfilename: 'BVP518_OUT T35_LED1720-4S-740_A35-MB_LO_336L__L94@100kh.ldt',  // 🟢 DUMP
  },
];

/* ─── Field Specification ─── */
// 🔵 PDF p3 + p6 — dump has no field spec data
export const mockFieldSpec: FieldSpecification = {
  sportType: 'Fußball',                                          // 🔵 PDF p3
  standard: 'EN 12193',                                          // 🔵 PDF p3
  lightingClass: 'Klasse III',                                   // 🔵 PDF p3
  colorTemperature: '4000 K',                                    // 🔵 PDF p3
  maintenanceFactor: 0.92,                                       // 🔵 PDF p6
  mountingHeight: 16,                                            // 🔵 PDF p3 + 🟢 DUMP
};

/* ─── LAI Requirements ─── */
// 🔵 PDF p5 + p8 — dump has no LAI data
export const mockLAIRequirements: LAIRequirements = {
  areaType: 'E2',                                                // 🔵 PDF p5+p8
  assessmentTime: '20:00 – 22:00 Uhr',                          // 🔵 PDF p5
  evMaxLimit: 3,                                                 // 🔵 PDF p8
  ksMaxLimit: 64,                                                // 🔵 PDF p8
};

/* ─── Glossary Terms ─── */
// Term names: 🔵 PDF p10. Definitions: 🟡 INVENTED (PDF only lists terms)
export const mockGlossaryTerms: GlossaryTerm[] = [
  { term: 'E', subscript: 'm', definition: 'Mittlere horizontale Beleuchtungsstärke (lux). Beschreibt den Durchschnittswert der horizontalen Beleuchtungsstärke über alle Messpunkte des Berechnungsrasters.', category: 'lighting' },
  { term: 'E', subscript: 'min/m', definition: 'Gleichmäßigkeit der Beleuchtung. Verhältnis der minimalen zur mittleren Beleuchtungsstärke. Ein Wert von 1,0 entspricht perfekter Gleichmäßigkeit.', category: 'lighting' },
  { term: 'R', subscript: 'G', definition: 'Blendungsindex nach CIE (Glare Rating). Bewertet die psychologische Blendung durch die Beleuchtungsanlage. Niedrigere Werte bedeuten weniger Blendung.', category: 'lighting' },
  { term: 'T', subscript: 'a/Pa', definition: 'Verhältnis zwischen Gesamtfläche (Total Area) und Spielfläche (Playing Area). Stellt sicher, dass die Beleuchtung im Gesamtbereich nicht wesentlich geringer ist als im Spielbereich.', category: 'lighting' },
  { term: 'E', subscript: 'min/max', definition: 'Ungleichmäßigkeit. Verhältnis der minimalen zur maximalen Beleuchtungsstärke. Gibt Aufschluss über die Streuung der Beleuchtungswerte.', category: 'lighting' },
  { term: 'Wartungsfaktor', definition: 'Faktor, der die Alterung und Verschmutzung der Leuchten über die Lebensdauer berücksichtigt. Die Berechnungsergebnisse werden mit diesem Faktor multipliziert.', category: 'lighting' },
  { term: 'E', subscript: 'v', definition: 'Vertikale Beleuchtungsstärke (lux) auf einer senkrechten Fläche, z.B. einer Gebäudefassade. Relevant für die Bewertung der Lichtimmission auf Anwohnergebäude.', category: 'lai' },
  { term: 'k', subscript: 's', definition: 'Schwellenwertinkrement (%). Maß für die physiologische Blendung durch Lichtquellen. Bewertet die Störwirkung von Licht auf Anwohner gemäß LAI 2012.', category: 'lai' },
  { term: 'Gebietsart', definition: 'Klassifizierung des Umgebungsgebiets nach Baunutzungsverordnung (BauNVO). Bestimmt die zulässigen Grenzwerte für Lichtimmissionen gemäß LAI-Richtlinie 2012.', category: 'lai' },
  { term: 'LAI 2012', definition: 'Licht-Richtlinie des Länderausschusses für Immissionsschutz. Regelwerk zur Bewertung und Begrenzung von Lichtimmissionen durch künstliche Beleuchtungsanlagen.', category: 'lai' },
];

/* ─── Aggregate Report Data ─── */
export const mockReportData: ReportData = {
  project: mockProject,
  results: mockResults,
  calculationPoints: mockCalculationPoints,
  lightpoints: mockLightpoints,
  directions: mockDirections,
  buildings: mockBuildings,
  buildingPoints: [],
  luminaires: mockLuminaires,
  luminaireList: mockLuminaireList,
};
