// Zahlenformatierung, die fehlende Werte aushaelt.
//
// WARUM ES DAS GIBT (2026-08-06)
// Report 825 blieb komplett weiss. Ursache: `project_wattage` war null, und
// die Seite rief darauf ungeprueft `.toLocaleString()` auf. Das wirft, React
// bricht den Renderbaum ab — und statt einer fehlenden Zeile sieht der Nutzer
// eine leere Seite. Es gab 18 solcher ungeschuetzten Aufrufe.
//
// Ein fehlender Wert ist ein normaler Zustand: nicht jedes Projekt hat eine
// Gesamtleistung, nicht jede Berechnung Fassadenwerte. Das gehoert als
// Gedankenstrich angezeigt, nicht als Absturz.

/** Platzhalter fuer "kein Wert vorhanden". */
export const KEIN_WERT = '—';

function istZahl(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Tausenderpunkte, deutsches Format. `dezimal` erzwingt Nachkommastellen.
 * Beispiel: dezimalZahl(6047.8) -> "6.047,8"
 */
export function grosseZahl(v: unknown, dezimal?: number): string {
  if (!istZahl(v)) return KEIN_WERT;
  return v.toLocaleString('de-DE', dezimal === undefined
    ? undefined
    : { minimumFractionDigits: dezimal, maximumFractionDigits: dezimal });
}

/**
 * Feste Nachkommastellen mit Komma als Trenner — die Schreibweise, die im
 * Bericht ueberall verwendet wird. Beispiel: zahl(51.223, 1) -> "51,2"
 */
export function zahl(v: unknown, stellen = 1): string {
  if (!istZahl(v)) return KEIN_WERT;
  return v.toFixed(stellen).replace('.', ',');
}

/**
 * Erster Eintrag eines Zahlen-Arrays (die API liefert Lichtstrom und
 * Leistung je Leuchte als Liste). Leere oder fehlende Liste -> Platzhalter.
 */
export function ersteZahl(liste: unknown, dezimal?: number): string {
  if (!Array.isArray(liste) || liste.length === 0) return KEIN_WERT;
  return grosseZahl(liste[0], dezimal);
}

/**
 * Maximum ueber eine Liste von Objektwerten — `Math.max()` auf einer leeren
 * Liste ergibt -Infinity, und `Math.max(...[null])` ergibt NaN. Beides wuerde
 * als "-Infinity" bzw. "NaN" im Bericht landen.
 */
export function groesster(werte: unknown[]): number | null {
  const zahlen = werte.filter(istZahl);
  return zahlen.length ? Math.max(...zahlen) : null;
}
