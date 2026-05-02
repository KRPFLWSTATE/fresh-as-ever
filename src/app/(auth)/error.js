'use client';

export default function AuthErrorPage({ error, reset }) {
  return (
    <div className="stub-page">
      <h1>Authentication Error</h1>
      <p>{error?.message || 'Something went wrong during authentication.'}</p>
      <button onClick={reset} className="mt-4 text-primary font-semibold">
        Try again
      </button>
    </div>
  );
}
