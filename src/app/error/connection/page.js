'use client';

import { useRouter } from 'next/navigation';
import { WifiSlash, ArrowClockwise } from '@phosphor-icons/react';

export default function ConnectionErrorPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-page-margin-mobile">
      <section className="w-full max-w-md bg-surface border border-divider rounded-3xl p-xl text-center space-y-md shadow-elevation-sm">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent mx-auto flex items-center justify-center">
          <WifiSlash size={32} weight="fill" />
        </div>
        <h1 className="font-h2 text-h2 text-text">Connection Lost</h1>
        <p className="font-body-md text-text-muted">We could not reach the server. Check your internet and try again.</p>
        <button
          onClick={() => router.refresh()}
          className="w-full h-12 rounded-xl bg-primary text-white font-label font-bold inline-flex items-center justify-center gap-2"
        >
          <ArrowClockwise size={18} weight="bold" />
          Retry
        </button>
      </section>
    </main>
  );
}
