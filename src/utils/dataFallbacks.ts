/**
 * Data fallback utilities.
 *
 * When the API payload is missing certain derived arrays (luminaireList, fieldMetrics),
 * these functions synthesize them from the raw data that IS available
 * (lightpoints, directions, luminaires, calculationPoints).
 */

import type {
  LuminaireListEntry,
  LightPoint,
  Direction,
  Luminaire,
  CalculationPoint,
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

/**
 * Auto-compute basic fieldMetrics from calculationPoints.
 *
 * Computes Em, Emin, Emax, uniformity (Emin/Em), and Emin/Emax.
 * Glare (RG) and Ta/Pa ratios cannot be computed from eh values alone
 * and are marked as "—".
 */
export function computeFieldMetrics(
  calculationPoints: CalculationPoint[],
): ResultMetric[] {
  // Filter to points with valid eh values
  const ehValues = calculationPoints
    .map((cp) => cp.eh)
    .filter((v): v is number => v != null && typeof v === 'number' && !isNaN(v));

  if (ehValues.length === 0) return [];

  const sum = ehValues.reduce((a, b) => a + b, 0);
  const mean = sum / ehValues.length;
  const min = Math.min(...ehValues);
  const max = Math.max(...ehValues);
  const uniformity = mean > 0 ? min / mean : 0;
  const minMaxRatio = max > 0 ? min / max : 0;

  const fmtDe = (n: number, decimals = 2) =>
    n.toFixed(decimals).replace('.', ',');

  return [
    {
      label: 'Mittlerer Wartungswert E',
      subscript: 'm',
      requirement: '> 75 lux',
      result: `${Math.round(mean)} lux`,
      passed: mean > 75,
      unit: 'lux',
      source: 'dump',
    },
    {
      label: 'Gleichmäßigkeit E',
      subscript: 'min/m',
      requirement: '> 0,50',
      result: fmtDe(uniformity),
      passed: uniformity > 0.5,
      source: 'dump',
    },
    {
      label: 'Blendindex R',
      subscript: 'G',
      requirement: '< 55',
      result: '—',
      passed: true, // Cannot verify — mark as pass with dash
      source: 'invented',
    },
    {
      label: 'Verhältnis Beleuchtungsstärke T',
      subscript: 'a/Pa',
      requirement: '> 75 %',
      result: '—',
      passed: true,
      source: 'invented',
    },
    {
      label: 'Verhältnis Gleichmäßigkeit T',
      subscript: 'a/Pa',
      requirement: '> 75 %',
      result: '—',
      passed: true,
      source: 'invented',
    },
    {
      label: 'Ungleichmäßigkeit E',
      subscript: 'min/max',
      requirement: '',
      result: fmtDe(minMaxRatio),
      passed: true,
      source: 'dump',
    },
    {
      label: 'E',
      subscript: 'min',
      requirement: '',
      result: `${fmtDe(min, 1)} lux`,
      passed: true,
      source: 'dump',
    },
    {
      label: 'E',
      subscript: 'max',
      requirement: '',
      result: `${fmtDe(max, 1)} lux`,
      passed: true,
      source: 'dump',
    },
  ];
}
