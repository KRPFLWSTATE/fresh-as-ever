'use client';

export default function ErrorPage({ error, reset }) {
  return (
    <div className="stub-page">
      <h1>Something went wrong</h1>
      <p>{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} style={{ marginTop: '1rem', color: '#01696f', fontWeight: 600 }}>
        Try again
      </button>
    </div>
  );
}
