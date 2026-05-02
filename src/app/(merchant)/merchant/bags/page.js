'use client';

import Link from 'next/link';
import { ShoppingBag, Plus, Tag, Trash, PencilSimple, Circle } from '@phosphor-icons/react';
import { useMerchantBags } from '@/hooks/useMerchantBags';

export default function MerchantBagsPage() {
  const { bags, loading } = useMerchantBags();

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md pt-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Inventory Management</p>
          <h1 className="font-display text-h1 md:text-display text-text">Rescue Bags</h1>
        </div>
        <Link href="/merchant/bags/create" className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 font-label font-bold shadow-elevation-md transition-all active:scale-95 border border-primary/20">
          <Plus size={20} weight="bold" />
          Create New Bag
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md md:gap-lg">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-surface-2 animate-pulse rounded-[2.5rem] border border-divider" />)}
        </div>
      ) : bags?.length === 0 ? (
        <div className="text-center py-24 bg-surface rounded-[3rem] border border-divider shadow-elevation-sm">
          <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-lg border border-divider">
            <ShoppingBag size={48} weight="thin" className="text-text-faint" />
          </div>
          <h3 className="font-h3 text-h3 text-text mb-sm">No bags listed yet</h3>
          <p className="font-body-md text-text-muted max-w-xs mx-auto mb-xl">Create your first rescue bag to start saving food and reaching new customers.</p>
          <Link href="/merchant/bags/create" className="inline-flex bg-primary/5 hover:bg-primary/10 text-primary px-8 py-3 rounded-xl font-label font-bold transition-all border border-primary/10">
            Get Started
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md md:gap-lg">
          {bags.map((bag) => (
            <Link href={`/merchant/bags/${bag.id}/edit`} key={bag.id} className="group">
              <div className="bg-surface rounded-[2.5rem] overflow-hidden border border-divider shadow-elevation-sm hover:shadow-elevation-lg hover:border-primary/20 transition-all group-hover:-translate-y-1 h-full flex flex-col">
                <div className="w-full aspect-[4/3] bg-surface-2 overflow-hidden relative border-b border-divider">
                  {bag.image_url ? (
                    <img alt={bag.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={bag.image_url}/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={64} weight="thin" className="text-text-faint opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${
                      bag.is_active 
                        ? 'bg-success/90 text-white border-success/20' 
                        : 'bg-surface/90 text-text-muted border-divider'
                    }`}>
                      {bag.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="p-xl flex-1 flex flex-col justify-between space-y-lg">
                  <div className="space-y-md">
                    <div className="flex items-center gap-2">
                      <Tag size={16} weight="bold" className="text-primary" />
                      <span className="font-label-caps text-[10px] font-black text-primary/60 tracking-widest uppercase">{bag.category || 'Mixed Goods'}</span>
                    </div>
                    <h3 className="font-h3 text-h3 text-text group-hover:text-primary transition-colors leading-tight">{bag.title}</h3>
                  </div>

                  <div className="pt-xl border-t border-divider flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="font-label text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1">Rescue Price</span>
                      <span className="font-display text-3xl font-black text-accent tracking-tighter">Rs. {bag.rescue_price?.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <Circle size={8} weight="fill" className={bag.quantity_available > 0 ? 'text-success' : 'text-error'} />
                        <span className="font-label text-sm font-bold">{bag.quantity_available} left</span>
                      </div>
                      <div className="p-2.5 bg-surface-2 group-hover:bg-primary group-hover:text-white rounded-xl transition-all border border-divider group-hover:border-primary group-hover:shadow-elevation-md">
                        <PencilSimple size={20} weight="bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

