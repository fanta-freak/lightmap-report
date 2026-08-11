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
      // 10.08.2026: Leistung je Mast. Vorher lag dem Bericht ueberhaupt keine
      // Leistung vor — die Gesamtleistung kam als fertige Zahl aus dem
      // Projekt und war, wenn die dortige Spalte leer war, einfach weg.
      wattage: lp.wattage ?? null,
    };
  });
}

/**
 * Gesamtleistung der Anlage in W.
 *
 * Fuehrend ist die Summe ueber die Masten, die dieser Bericht auch auflistet —
 * damit stimmt der Kopf per Konstruktion mit der Leuchtenliste ueberein.
 *
 * Umgestellt am 10.08.2026: vorher gewann die Zahl aus dem Projekt. Die war
 * zwischen dem 06.08. und dem 10.08. fuer jeden Lauf leer (die Rechenkette
 * hatte aufgehoert, das Aggregat zu schreiben, der Bericht druckte
 * "Leistung — W") — und in aelteren Berichten steht sie VERALTET drin, weil
 * spaetere Laeufe die Masten neu geschrieben haben, das Aggregat aber nicht.
 * Bericht 875 (Sportplatz Springe) druckte so "Gesamtleistung: 6.036 W" ueber
 * einer Spalte mit 6 × 1.505,9 W = 9.035,4 W.
 *
 * Weil gespeicherte Payloads eingefroren sind, aber hier im Browser gerendert
 * werden, korrigiert diese Reihenfolge auch bereits erzeugte Berichte.
 *
 * Das Projekt-Aggregat bleibt Rueckfall fuer aeltere Payloads, die ueberhaupt
 * keine Leistung je Mast tragen. Ist auch das nichts, bleibt es beim
 * Gedankenstrich statt bei einer erfundenen Null.
 */
export function gesamtleistung(
  projektLeistung: unknown,
  lightpoints: LightPoint[],
): number | null {
  const werte = lightpoints
    .map((lp) => lp.wattage)
    .filter((w): w is number => typeof w === 'number' && Number.isFinite(w));
  if (werte.length > 0) {
    return werte.reduce((a, b) => a + b, 0);
  }
  if (typeof projektLeistung === 'number' && Number.isFinite(projektLeistung) && projektLeistung > 0) {
    return projektLeistung;
  }
  return null;
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
export function computeFieldMetrics(
  calculationPoints: CalculationPoint[],
  results?: FieldResult[],
): ResultMetric[] {
  const r = results && results.length > 0 ? results[0] : null;

  // --- Gather eh-based stats as fallback ---
  const ehValues = calculationPoints
    .map((cp) => cp.eh)
    .filter((v): v is number => v != null && typeof v === 'number' && !isNaN(v));

  const ehMean = ehValues.length > 0 ? ehValues.reduce((a, b) => a + b, 0) / ehValues.length : null;
  const ehMin = ehValues.length > 0 ? Math.min(...ehValues) : null;
  const ehMax = ehValues.length > 0 ? Math.max(...ehValues) : null;

  // --- Use results record if available, otherwise fall back to eh stats ---
  const taEhave = r?.ta_ehave ?? ehMean;
  const taEhmin = r?.ta_ehmin ?? ehMin;
  const taU = r?.ta_u ?? (taEhave && taEhmin ? taEhmin / taEhave : null);
  const paEhave = r?.pa_ehave ?? null;
  const paU = r?.pa_u ?? null;
  const rg = r?.rg ?? null;

  // ── Emin/Emax: aus dem Ergebnissatz, nicht aus dem Rasterfeld ──────────
  // 2026-08-07 (Rainers Befund "die Zahlen sind falsch zusammengestellt"):
  // Hier stand `ehMin`, also das Minimum ueber calculationPoints. Das ist
  // aus zwei Gruenden falsch:
  //
  //   1. Das Rasterfeld gehoert nicht zwingend zu DIESEM Lauf. Ein Projekt
  //      hat genau EINEN Satz Rechenpunkte, den jede neue Berechnung
  //      ueberschreibt — die Kennzahlen im results-Satz bleiben dagegen je
  //      Lauf erhalten. Bei Report 841 kamen die Kennzahlen aus Lauf 319
  //      (Emin 42,7) und das Raster aus Lauf 321 (Emin 0,3), 26 Sekunden
  //      vorher gerechnet.
  //   2. Selbst beim passenden Lauf ist das blosse Raster-Minimum nicht die
  //      Norm-Groesse: `pa_ehmin` ist der Wert der SPIELFLAECHE, den die
  //      Engine ausweist.
  //
  // Ergebnis war ein Bericht, der sich selbst widersprach: Emin 0,3 lux bei
  // Em 84 lux waere eine Gleichmaessigkeit von 0,004 — ausgewiesen war 0,50.
  const eMin = r?.pa_ehmin ?? ehMin ?? taEhmin;
  const eMax = r?.pa_ehmax ?? ehMax;
  const minMaxRatio = eMin != null && eMax != null && eMax > 0 ? eMin / eMax : null;

  // Ta/Pa illuminance ratio
  const taPaIllum = taEhave != null && paEhave != null && paEhave > 0
    ? (taEhave / paEhave) * 100 : null;

  // Ta/Pa uniformity ratio
  const taPaUnif = taU != null && paU != null && paU > 0
    ? (taU / paU) * 100 : null;

  if (taEhave == null) return []; // No data at all

  // ── Spielflaeche, nicht Gesamtflaeche ──────────────────────────────────
  // 2026-08-07: Die beiden ersten Zeilen nahmen `ta_*` (Gesamtflaeche =
  // Spielfeld plus 2,5 m Umlauf). Geprueft wird nach EN 12193 aber die
  // SPIELFLAECHE, und genau die zeigt auch die Projektseite im Tool.
  // Wirkung bei Rainers Report 841: Em stand mit 84 lux statt 81,5, und die
  // Gleichmaessigkeit mit ta_u = 0,50 statt pa_u = 0,52 — dadurch bekam ein
  // Entwurf ein rotes Kreuz, der die Vorgabe tatsaechlich erfuellt.
  // Die beiden Ta/Pa-Verhaeltniszeilen weiter unten brauchen die
  // Gesamtflaechenwerte natuerlich weiterhin.
  const emWert = paEhave ?? taEhave;
  const uWert = paU ?? taU;

  // ── Nachweis auf den Anzeigewerten, mit ≥/≤ statt >/< ──────────────────
  // 2026-08-11: EN 12193 nennt MINDEST- bzw. Hoechstwerte — ein exakt
  // getroffener Grenzwert (Uo = 0,50, GR = 55,0) erfuellt die Norm. Vorher
  // wurde strikt verglichen (`uWert > 0.5`) und auf dem Rohwert geprueft:
  // ein Rohwert von z.B. 0,496 stand als "0,50" in der Tabelle, bekam aber
  // ein rotes Kreuz neben der Vorgabe "> 0,50" — fuer den Leser ein
  // Widerspruch. Deshalb wird jetzt erst auf die angezeigte Genauigkeit
  // gerundet und DANN verglichen; Anzeige und Status koennen sich damit
  // nie mehr widersprechen (so fuehren auch Relux/DIALux den Nachweis).
  const emAnzeige = emWert != null ? Math.round(emWert) : null;
  const uAnzeige = uWert != null ? Number(uWert.toFixed(2)) : null;
  const rgAnzeige = rg != null ? Number(rg.toFixed(1)) : null;
  const taPaIllumAnzeige = taPaIllum != null ? Math.round(taPaIllum) : null;
  const taPaUnifAnzeige = taPaUnif != null ? Math.round(taPaUnif) : null;

  const metrics: ResultMetric[] = [
    {
      label: 'Mittlerer Wartungswert E',
      subscript: 'm',
      requirement: '≥ 75 lux',
      result: emAnzeige != null ? `${emAnzeige} lux` : '—',
      passed: emAnzeige != null ? emAnzeige >= 75 : true,
      unit: 'lux',
      source: r ? 'dump' : 'dump',
    },
    {
      label: 'Gleichmäßigkeit E',
      subscript: 'min/m',
      requirement: '≥ 0,50',
      result: uAnzeige != null ? fmtDe(uAnzeige) : '—',
      passed: uAnzeige != null ? uAnzeige >= 0.5 : true,
      source: r ? 'dump' : 'dump',
    },
    {
      label: 'Blendindex R',
      subscript: 'G',
      requirement: '≤ 55',
      result: rgAnzeige != null ? fmtDe(rgAnzeige, 1) : '—',
      passed: rgAnzeige != null ? rgAnzeige <= 55 : true,
      source: rg != null ? 'dump' : 'invented',
    },
    {
      label: 'Verhältnis Beleuchtungsstärke T',
      subscript: 'a/Pa',
      requirement: '≥ 75 %',
      result: taPaIllumAnzeige != null ? `${taPaIllumAnzeige} %` : '—',
      passed: taPaIllumAnzeige != null ? taPaIllumAnzeige >= 75 : true,
      source: taPaIllum != null ? 'dump' : 'invented',
    },
    {
      label: 'Verhältnis Gleichmäßigkeit T',
      subscript: 'a/Pa',
      requirement: '≥ 75 %',
      result: taPaUnifAnzeige != null ? `${taPaUnifAnzeige} %` : '—',
      passed: taPaUnifAnzeige != null ? taPaUnifAnzeige >= 75 : true,
      source: taPaUnif != null ? 'dump' : 'invented',
    },
    {
      label: 'Ungleichmäßigkeit E',
      subscript: 'min/max',
      requirement: '',
      result: minMaxRatio != null ? fmtDe(minMaxRatio) : '—',
      passed: true,
      source: 'dump',
    },
    {
      label: 'E',
      subscript: 'min',
      requirement: '',
      result: eMin != null ? `${fmtDe(eMin, 1)} lux` : '—',
      passed: true,
      source: 'dump',
    },
    {
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
