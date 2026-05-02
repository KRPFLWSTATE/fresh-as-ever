'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoadingSplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/discover');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-page-margin-mobile">
      <div className="text-center space-y-md">
        <div className="w-20 h-20 rounded-3xl bg-primary-highlight mx-auto flex items-center justify-center">
          <img src="/logo.png" alt="Fresh As Ever" className="w-12 h-12 object-contain" />
        </div>
        <p className="font-label text-text-muted">Loading Fresh As Ever...</p>
      </div>
    </main>
  );
}
