import { Component, type ReactNode } from 'react';

/**
 * Faengt Fehler eines einzelnen Berichtsabschnitts ab.
 *
 * WARUM ES DAS GIBT (2026-08-07)
 * React bricht bei einem Fehler im Render den GESAMTEN Baum ab — aus einer
 * kaputten Zeile wird eine komplett weisse Seite. Genau das ist zweimal an
 * einem Tag passiert:
 *
 *   * Report 825: `project_wattage` war null, `.toLocaleString()` warf.
 *   * Report 10:  Masten mit dem Alt-Platzhalter "Test" statt Koordinaten,
 *                 daraus NaN, die Karte warf `Invalid LngLat object`.
 *
 * Beide Ursachen sind inzwischen behoben. Aber die Lehre ist die allgemeine:
 * ein Bericht wird aus Bestandsdaten aus zwei Jahren zusammengesetzt, und
 * irgendein Feld wird wieder fehlen. Dann soll der betroffene Abschnitt einen
 * Hinweis zeigen und der Rest des Berichts lesbar bleiben — ein Bericht mit
 * einer Luecke ist brauchbar, eine leere Seite nicht.
 */
interface Props {
  /** Name des Abschnitts, erscheint im Hinweis und im Konsolen-Log. */
  name: string;
  children: ReactNode;
}

interface State {
  fehler: Error | null;
}

export class AbschnittSicherung extends Component<Props, State> {
  state: State = { fehler: null };

  static getDerivedStateFromError(fehler: Error): State {
    return { fehler };
  }

  componentDidCatch(fehler: Error) {
    // Bewusst mit Abschnittsnamen — sonst steht im Log nur ein Stacktrace aus
    // minifiziertem Code, und man sucht wieder von aussen nach der Ursache.
    console.error(`Abschnitt "${this.props.name}" konnte nicht dargestellt werden:`, fehler);
  }

  render() {
    if (!this.state.fehler) return this.props.children;

    return (
      <div className="my-4 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">
          Abschnitt „{this.props.name}“ kann nicht dargestellt werden
        </p>
        <p className="mt-1">
          Diesem Bericht fehlen dafür Daten. Die übrigen Abschnitte sind davon
          nicht betroffen.
        </p>
        <p className="mt-2 font-mono text-xs opacity-70">{this.state.fehler.message}</p>
      </div>
    );
  }
}
