/**
 * Position → Mast: Leuchten, die sich eine Position teilen, bilden EINEN Mast.
 *
 * In der Datenbank gibt es nur Leuchten (`lightpoints`-Zeilen) — die Presets
 * setzen bei 2 Leuchten pro Mast zwei Zeilen auf dieselbe Koordinate. "Mast"
 * ist im ganzen System ein abgeleiteter Anzeige-Begriff. Ohne Gruppierung
 * druckten Karte und Heatmap je Leuchte ein "Mast N"-Label — an Masten mit
 * 2 Leuchten lagen zwei Labels uebereinander ("Mast 7"/"Mast 8"-Matsch),
 * und die Nummern widersprachen der Cover-Kachel "Masten" (S30).
 *
 * Konventionen (identisch zu `_zeichnung_verdichten` im ils-sport-Backend
 * und zur S30-Zaehlung im Report-Cover):
 *   - Position auf 0,1 m gerundet vergleichen,
 *   - Mastnummer 1..M in der Reihenfolge des ersten Vorkommens — Projekte
 *     mit 1 Leuchte je Mast behalten damit exakt ihre bisherigen Nummern.
 */

export interface XY {
  x: number;
  y: number;
}

export interface MastGruppe<T extends XY = XY> {
  mastNumber: number;
  x: number;
  y: number;
  /** Indizes der zugehoerigen Leuchten im Eingabe-Array (0-basiert). */
  indices: number[];
  items: T[];
}

const posKey = (p: XY) => `${p.x.toFixed(1)}|${p.y.toFixed(1)}`;

export function gruppiereMasten<T extends XY>(items: T[]): MastGruppe<T>[] {
  const gruppen: MastGruppe<T>[] = [];
  const nachPos = new Map<string, MastGruppe<T>>();
  items.forEach((item, i) => {
    const k = posKey(item);
    let g = nachPos.get(k);
    if (!g) {
      g = { mastNumber: gruppen.length + 1, x: item.x, y: item.y, indices: [], items: [] };
      nachPos.set(k, g);
      gruppen.push(g);
    }
    g.indices.push(i);
    g.items.push(item);
  });
  return gruppen;
}

/** Mastnummer je Leuchte, indexgleich zum Eingabe-Array. */
export function mastNummern(items: XY[]): number[] {
  const nummern = new Array<number>(items.length);
  gruppiereMasten(items).forEach((g) =>
    g.indices.forEach((i) => {
      nummern[i] = g.mastNumber;
    }),
  );
  return nummern;
}
