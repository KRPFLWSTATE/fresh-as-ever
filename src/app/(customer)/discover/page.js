'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  List, 
  MapPin, 
  CaretDown, 
  MagnifyingGlass, 
  Clock, 
  MagnifyingGlassPlus,
  Funnel,
  X,
  House,
  Receipt,
  Heart,
  User,
  Storefront,
  SignIn,
  SignOut
} from '@phosphor-icons/react';
import { useDiscoverBags } from '@/hooks/useDiscoverBags';
import { useAuth } from '@/hooks/useAuth';
import { formatPickupRangeLabel, formatDistanceAwayLabel } from '@/lib/utils';

const DiscoverLeafletMap = dynamic(
  () => import('@/components/maps/DiscoverLeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 w-full animate-pulse rounded-2xl border border-divider bg-surface-2" />
    ),
  }
);

const categoryList = ['All', 'Bakery', 'Café', 'Restaurant', 'Supermarket', 'Mixed Meals'];

const menuItems = [
  { href: '/discover', icon: House, label: 'Home' },
  { href: '/orders', icon: Receipt, label: 'My Orders' },
  { href: '/favourites', icon: Heart, label: 'Favourites' },
  { href: '/profile', icon: User, label: 'Profile' },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const {
    bags,
    loading,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    locationLabel,
    setLocationByCoords,
    location,
    locStatus,
    positionAccuracyM,
  } = useDiscoverBags();
  const { user, logout } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const dashboardHref =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'merchant_staff' || role === 'merchant'
        ? '/merchant/dashboard'
        : '/discover';
  const dashboardLabel =
    role === 'admin'
      ? 'Admin Portal'
      : role === 'merchant_staff' || role === 'merchant'
        ? 'Merchant Portal'
        : 'Discover Home';
  const roleBadgeLabel = role === 'admin' ? 'Admin Session' : role === 'merchant_staff' ? 'Merchant Session' : user ? 'Customer Session' : 'Guest Session';
  const topLocationOptions = useMemo(() => ([
    { label: 'Colombo 07, Sri Lanka', lat: 6.9147, lng: 79.8655 },
    { label: 'Colombo 03, Sri Lanka', lat: 6.9022, lng: 79.8534 },
    { label: 'Colombo 05, Sri Lanka', lat: 6.8953, lng: 79.8588 },
    { label: 'Nugegoda, Sri Lanka', lat: 6.8649, lng: 79.8997 },
  ]), []);
  const forcedState = searchParams?.get('state');
  const hasForcedEmptyState = ['empty-search', 'no-results', 'no-bags-nearby', 'sold-out'].includes(forcedState);
  const visibleBags = hasForcedEmptyState ? [] : bags;
  const emptyStateTitleByType = {
    'empty-search': 'Start searching for rescue bags',
    'no-results': 'No results for this filter',
    'no-bags-nearby': 'No bags nearby right now',
    'sold-out': 'Everything is sold out for now',
  };
  const emptyStateBodyByType = {
    'empty-search': 'Try a food type, merchant name, or neighborhood to discover today\'s offers.',
    'no-results': 'Try a different category or clear filters to see more results.',
    'no-bags-nearby': 'Check again later. Merchants publish new rescue bags throughout the day.',
    'sold-out': 'Great demand today. Check back soon for newly listed bags.',
  };

  useEffect(() => {
    if (!locationQuery.trim()) {
      queueMicrotask(() => {
        setLocationResults([]);
      });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearchingLocation(true);
        const response = await fetch(`/api/location/search?q=${encodeURIComponent(locationQuery.trim())}`);
        const data = await response.json();
        setLocationResults(data?.results || []);
      } catch (_error) {
        setLocationResults([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [locationQuery]);

  const selectLocation = async (location) => {
    setLocationError('');
    setLocationMenuOpen(false);
    setLocationQuery('');
    setLocationResults([]);
    await setLocationByCoords({
      lat: location.lat,
      lng: location.lng,
      label: location.label,
      status: 'manual',
    });
  };

  const useCurrentLocation = async () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Current location is not available on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let label = 'Current location';
        try {
          const response = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
          const data = await response.json();
          label = data?.label || label;
        } catch (_error) {
          // Keep default label on reverse geocode failures
        }
        await setLocationByCoords({
          lat,
          lng,
          label,
          status: 'granted',
          accuracyM: position.coords.accuracy,
        });
        setLocationMenuOpen(false);
      },
      () => {
        setLocationError('Unable to get your current location. Check permissions and try again.');
      },
      { enableHighAccuracy: true, timeout: 22000, maximumAge: 0 }
    );
  };

  return (
    <div className="min-h-screen bg-background text-text font-body-md antialiased pb-24">
      {/* TopAppBar - Fixed with proper height and blur */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-divider flex justify-between items-center h-16 px-page-margin-mobile md:px-page-margin-desktop w-full fixed top-0 z-50">
        <div className="flex items-center gap-sm">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-surface-2 rounded-full transition-all duration-120 active:scale-90 text-primary"
            aria-label="Open menu"
          >
            <List size={24} weight="bold" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Fresh As Ever" className="h-8 w-auto object-contain" />
            <span className="font-display text-lg tracking-tight font-extrabold text-primary hidden sm:inline-block">Fresh As Ever</span>
          </Link>
        </div>
        
        {/* Location Picker */}
        <button
          type="button"
          onClick={() => setLocationMenuOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-text hover:bg-surface-2 px-3 py-1.5 rounded-full transition-all duration-120 active:scale-95 cursor-pointer border border-divider/50 bg-surface/50 shadow-sm"
        >
          <MapPin size={18} weight="fill" className="text-primary" />
          <span className="font-label text-sm font-semibold whitespace-nowrap">{locationLabel}</span>
          <CaretDown size={14} weight="bold" className="text-text-muted" />
        </button>
      </header>
      {locationMenuOpen ? (
        <div className="fixed top-20 right-4 z-50 bg-surface border border-divider rounded-xl shadow-elevation-md p-3 min-w-72 w-[min(92vw,420px)] space-y-3">
          <p className="font-label text-xs uppercase tracking-wider text-text-faint">Top locations</p>
          <div className="grid grid-cols-2 gap-2">
            {topLocationOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => selectLocation(option)}
                className="text-left px-3 py-2 rounded-lg bg-surface-2 hover:bg-primary/10 font-label text-xs text-text"
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="font-label text-xs uppercase tracking-wider text-text-faint">Search address</p>
            <input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="Type an area or address"
              className="w-full bg-surface-2 border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            {isSearchingLocation ? <p className="font-body-sm text-text-muted">Searching...</p> : null}
            {locationResults.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border border-divider rounded-lg">
                {locationResults.map((option) => (
                  <button
                    key={`${option.label}-${option.lat}-${option.lng}`}
                    type="button"
                    onClick={() => selectLocation(option)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 border-b border-divider last:border-b-0"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            className="w-full px-3 py-2 rounded-lg bg-primary text-white font-label text-sm font-bold"
          >
            Use Current Location
          </button>

          {locationError ? <p className="font-body-sm text-error">{locationError}</p> : null}

          <button
            type="button"
            onClick={() => {
              setLocationMenuOpen(false);
              setLocationQuery('');
              setLocationResults([]);
              setLocationError('');
            }}
            className="w-full px-3 py-2 rounded-lg border border-divider font-label text-sm text-text-muted hover:bg-surface-2"
          >
            Close
          </button>
        </div>
      ) : null}
      {locationMenuOpen ? (
        <button
          type="button"
          aria-label="Close location menu backdrop"
          onClick={() => {
            setLocationMenuOpen(false);
            setLocationQuery('');
            setLocationResults([]);
            setLocationError('');
          }}
          className="fixed inset-0 z-40 bg-black/10"
        />
      ) : null}

      {/* Main Content Area - Correctly offset from fixed header */}
      <main className="pt-24 px-page-margin-mobile md:px-page-margin-desktop max-w-5xl mx-auto">
        <div className="flex flex-col gap-lg">
          <div className="w-fit px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-label text-xs font-bold uppercase tracking-wider">
            {roleBadgeLabel}
          </div>
          {/* Hero / Search Section */}
          <div className="space-y-md">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted transition-colors group-focus-within:text-primary">
                <MagnifyingGlass size={20} weight="bold" />
              </div>
              <input
                className="w-full bg-surface border border-divider text-text font-body-md py-3.5 pl-12 pr-4 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-elevation-sm hover:border-text-faint"
                placeholder="Search for fresh rescue bags..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Chips - Scrollable with fade */}
            <div className="relative">
              <div className="flex overflow-x-auto pb-2 -mx-page-margin-mobile px-page-margin-mobile md:mx-0 md:px-0 gap-sm no-scrollbar scroll-smooth">
                {categoryList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-label text-sm font-semibold transition-all duration-120 active:scale-95 border ${
                      activeCategory === cat
                        ? 'bg-primary text-white border-primary shadow-elevation-md'
                        : 'bg-surface border-divider text-text-muted hover:border-text-faint hover:text-text'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map centers on the same coordinates as search (GPS / manual); no second getCurrentPosition. */}
          {!hasForcedEmptyState ? (
            <div className="space-y-2">
              <p className="font-label text-xs uppercase tracking-wider text-text-faint">Near you</p>
              {locStatus === 'granted' &&
              positionAccuracyM != null &&
              positionAccuracyM >= 800 ? (
                <p className="max-w-2xl rounded-xl border border-divider/80 bg-surface-2/80 px-3 py-2 font-body-sm text-text-muted">
                  This device reported about{' '}
                  {positionAccuracyM >= 1000
                    ? `${Math.round(positionAccuracyM / 1000)} km`
                    : `${Math.round(positionAccuracyM)} m`}{' '}
                  location accuracy — common on Wi‑Fi or without GPS. For a pin you trust, use{' '}
                  <span className="font-semibold text-text">Search address</span> or a quick-pick area
                  in the location menu.
                </p>
              ) : null}
              <DiscoverLeafletMap
                center={location}
                zoom={locStatus === 'granted' ? 14 : 13}
                bags={visibleBags}
              />
            </div>
          ) : null}

          {/* Rescue Bag Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl pb-12">
            {loading && !hasForcedEmptyState ? (
              // Enhanced Skeletons
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-divider shadow-elevation-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="w-full aspect-video skeleton-shimmer" />
                  <div className="p-xl space-y-4 flex-1">
                    <div className="h-4 w-24 skeleton-shimmer rounded-full" />
                    <div className="h-7 w-full skeleton-shimmer rounded-lg" />
                    <div className="h-4 w-32 skeleton-shimmer rounded-full" />
                    <div className="flex justify-between items-end mt-auto pt-4">
                      <div className="space-y-2">
                        <div className="h-4 w-16 skeleton-shimmer rounded-full" />
                        <div className="h-8 w-28 skeleton-shimmer rounded-lg" />
                      </div>
                      <div className="h-11 w-28 skeleton-shimmer rounded-xl" />
                    </div>
                  </div>
                </div>
              ))
            ) : visibleBags.length > 0 ? (
              visibleBags.map((bag) => {
                const distanceLabel = formatDistanceAwayLabel(
                  location.lat,
                  location.lng,
                  bag.outlet_lat,
                  bag.outlet_lng
                );
                return (
                <Link href={`/bags/${bag.id}`} key={bag.id} className="block group">
                  <article className="bg-surface rounded-2xl border border-divider shadow-elevation-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-elevation-lg hover:border-primary/20 group-hover:-translate-y-1 h-full">
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-2">
                      <img
                        alt={bag.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={bag.image_url || 'https://images.unsplash.com/photo-1555503465-4356405bc141?auto=format&fit=crop&q=80&w=800'}
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/90 text-primary shadow-sm backdrop-blur-md">
                          {bag.category || 'Surprise Bag'}
                        </span>
                      </div>
                      {bag.quantity_remaining <= 3 && (
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-accent text-white shadow-lg animate-pulse">
                            Only {bag.quantity_remaining} left
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-xl flex flex-col flex-1 gap-sm">
                      <div className="space-y-1">
                        <p className="font-label-caps text-xs text-text-faint">{bag.merchant_name || 'Local Merchant'}</p>
                        <h3 className="font-h3 text-h3 text-text line-clamp-1 group-hover:text-primary transition-colors">{bag.title}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-text-muted font-body-sm py-1">
                        <Clock size={18} weight="bold" className="text-primary/60" />
                        <span className="line-clamp-2">
                          Pickup:{' '}
                          {formatPickupRangeLabel(bag.pickup_start, bag.pickup_end) ||
                            `${bag.pickup_start || '18:00'} – ${bag.pickup_end || '20:00'}`}
                        </span>
                      </div>

                      {distanceLabel ? (
                        <div className="flex items-center gap-2 text-text-muted font-body-sm">
                          <MapPin size={18} weight="bold" className="text-primary/60 shrink-0" />
                          <span>{distanceLabel}</span>
                        </div>
                      ) : null}

                      <div className="flex justify-between items-end mt-auto pt-4 border-t border-divider/50">
                        <div className="flex flex-col">
                          <span className="font-price-original text-text-faint text-sm line-through">LKR {bag.original_price?.toLocaleString()}</span>
                          <span className="font-price text-2xl text-accent">LKR {bag.rescue_price?.toLocaleString()}</span>
                        </div>
                        <button className="bg-primary hover:bg-primary-hover active:scale-95 text-white transition-all duration-200 font-label font-bold px-8 py-3 rounded-xl shadow-elevation-md">
                          Reserve
                        </button>
                      </div>
                    </div>
                  </article>
                </Link>
                );
              })
            ) : (
              /* Empty State */
              <div className="col-span-full text-center py-24 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center mb-6 text-text-faint border border-divider">
                  <MagnifyingGlassPlus size={48} weight="thin" />
                </div>
                <h3 className="font-h3 text-h3 text-text mb-2">{emptyStateTitleByType[forcedState] || 'No Bags Found'}</h3>
                <p className="font-body-md text-text-muted max-w-sm mx-auto">
                  {emptyStateBodyByType[forcedState] || 'We couldn\'t find any rescue bags matching your search. Try a different category or broader term!'}
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="mt-8 text-primary font-label font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-surface z-50 animate-in slide-in-from-left duration-300 shadow-elevation-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-xl border-b border-divider">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src="/logo.png" alt="Fresh As Ever" className="h-8 w-auto" />
                  <span className="font-display text-lg tracking-tight font-extrabold text-primary">Fresh As Ever</span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-surface-2 rounded-full transition-colors"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>

              {/* Main Navigation */}
              <nav className="flex-1 overflow-y-auto py-md">
                <div className="px-3 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-200 text-text-muted hover:bg-surface-2 hover:text-text"
                      >
                        <Icon size={24} weight="bold" />
                        <span className="font-label text-sm font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Bottom Section */}
              <div className="border-t border-divider p-md space-y-1">
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-200 text-text-muted hover:bg-surface-2 hover:text-text"
                >
                  <Storefront size={24} weight="bold" />
                  <span className="font-label text-sm font-semibold">{dashboardLabel}</span>
                </Link>
                {user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm('Are you sure you want to sign out?');
                      if (!confirmed) return;
                      setMobileMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-200 text-error hover:bg-error/5"
                  >
                    <SignOut size={24} weight="bold" />
                    <span className="font-label text-sm font-semibold">Sign Out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-200 text-text-muted hover:bg-surface-2 hover:text-text"
                  >
                    <SignIn size={24} weight="bold" />
                    <span className="font-label text-sm font-semibold">Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DiscoverContent />
    </Suspense>
  );
}