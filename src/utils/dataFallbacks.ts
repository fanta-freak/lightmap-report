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
  FieldSpecification,
} from '../types';

/* ─── Color palette for luminaire type dots ─── */
// Exportiert, damit Mast-Tabelle, Karte und Leuchten-Datenblätter dieselbe
// Farbkodierung pro Leuchtentyp verwenden können (Kundenwunsch 2026-03).
export const DOT_COLORS = [
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
 * Build field metrics table purely from pre-computed server results.
 *
 * This function does NO recalculation — all values come directly from the
 * calculation server's results record. The report is a dumb display layer.
 */
export function computeFieldMetrics(
  _calculationPoints: CalculationPoint[],
  results?: FieldResult[],
  spec?: FieldSpecification,
): ResultMetric[] {
  const r = results && results.length > 0 ? results[0] : null;
  if (!r) return [];

  // ── Editierbare Norm-Vorgaben (2026-08-13) ─────────────────────────────
  // Die drei Pruefwerte kommen jetzt aus dem fieldSpec des Payloads (der
  // Nutzer kann sie je Projekt anpassen); eingefrorene aeltere Payloads
  // haben die Felder nicht und fallen auf die Klasse-III-Defaults zurueck.
  // Die TA/PA-Quoten (75 %) bleiben fix — die Norm fordert sie unabhaengig
  // vom gewaehlten Beleuchtungsniveau.
  const emSoll = spec?.emTarget ?? 75;
  const uoSoll = spec?.uoTarget ?? 0.5;
  const rgSoll = spec?.rgMax ?? 55;

  // ── Alles direkt aus dem results-Satz des Rechenservers ────────────────
  // Merge 2026-08-12: die Juli-Linie (PR "pure display layer") hatte die
  // Nachrechnung aus calculationPoints entfernt, die August-Linie die
  // Quellen auf die SPIELFLAECHE (pa_*) umgestellt — das Rasterfeld gehoert
  // nicht zwingend zu DIESEM Lauf (Rainers Befund, Report 841). Beides gilt
  // jetzt zusammen: keine Nachrechnung, PA-Werte fuehren, Ta/Pa kommt als
  // vorberechnetes Verhaeltnis vom Server.
  const emWert = r.pa_ehave ?? r.ta_ehave ?? null;
  const uWert = r.pa_u ?? r.ta_u ?? null;
  const rg = r.rg ?? null;
  const taPaIllum = r.ta_to_pa_ehave != null ? r.ta_to_pa_ehave * 100 : null;
  const taPaUnif = r.ta_to_pa_u != null ? r.ta_to_pa_u * 100 : null;

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
      // EN 12193 (bzw. editierte Vorgabe): Average maintained illuminance (PA)
      label: 'Mittlerer Wartungswert E',
      subscript: 'm',
      requirement: `≥ ${fmtDe(emSoll, Number.isInteger(emSoll) ? 0 : 1)} lux`,
      result: emAnzeige != null ? `${emAnzeige} lux` : '—',
      passed: emAnzeige != null ? emAnzeige >= emSoll : true,
      unit: 'lux',
      source: 'dump',
    },
    {
      // EN 12193: Uniformity on playing area (Emin / Eavg)
      label: 'Gleichmäßigkeit E',
      subscript: 'min/m',
      formula: 'Eₘᵢₙ / Ēₘ',
      requirement: `≥ ${fmtDe(uoSoll)}`,
      result: uAnzeige != null ? fmtDe(uAnzeige) : '—',
      passed: uAnzeige != null ? uAnzeige >= uoSoll : true,
      source: 'dump',
    },
    {
      // EN 12193: Glare rating (threshold increment)
      label: 'Blendindex R',
      subscript: 'G',
      requirement: `≤ ${fmtDe(rgSoll, Number.isInteger(rgSoll) ? 0 : 1)}`,
      result: rgAnzeige != null ? fmtDe(rgAnzeige, 1) : '—',
      passed: rgAnzeige != null ? rgAnzeige <= rgSoll : true,
      source: rg != null ? 'dump' : 'invented',
    },
    {
      // EN 12193: TA/PA illuminance ratio — pre-computed by server
      label: 'Verhältnis Beleuchtungsstärke T',
      subscript: 'a/Pa',
      formula: 'Ēₘ(Ta) / Ēₘ(Pa)',
      requirement: '≥ 75 %',
      result: taPaIllumAnzeige != null ? `${taPaIllumAnzeige} %` : '—',
      passed: taPaIllumAnzeige != null ? taPaIllumAnzeige >= 75 : true,
      source: taPaIllum != null ? 'dump' : 'invented',
    },
    {
      // EN 12193: TA/PA uniformity ratio — pre-computed by server
      label: 'Verhältnis Gleichmäßigkeit T',
      subscript: 'a/Pa',
      formula: 'Uₒ(Ta) / Uₒ(Pa)',
      requirement: '≥ 75 %',
      result: taPaUnifAnzeige != null ? `${taPaUnifAnzeige} %` : '—',
      passed: taPaUnifAnzeige != null ? taPaUnifAnzeige >= 75 : true,
      source: taPaUnif != null ? 'dump' : 'invented',
    },
    {
      // Info: Emin/Emax ratio on playing area.
      // pa_ehmax gibt es erst seit 2026-08-07 — eingefrorene aeltere
      // Payloads haben das Feld nicht, deshalb ueberall der '—'-Rueckfall.
      label: 'Ungleichmäßigkeit E',
      subscript: 'min/max',
      formula: 'Eₘᵢₙ / Eₘₐₓ',
      requirement: '',
      result: r.pa_ehmin != null && r.pa_ehmax != null && r.pa_ehmax > 0
        ? fmtDe(r.pa_ehmin / r.pa_ehmax) : '—',
      passed: true,
      source: 'dump',
    },
    {
      // Info: minimum illuminance on playing area
      label: 'E',
      subscript: 'min',
      requirement: '',
      result: r.pa_ehmin != null ? `${fmtDe(r.pa_ehmin, 1)} lux` : '—',
      passed: true,
      source: 'dump',
    },
    {
      // Info: maximum illuminance on playing area
      label: 'E',
      subscript: 'max',
      requirement: '',
      result: r.pa_ehmax != null ? `${fmtDe(r.pa_ehmax, 1)} lux` : '—',
      passed: true,
      source: 'dump',
    },
  ];

  return metrics;
}
