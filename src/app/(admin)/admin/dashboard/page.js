'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  ShoppingBag, 
  ChartLineUp, 
  Storefront, 
  Leaf, 
  MapPin,
  TrendUp,
  Circle
} from '@phosphor-icons/react';

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const view = searchParams?.get('view');
  const isColomboView = view === 'colombo';

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Platform Analytics</p>
          <h1 className="font-display text-h1 md:text-display text-text">
            {isColomboView ? 'Colombo Regional Overview' : 'Colombo Overview'}
          </h1>
        </div>
        <div className="flex items-center gap-sm bg-surface-2 px-4 py-2 rounded-full border border-divider shadow-sm w-fit">
          <Circle size={12} weight="fill" className="text-success animate-pulse" />
          <span className="font-label text-sm font-semibold text-text-muted">System Operational</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-lg">
        {/* Main Card */}
        <div className="md:col-span-8 bg-primary rounded-[2rem] p-lg md:p-xl flex flex-col justify-between relative overflow-hidden shadow-elevation-lg group h-[320px]">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
            <ChartLineUp size={320} weight="duotone" />
          </div>
          
          <div className="relative z-10">
            <h3 className="font-h3 text-h3 text-white/80 mb-xs">
              {isColomboView ? 'Total Rescues in Colombo Region' : 'Total Rescues in Colombo 03'}
            </h3>
            <p className="font-body-md text-white/50">
              {isColomboView ? 'Regional performance over the last 30 days' : 'Cumulative performance for the last 30 days'}
            </p>
          </div>

          <div className="relative z-10 flex items-baseline gap-sm">
            <span className="font-display text-7xl md:text-8xl font-black text-white tracking-tighter">1,248</span>
            <div className="flex items-center gap-1.5 text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <TrendUp size={18} weight="bold" />
              <span className="font-label text-sm font-bold">12%</span>
            </div>
          </div>
        </div>

        {/* Side Cards */}
        <div className="md:col-span-4 flex flex-col gap-md">
          <div className="bg-surface rounded-[2rem] p-lg flex-1 flex flex-col justify-center border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-shadow group">
            <div className="flex items-center justify-between mb-sm">
              <span className="font-label text-sm font-semibold text-text-muted uppercase tracking-wider">Active Merchants</span>
              <div className="w-12 h-12 rounded-2xl bg-primary-highlight flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Storefront size={28} weight="fill" />
              </div>
            </div>
            <span className="font-display text-5xl font-black text-text">42</span>
          </div>

          <div className="bg-surface rounded-[2rem] p-lg flex-1 flex flex-col justify-center border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-shadow group">
            <div className="flex items-center justify-between mb-sm">
              <span className="font-label text-sm font-semibold text-text-muted uppercase tracking-wider">Est. CO2 Saved (kg)</span>
              <div className="w-12 h-12 rounded-2xl bg-accent-highlight flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Leaf size={28} weight="fill" />
              </div>
            </div>
            <span className="font-display text-5xl font-black text-text">850.5</span>
          </div>
        </div>
      </section>

      {/* Lists Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-lg md:gap-xl pb-12">
        {/* Top Merchants */}
        <div className="bg-surface rounded-[2rem] p-xl border border-divider shadow-elevation-sm">
          <div className="flex items-center justify-between mb-xl">
            <h3 className="font-h3 text-h3 text-text">Top Performing Merchants</h3>
            <button className="text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all font-label text-sm font-bold">
              View All
            </button>
          </div>
          
          <ul className="space-y-md">
            {[{n:'The Bread Company',a:'Colombo 07',r:342,v:'Rs. 125k'},{n:'Butter Boutique',a:'Colombo 03',r:289,v:'Rs. 98k'},{n:'Cafe Kumbuk',a:'Colombo 07',r:156,v:'Rs. 45k'}].map((m,i)=>(
              <li key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-2 transition-colors cursor-pointer group">
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center border border-divider group-hover:border-primary/20 group-hover:bg-white transition-all">
                    <Storefront size={28} weight="bold" className="text-text-faint group-hover:text-primary" />
                  </div>
                  <div>
                    <h4 className="font-label text-lg font-bold text-text mb-0.5">{m.n}</h4>
                    <p className="font-body-sm text-sm text-text-muted">{m.a} • {m.r} Rescues</p>
                  </div>
                </div>
                <span className="font-display text-xl font-black text-primary">{m.v}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hot Zones */}
        <div className="bg-surface rounded-[2rem] p-xl border border-divider shadow-elevation-sm flex flex-col">
          <div className="flex items-center justify-between mb-xl">
            <h3 className="font-h3 text-h3 text-text">Activity Hot Zones</h3>
            <div className="text-text-muted bg-surface-2 p-2 rounded-lg">
              <MapPin size={24} weight="bold" />
            </div>
          </div>
          
          <div className="flex-1 w-full bg-surface-2 rounded-2xl overflow-hidden relative min-h-[300px] border border-divider flex items-center justify-center group">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <MapPin size={80} weight="thin" className="text-text-faint/30 relative z-10" />
            
            {/* Animated Indicators */}
            <div className="absolute top-1/4 left-1/3 z-20">
              <div className="w-4 h-4 bg-accent rounded-full shadow-elevation-md animate-ping absolute opacity-75" />
              <div className="w-4 h-4 bg-accent rounded-full relative shadow-lg" />
            </div>
            
            <div className="absolute top-1/2 left-2/3 z-20">
              <div className="w-6 h-6 bg-primary rounded-full shadow-elevation-md animate-ping absolute opacity-75 [animation-delay:500ms]" />
              <div className="w-6 h-6 bg-primary rounded-full relative shadow-lg" />
            </div>
            
            <div className="absolute bottom-1/3 left-1/2 z-20">
              <div className="w-3 h-3 bg-accent rounded-full shadow-elevation-md animate-ping absolute opacity-75 [animation-delay:1000ms]" />
              <div className="w-3 h-3 bg-accent rounded-full relative shadow-lg" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop" />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

