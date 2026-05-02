'use client';

export default function ErrorPage({ error, reset }) {
  return (
    <div className="stub-page">
      <h1>Something went wrong</h1>
      <p>{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} className="mt-4 text-primary font-semibold">
        Try again
      </button>
    </div>
  );
}
