import { Link } from 'react-router-dom';

interface ErrorMessageProps {
  message?: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <p className="text-4xl mb-4">!</p>
        <h2 className="text-lg font-semibold text-signify-dark mb-2">
          Fehler beim Laden
        </h2>
        <p className="text-sm text-signify-gray mb-6">
          {message || 'Der Bericht konnte nicht geladen werden.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="px-4 py-2 text-sm font-medium text-signify-dark border border-border rounded hover:bg-bg-light transition-colors"
          >
            Zur Übersicht
          </Link>
          <Link
            to="/report/mock"
            className="px-4 py-2 text-sm font-medium text-white bg-signify-dark rounded hover:opacity-90 transition-colors"
          >
            Mock-Daten anzeigen
          </Link>
        </div>
      </div>
    </div>
  );
}
