'use client';

import Link from 'next/link';
import { Leaf, ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const merchantHref =
    role === 'merchant_staff' || role === 'merchant' ? '/merchant/dashboard' : '/login?portal=merchant';
  const adminHref = role === 'admin' ? '/admin/dashboard' : '/login?portal=admin';

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-page-margin-mobile md:p-page-margin-desktop text-center max-w-2xl mx-auto w-full py-20">
        <div className="w-24 h-24 bg-primary-highlight rounded-3xl mb-xl flex items-center justify-center shadow-elevation-md">
          <img src="/logo.png" alt="Fresh As Ever" className="w-16 h-16 object-contain" />
        </div>
        
        <h1 className="font-display text-[56px] leading-tight text-primary mb-md font-extrabold tracking-tight">
          Fresh As Ever
        </h1>
        <p className="font-body-lg text-text-muted mb-2xl max-w-md mx-auto">
          Save high-quality surplus food from local merchants. Reduce waste, save money, and eat fresh.
        </p>

        <div className="w-full space-y-md max-w-sm">
          <Link href="/discover" className="flex items-center justify-center gap-2 w-full h-14 bg-primary text-white font-label text-lg font-bold rounded-2xl hover:bg-primary-hover active:scale-[0.98] transition-all shadow-elevation-md">
            Start Exploring
            <ArrowRight size={20} weight="bold" />
          </Link>
          <Link href="/onboarding" className="flex items-center justify-center w-full h-14 bg-surface-2 text-text font-label text-lg font-bold rounded-2xl hover:bg-surface-2 active:scale-[0.98] transition-all border border-divider">
            How It Works
          </Link>
          
          <div className="pt-8 border-t border-divider mt-12 flex items-center justify-center gap-4">
            <Link href={merchantHref} className="text-primary font-label font-bold hover:underline">
              Merchant Portal
            </Link>
            <div className="w-1 h-1 rounded-full bg-divider" />
            <Link href={adminHref} className="text-primary font-label font-bold hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
