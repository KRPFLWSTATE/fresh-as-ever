'use client';

import { Leaf, Coins, ShoppingBag } from '@phosphor-icons/react';
import { useCustomerImpact } from '@/hooks/useCustomerImpact';

export default function ImpactPage() {
  const { bagsRescued, co2SavedKg, totalSavedRs, loading } = useCustomerImpact();

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <header>
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Impact</p>
        <h1 className="font-display text-h1 text-text">Your Environmental Impact</h1>
      </header>

      <section className="bg-primary text-white rounded-3xl p-xl shadow-elevation-md">
        <p className="font-body-md text-white/80">Every rescue bag reduces food waste and supports local merchants.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-lg">
          <div className="bg-white/10 rounded-2xl p-md">
            <p className="font-label-caps text-[10px] text-white/70">Bags rescued</p>
            <p className="font-display text-3xl">{loading ? '…' : bagsRescued}</p>
            <ShoppingBag size={20} weight="fill" className="mt-2" />
          </div>
          <div className="bg-white/10 rounded-2xl p-md">
            <p className="font-label-caps text-[10px] text-white/70">CO2 saved</p>
            <p className="font-display text-3xl">{loading ? '…' : `${co2SavedKg} kg`}</p>
            <Leaf size={20} weight="fill" className="mt-2" />
          </div>
          <div className="bg-white/10 rounded-2xl p-md">
            <p className="font-label-caps text-[10px] text-white/70">Money saved</p>
            <p className="font-display text-3xl">
              {loading ? '…' : `Rs. ${Number(totalSavedRs).toLocaleString()}`}
            </p>
            <Coins size={20} weight="fill" className="mt-2" />
          </div>
        </div>
      </section>
    </main>
  );
}
