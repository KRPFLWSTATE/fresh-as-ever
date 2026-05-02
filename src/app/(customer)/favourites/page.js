'use client';

import Link from 'next/link';
import {
  User, 
  Heart, 
  Storefront, 
  ArrowRight, 
  MapPin,
  House
} from '@phosphor-icons/react';
import { useFavourites } from '@/hooks/useFavourites';

export default function FavouritesPage() {
  const { favourites, loading, removeFavourite } = useFavourites();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-divider flex justify-between items-center w-full px-page-margin-mobile md:px-page-margin-desktop h-16">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Fresh As Ever" className="h-8 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-primary font-display uppercase">Favourites</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/discover" className="w-10 h-10 rounded-full bg-surface-2 border border-divider flex items-center justify-center overflow-hidden shadow-elevation-sm hover:bg-surface-2 transition-colors">
            <House size={20} weight="bold" className="text-text-muted" />
          </Link>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-surface-2 border border-divider flex items-center justify-center overflow-hidden shadow-elevation-sm hover:bg-surface-2 transition-colors">
            <User size={20} weight="bold" className="text-text-muted" />
          </Link>
        </div>
      </header>

      <main className="px-page-margin-mobile md:px-page-margin-desktop py-8 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-extrabold text-text mb-8 flex items-center gap-3">
          <Heart size={32} weight="fill" className="text-primary" />
          Saved Merchants
        </h1>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-surface rounded-[32px] p-4 flex gap-4 border border-divider shadow-elevation-sm animate-pulse">
                <div className="w-24 h-24 rounded-2xl bg-surface-2 shrink-0" />
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-3 w-16 bg-surface-2 rounded-full" />
                  <div className="h-6 w-32 bg-surface-2 rounded-full" />
                  <div className="h-3 w-24 bg-surface-2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && favourites?.length === 0 && (
          <div className="text-center py-20 bg-surface rounded-[40px] border border-divider shadow-elevation-md px-6 flex flex-col items-center">
            <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mb-6 text-text-faint">
              <Heart size={48} weight="thin" />
            </div>
            <h3 className="font-h3 text-h3 text-text mb-2">No favourites yet</h3>
            <p className="font-body-md text-text-muted mb-8 max-w-xs mx-auto">Save your favourite merchants and bags for quick access.</p>
            <Link 
              href="/discover" 
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-label text-sm font-bold shadow-elevation-md hover:scale-105 active:scale-95 transition-all"
            >
              Explore Bags
              <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        )}

        {!loading && favourites?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favourites.map((fav) => (
              <Link href={`/merchant/${fav.id}`} key={fav.id} className="group">
                <div className="bg-surface rounded-[32px] p-4 flex gap-4 border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-all active:scale-[0.98] relative overflow-hidden">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-2 shrink-0 border border-divider">
                    {fav.image ? (
                      <img alt={fav.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={fav.image} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Storefront size={32} weight="bold" className="text-text-faint" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-label text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                      <MapPin size={12} weight="fill" className="text-primary" />
                      {fav.distance}
                    </div>
                    <h3 className="font-h3 text-h3 text-text line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">{fav.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg font-label text-[10px] font-bold uppercase tracking-wider ${
                        fav.bagsAvailable > 0 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-error/10 text-error'
                      }`}>
                        {fav.bagsAvailable > 0 ? `${fav.bagsAvailable} bags available` : 'Sold out'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); removeFavourite(fav.id); }} 
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-divider flex items-center justify-center text-error shadow-elevation-sm active:scale-90 transition-all z-10"
                  >
                    <Heart size={20} weight="fill" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

