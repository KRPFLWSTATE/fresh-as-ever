'use client';

export default function AuthErrorPage({ error, reset }) {
  return (
    <div className="stub-page">
      <h1>Authentication Error</h1>
      <p>{error?.message || 'Something went wrong during authentication.'}</p>
      <button onClick={reset} style={{ marginTop: '1rem', color: '#01696f', fontWeight: 600 }}>
        Try again
      </button>
    </div>
  );
}
