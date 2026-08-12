/**
 * Anhang: Sportbeleuchtungs-Broschüre.
 *
 * Kundenwunsch 2026-03 (Signify/Rainer): „Vorgegebene PDF-Datei mit dem
 * Ausdruck zu einer PDF zusammenführen". Da der Report eine HTML-Seite ist,
 * die per Browser-Druck (window.print()) zu PDF wird, betten wir die
 * Broschürenseiten als Bilder ans Ende des Reports ein — so ergibt ein
 * einziger Druckvorgang eine gemeinsame PDF.
 *
 * Inhalt: offizielle Signify-Broschüre „Beleuchtung eines Fußballfeldes" (9 S.).
 *
 * ── Broschüre austauschen ──────────────────────────────────────────────
 * Die Seitenbilder liegen unter `public/brochure/page-N.jpg`. Zum Tausch
 * gegen eine andere Broschüre einfach die JPGs ersetzen und
 * `BROCHURE_PAGE_COUNT` anpassen. Rastern z.B. mit:
 *   pdftoppm -jpeg -scale-to-x 1600 -scale-to-y -1 brochure.pdf public/brochure/page
 */

// Anzahl der Broschürenseiten (public/brochure/page-1.jpg … page-N.jpg).
const BROCHURE_PAGE_COUNT = 9;

export function AppendixSection() {
  const pages = Array.from({ length: BROCHURE_PAGE_COUNT }, (_, i) => i + 1);
  const base = import.meta.env.BASE_URL;

  return (
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="section-accent w-1 h-8 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-signify-dark">Anhang</h1>
          <p className="text-sm text-signify-gray">Sportbeleuchtungs-Broschüre</p>
        </div>
      </div>

      {/* Brochure pages — landscape slides, each on its own print page */}
      <div className="space-y-6">
        {pages.map((n) => (
          <img
            key={n}
            src={`${base}brochure/page-${n}.jpg`}
            alt={`Broschüre Seite ${n}`}
            loading="lazy"
            className="w-full h-auto rounded-lg border border-border shadow-sm brochure-page"
          />
        ))}
      </div>
    </section>
  );
}
