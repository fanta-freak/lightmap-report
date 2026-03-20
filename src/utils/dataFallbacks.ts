/**
 * Data fallback utilities.
 *
 * When the API payload is missing certain derived arrays (luminaireList, fieldMetrics),
 * these functions synthesize them from the raw data that IS available
 * (lightpoints, directions, luminaires, calculationPoints, results).
 */

import type {
  LuminaireListEntry,
  LightPoint,
  Direction,
  Luminaire,
  CalculationPoint,
  FieldResult,
  ResultMetric,
} from '../types';

/* ─── Color palette for luminaire type dots ─── */
const DOT_COLORS = [
  '#F97316', // orange
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // violet
  '#EF4444', // red
  '#F59E0B', // amber
];

/**
 * Synthesize luminaireList from lightpoints + directions + luminaires.
 *
 * Each lightpoint becomes one row in the luminaire list. The luminaire name
 * is matched via the ldt_file_name field, and the aiming point comes from
 * the linked direction's aimingLine.
 */
export function synthesizeLuminaireList(
  lightpoints: LightPoint[],
  directions: Direction[],
  luminaires: Luminaire[],
): LuminaireListEntry[] {
  // Build a map: ldt filename fragment → luminaire name + color
  const ldtToLuminaire = new Map<string, { name: string; color: string }>();
  luminaires.forEach((lum, i) => {
    const color = DOT_COLORS[i % DOT_COLORS.length];
    // Match on ldtfilename (exact) or on name fragments in the ldt_file_name
    if (lum.ldtfilename) {
      ldtToLuminaire.set(lum.ldtfilename.toLowerCase(), { name: lum.name, color });
    }
    // Also store by name for partial matching
    ldtToLuminaire.set(lum.name.toLowerCase(), { name: lum.name, color });
  });

  return lightpoints.map((lp, i) => {
    // Find matching direction
    const dir = directions.find((d) => d.id === lp.direction_id);

    // Extract aiming point from direction's aimingLine
    let aimX = 0, aimY = 0;
    if (dir?.aimingLine && dir.aimingLine.length >= 2) {
      aimX = dir.aimingLine[1].x;
      aimY = dir.aimingLine[1].y;
    }

    // Match luminaire name via ldt_file_name
    let luminaireName = lp.ldt_file_name ?? 'Unbekannt';
    let colorDot = DOT_COLORS[0];

    if (lp.ldt_file_name) {
      const ldtLower = lp.ldt_file_name.toLowerCase();
      // Try exact match on ldtfilename
      for (const [key, val] of ldtToLuminaire.entries()) {
        if (ldtLower.includes(key) || key.includes(ldtLower)) {
          luminaireName = val.name;
          colorDot = val.color;
          break;
        }
      }
      // If no match found, try partial matching on luminaire name keywords
      if (luminaireName === lp.ldt_file_name) {
        for (const lum of luminaires) {
          // Check if the ldt filename contains distinctive parts of the luminaire name
          const nameParts = lum.name.split(/[\s/]+/).filter((p) => p.length > 3);
          const matchCount = nameParts.filter((p) => ldtLower.includes(p.toLowerCase())).length;
          if (matchCount >= 2) {
            luminaireName = lum.name;
            const lumIdx = luminaires.indexOf(lum);
            colorDot = DOT_COLORS[lumIdx % DOT_COLORS.length];
            break;
          }
        }
      }
    }

    return {
      luminaireName,
      mastNumber: i + 1,
      position: { x: lp.x, y: lp.y, z: lp.mastheight },
      aimingPoint: { x: aimX, y: aimY },
      rotation: 0, // Not available in lightpoints data
      tilt: lp.tilt,
      colorDot,
    };
  });
}

/* ─── German number formatting ─── */
const fmtDe = (n: number, decimals = 2) =>
  n.toFixed(decimals).replace('.', ',');

/**
 * Compute fieldMetrics from `results` (FieldResult) + calculationPoints.
 *
 * Uses the pre-computed results record (rg, ta/pa values) when available.
 * Falls back to computing from raw eh values in calculationPoints.
 */
/**
 * Build field metrics table from pre-computed server results.
 *
 * Uses PA (playing area) values for the primary EN 12193 criteria,
 * and TA (total area) values only for the TA/PA ratio rows.
 * Falls back to recalculating from raw calculationPoints only when
 * the server didn't provide a results record.
 */
export function computeFieldMetrics(
  calculationPoints: CalculationPoint[],
  results?: FieldResult[],
): ResultMetric[] {
  const r = results && results.length > 0 ? results[0] : null;

  // --- Fallback: gather stats from raw calculation points (only if no results record) ---
  const ehValues = calculationPoints
    .map((cp) => cp.eh)
    .filter((v): v is number => v != null && typeof v === 'number' && !isNaN(v));

  const ehMean = ehValues.length > 0 ? ehValues.reduce((a, b) => a + b, 0) / ehValues.length : null;
  const ehMin = ehValues.length > 0 ? Math.min(...ehValues) : null;
  const ehMax = ehValues.length > 0 ? Math.max(...ehValues) : null;

  // --- Primary values: use PA (playing area) from server results ---
  // PA is the primary assessment area per EN 12193
  const paEhave = r?.pa_ehave ?? ehMean;
  const paEhmin = r?.pa_ehmin ?? ehMin;
  const paU = r?.pa_u ?? (paEhave && paEhmin ? paEhmin / paEhave : null);

  // TA (total area) values — used for TA/PA ratio calculations
  const taEhave = r?.ta_ehave ?? null;
  const taU = r?.ta_u ?? null;

  // Glare rating — directly from server
  const rg = r?.rg ?? null;

  // Emin/Emax from raw calculation points (for info rows, not norm criteria)
  const eMin = ehMin ?? paEhmin;
  const eMax = ehMax;
  const minMaxRatio = eMin != null && eMax != null && eMax > 0 ? eMin / eMax : null;

  // TA/PA ratios — how well the total area compares to playing area
  const taPaIllum = taEhave != null && paEhave != null && paEhave > 0
    ? (taEhave / paEhave) * 100 : null;
  const taPaUnif = taU != null && paU != null && paU > 0
    ? (taU / paU) * 100 : null;

  if (paEhave == null) return []; // No data at all

  const metrics: ResultMetric[] = [
    {
      // EN 12193: Average maintained illuminance on playing area
      label: 'Mittlerer Wartungswert E',
      subscript: 'm',
      requirement: '> 75 lux',
      result: `${Math.round(paEhave)} lux`,
      passed: paEhave > 75,
      unit: 'lux',
      source: r ? 'dump' : 'dump',
    },
    {
      // EN 12193: Uniformity on playing area (Emin / Eavg)
      label: 'Gleichmäßigkeit E',
      subscript: 'min/m',
      requirement: '> 0,50',
      result: paU != null ? fmtDe(paU) : '—',
      passed: paU != null ? paU > 0.5 : true,
      source: r ? 'dump' : 'dump',
    },
    {
      // EN 12193: Glare rating (threshold increment)
      label: 'Blendindex R',
      subscript: 'G',
      requirement: '< 55',
      result: rg != null ? fmtDe(rg, 1) : '—',
      passed: rg != null ? rg < 55 : true,
      source: rg != null ? 'dump' : 'invented',
    },
    {
      // EN 12193: Ratio of total area to playing area illuminance
      label: 'Verhältnis Beleuchtungsstärke T',
      subscript: 'a/Pa',
      requirement: '> 75 %',
      result: taPaIllum != null ? `${Math.round(taPaIllum)} %` : '—',
      passed: taPaIllum != null ? taPaIllum > 75 : true,
      source: taPaIllum != null ? 'dump' : 'invented',
    },
    {
      // EN 12193: Ratio of total area to playing area uniformity
      label: 'Verhältnis Gleichmäßigkeit T',
      subscript: 'a/Pa',
      requirement: '> 75 %',
      result: taPaUnif != null ? `${Math.round(taPaUnif)} %` : '—',
      passed: taPaUnif != null ? taPaUnif > 75 : true,
      source: taPaUnif != null ? 'dump' : 'invented',
    },
    {
      // Info: min/max ratio from raw calculation points
      label: 'Ungleichmäßigkeit E',
      subscript: 'min/max',
      requirement: '',
      result: minMaxRatio != null ? fmtDe(minMaxRatio) : '—',
      passed: true,
      source: 'dump',
    },
    {
      // Info: minimum illuminance from raw calculation points
      label: 'E',
      subscript: 'min',
      requirement: '',
      result: eMin != null ? `${fmtDe(eMin, 1)} lux` : '—',
      passed: true,
      source: 'dump',
    },
    {
      // Info: maximum illuminance from raw calculation points
      label: 'E',
      subscript: 'max',
      requirement: '',
      result: eMax != null ? `${fmtDe(eMax, 1)} lux` : '—',
      passed: true,
      source: 'dump',
    },
  ];

  return metrics;
}
