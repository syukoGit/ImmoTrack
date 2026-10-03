'use client';

export default function AuthenticatedError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <section role="alert">
      <h1>Une erreur est survenue</h1>
      <p className="muted">
        Le service est peut-être indisponible. Référence : {error.digest ?? 'non disponible'}.
      </p>
      <button type="button" onClick={reset}>
        Réessayer
      </button>
    </section>
  );
}
