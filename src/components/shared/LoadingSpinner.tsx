export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center">
      <div className="text-center">
        <div
          className="inline-block w-8 h-8 border-3 border-signify-gray/30 border-t-signify-dark rounded-full animate-spin"
          role="status"
        />
        <p className="mt-4 text-sm text-signify-gray">Laden...</p>
      </div>
    </div>
  );
}
