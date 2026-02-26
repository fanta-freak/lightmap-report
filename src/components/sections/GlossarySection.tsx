import { useState } from 'react';
import type { GlossaryTerm } from '../../types';
import { SourceBadge } from '../shared/SourceBadge';

interface GlossarySectionProps {
  terms: GlossaryTerm[];
}

export function GlossarySection({ terms }: GlossarySectionProps) {
  const lightingTerms = terms.filter((t) => t.category === 'lighting');
  const laiTerms = terms.filter((t) => t.category === 'lai');

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div className="section-accent w-1 h-8 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-signify-dark">Glossar</h1>
          <p className="text-sm text-signify-gray">
            Erläuterung der lichttechnischen Begriffe
          </p>
        </div>
      </div>

      {/* Lighting terms */}
      <div className="bg-card-white rounded-lg border border-border overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-bg-light">
          <h3 className="text-lg font-bold text-signify-dark">Lichttechnische Begriffe</h3>
          <p className="text-xs text-signify-gray mt-0.5">Begriffe zur Bewertung der Sportbeleuchtung</p>
        </div>
        <div className="divide-y divide-gray-100">
          {lightingTerms.map((term, i) => (
            <GlossaryItem key={i} term={term} />
          ))}
        </div>
      </div>

      {/* LAI terms */}
      <div className="bg-card-white rounded-lg border border-border overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-bg-light">
          <h3 className="text-lg font-bold text-signify-dark">LAI-Begriffe</h3>
          <p className="text-xs text-signify-gray mt-0.5">Begriffe zur Bewertung der Lichtimmission</p>
        </div>
        <div className="divide-y divide-gray-100">
          {laiTerms.map((term, i) => (
            <GlossaryItem key={i} term={term} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GlossaryItem({ term }: { term: GlossaryTerm }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-signify-teal/3 transition-colors -mx-8 px-8"
      >
        <span className="text-base font-semibold text-signify-dark">
          <SourceBadge source="pdf">
            {term.term}
            {term.subscript && (
              <sub className="text-xs text-signify-gray ml-0.5">{term.subscript}</sub>
            )}
          </SourceBadge>
        </span>
        <svg
          className={`w-5 h-5 text-signify-gray transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-4 -mt-1">
          <p className="text-sm text-signify-gray leading-relaxed">
            <SourceBadge source="invented">{term.definition}</SourceBadge>
          </p>
        </div>
      )}
    </div>
  );
}
