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
  CalculationPoint,  // kept for function signature compatibility
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
 * Build field metrics table purely from pre-computed server results.
 *
 * This function does NO recalculation — all values come directly from the
 * calculation server's results record. The report is a dumb display layer.
 */
export function computeFieldMetrics(
  _calculationPoints: CalculationPoint[],
  results?: FieldResult[],
): ResultMetric[] {
  const r = results && results.length > 0 ? results[0] : null;
  if (!r) return [];

  // All values straight from the server — no recalculation
  const taPaIllum = r.ta_to_pa_ehave * 100;  // server sends as ratio (e.g. 0.96)
  const taPaUnif = r.ta_to_pa_u * 100;       // server sends as ratio (e.g. 0.67)

  const metrics: ResultMetric[] = [
    {
      // EN 12193: Average maintained illuminance on playing area (PA)
      label: 'Mittlerer Wartungswert E',
      subscript: 'm',
      requirement: '> 75 lux',
      result: `${Math.round(r.pa_ehave)} lux`,
      passed: r.pa_ehave > 75,
      unit: 'lux',
      source: 'dump',
    },
    {
      // EN 12193: Uniformity on playing area (Emin / Eavg)
      label: 'Gleichmäßigkeit E',
      subscript: 'min/m',
      requirement: '> 0,50',
      result: fmtDe(r.pa_u),
      passed: r.pa_u > 0.5,
      source: 'dump',
    },
    {
      // EN 12193: Glare rating (threshold increment)
      label: 'Blendindex R',
      subscript: 'G',
      requirement: '< 55',
      result: fmtDe(r.rg, 1),
      passed: r.rg < 55,
      source: 'dump',
    },
    {
      // EN 12193: TA/PA illuminance ratio — pre-computed by server
      label: 'Verhältnis Beleuchtungsstärke T',
      subscript: 'a/Pa',
      requirement: '> 75 %',
      result: `${Math.round(taPaIllum)} %`,
      passed: taPaIllum > 75,
      source: 'dump',
    },
    {
      // EN 12193: TA/PA uniformity ratio — pre-computed by server
      label: 'Verhältnis Gleichmäßigkeit T',
      subscript: 'a/Pa',
      requirement: '> 75 %',
      result: `${Math.round(taPaUnif)} %`,
      passed: taPaUnif > 75,
      source: 'dump',
    },
    {
      // Info: Emin/Emax ratio on playing area
      label: 'Ungleichmäßigkeit E',
      subscript: 'min/max',
      requirement: '',
      result: r.pa_ehmax > 0 ? fmtDe(r.pa_ehmin / r.pa_ehmax) : '—',
      passed: true,
      source: 'dump',
    },
    {
      // Info: minimum illuminance on playing area
      label: 'E',
      subscript: 'min',
      requirement: '',
      result: `${fmtDe(r.pa_ehmin, 1)} lux`,
      passed: true,
      source: 'dump',
    },
    {
      // Info: maximum illuminance on playing area
      label: 'E',
      subscript: 'max',
      requirement: '',
      result: `${fmtDe(r.pa_ehmax, 1)} lux`,
      passed: true,
      source: 'dump',
    },
  ];

  return metrics;
}
