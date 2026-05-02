'use client';

import { ChartLineUp, ShoppingBag, HandCoins, Star, Leaf, TrendUp, CaretRight, Circle } from '@phosphor-icons/react';
import { useMerchantReviews } from '@/hooks/useMerchantReviews';

export default function MerchantAnalyticsPage() {
  const { reviews, averageRating, loading: reviewsLoading } = useMerchantReviews();
  const avgRating = Number(averageRating || 0).toFixed(1);

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header */}
      <div className="pt-4">
        <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Business Intelligence</p>
        <h1 className="font-display text-h1 md:text-display text-text">Performance Insights</h1>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md md:gap-lg">
        {[
          { l: 'Bags Sold', v: '248', d: '+18%', i: ShoppingBag, c: 'text-primary', bg: 'bg-primary/10' },
          { l: 'Revenue', v: 'Rs. 124k', d: '+22%', i: HandCoins, c: 'text-success', bg: 'bg-success/10' },
          { l: 'Avg Rating', v: avgRating, d: `${reviews.length} reviews`, i: Star, c: 'text-accent', bg: 'bg-accent/10' },
          { l: 'CO₂ Saved', v: '186 kg', d: '+12%', i: Leaf, c: 'text-success', bg: 'bg-success/5' }
        ].map((k, i) => {
          const Icon = k.i;
          return (
            <div key={i} className="bg-surface rounded-[2.5rem] p-lg border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-all group">
              <div className="flex items-center justify-between mb-xl">
                <span className="font-label text-xs font-bold text-text-muted uppercase tracking-wider">{k.l}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-divider/50 transition-transform group-hover:scale-110 ${k.bg} ${k.c}`}>
                  <Icon size={20} weight="fill" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-display text-2xl font-black text-text block">{k.v}</span>
                <div className="flex items-center gap-1">
                  <TrendUp size={12} weight="bold" className="text-success" />
                  <span className="font-label text-[10px] font-bold text-success uppercase">{k.d}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chart Section */}
      <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h2 className="font-h3 text-h3 text-text">Sales Trends</h2>
            <p className="font-body-sm text-text-muted">Net growth performance for the last 30 days</p>
          </div>
          <div className="bg-surface-2 p-1.5 rounded-2xl flex border border-divider">
            {['Daily', 'Weekly'].map((tab) => (
              <button key={tab} className={`px-4 py-1.5 rounded-xl font-label text-xs font-bold transition-all ${tab === 'Daily' ? 'bg-white text-primary shadow-elevation-md' : 'text-text-muted hover:text-text'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-80 bg-surface-2 rounded-[2rem] border border-divider flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')]" />
          <ChartLineUp size={80} weight="thin" className="text-text-faint/30 relative z-10 group-hover:scale-110 transition-transform duration-700" />
          <p className="absolute bottom-6 font-label text-xs font-bold text-text-faint uppercase tracking-widest">Interactive chart rendering...</p>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg md:gap-xl">
        <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm flex flex-col">
          <h3 className="font-h3 text-h3 text-text mb-xl">Top Selling Bags</h3>
          <div className="space-y-md flex-1">
            {['Evening Pastry Box', 'Sourdough Surprise', 'Mixed Bread Bag'].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-5 hover:bg-surface-2 rounded-2xl border border-transparent hover:border-divider transition-all group cursor-pointer">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                    <ShoppingBag size={24} weight="bold" />
                  </div>
                  <span className="font-label text-lg font-bold text-text">{b}</span>
                </div>
                <div className="flex items-center gap-md">
                  <span className="font-display text-xl font-black text-primary">{[42, 38, 25][i]}</span>
                  <CaretRight size={16} weight="bold" className="text-text-faint" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm">
          <h3 className="font-h3 text-h3 text-text mb-xl">Latest Feedback</h3>
          <div className="space-y-md">
            {reviewsLoading ? (
              <div className="p-6 bg-surface-2 rounded-[2rem] border border-divider">
                <p className="font-body-sm text-text-muted">Loading customer feedback...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-6 bg-surface-2 rounded-[2rem] border border-divider">
                <p className="font-body-sm text-text-muted">No customer reviews yet.</p>
              </div>
            ) : (
              reviews.slice(0, 6).map((f) => (
              <div key={f.id} className="p-6 bg-surface-2 rounded-[2rem] border border-divider hover:bg-white hover:shadow-elevation-md transition-all">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} weight="fill" className={j < f.rating ? 'text-accent' : 'text-divider'} />
                  ))}
                </div>
                <p className="font-body-md text-text font-medium italic mb-3">"{f.comment || 'No additional comment'}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {f.customerName?.[0] || 'C'}
                  </div>
                  <span className="font-label text-xs font-bold text-text-muted">{f.customerName}</span>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}