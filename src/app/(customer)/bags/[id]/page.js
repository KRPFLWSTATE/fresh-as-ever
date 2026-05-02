'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShareNetwork, 
  Storefront, 
  Clock, 
  MapPin, 
  Leaf, 
  Flame, 
  Lightning,
  SmileySad,
  NavigationArrow,
  Info,
  Heart
} from '@phosphor-icons/react';
import { useBagDetail } from '@/hooks/useBagDetail';
import { useFavourites } from '@/hooks/useFavourites';
import { parseOutletLatLng } from '@/lib/geo/parseOutletLatLng';

const OutletLeafletMap = dynamic(
  () => import('@/components/maps/OutletLeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] h-56 w-full animate-pulse rounded-2xl border border-divider bg-surface-2 md:h-64" />
    ),
  }
);

export default function BagDetailPage() {
  const resolvedParams = useParams();
  const router = useRouter();
  const { bag, loading, handleReserve } = useBagDetail(resolvedParams.id);
  const { isSaved, toggleFavourite } = useFavourites();
  const [showAllergens, setShowAllergens] = useState(false);
  const [favouriteBusy, setFavouriteBusy] = useState(false);
  const pickupStart = bag?.pickup_start;
  const pickupEnd = bag?.pickup_end;
  const pickupWindow = useMemo(() => {
    if (!pickupStart || !pickupEnd) return 'Today, 18:00 - 20:00';
    const start = new Date(pickupStart);
    const end = new Date(pickupEnd);
    const weekday = start.toLocaleDateString('en-LK', { weekday: 'short' });
    const day = start.toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
    const startTime = start.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
    return `${weekday}, ${day} • ${startTime} - ${endTime}`;
  }, [pickupStart, pickupEnd]);
  const outletId = bag?.outlet?.id;
  const outletSaved = outletId ? isSaved(outletId) : false;

  const handleSaveMerchant = async () => {
    if (!outletId || favouriteBusy) return;
    try {
      setFavouriteBusy(true);
      await toggleFavourite(outletId);
    } catch (err) {
      if (String(err?.message || err) === 'SIGN_IN_REQUIRED') {
        router.push('/login');
      }
    } finally {
      setFavouriteBusy(false);
    }
  };

  const outletCoords = useMemo(
    () => parseOutletLatLng(bag?.outlet?.location),
    [bag?.outlet?.location]
  );

  const mapDirectionsUrl = useMemo(() => {
    if (outletCoords) {
      return `https://www.google.com/maps/dir/?api=1&destination=${outletCoords.lat},${outletCoords.lng}&travelmode=driving`;
    }
    const destination = bag?.outlet?.address || bag?.outlet?.name || 'Colombo, Sri Lanka';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }, [bag?.outlet?.address, bag?.outlet?.name, outletCoords]);
  const { allergens, dietary } = useMemo(() => {
    const text = `${bag?.title || ''} ${bag?.description || ''}`.toLowerCase();
    const detectedAllergens = [];
    if (/(nut|almond|cashew|peanut|pistachio)/.test(text)) detectedAllergens.push('Nuts');
    if (/(milk|cheese|cream|butter|yogurt)/.test(text)) detectedAllergens.push('Dairy');
    if (/(egg|omelette|mayo)/.test(text)) detectedAllergens.push('Egg');
    if (/(wheat|bread|croissant|pastry|bun|cake)/.test(text)) detectedAllergens.push('Gluten');
    const detectedDietary = [];
    if (/(vegan|plant)/.test(text)) detectedDietary.push('Vegan-friendly options may be included');
    if (/(vegetarian|veggie)/.test(text)) detectedDietary.push('Vegetarian-friendly options may be included');
    if (detectedDietary.length === 0) detectedDietary.push('Contents vary daily. Ask merchant for full ingredient list at pickup.');
    return {
      allergens: detectedAllergens.length > 0 ? detectedAllergens : ['Allergen details vary by day'],
      dietary: detectedDietary,
    };
  }, [bag?.title, bag?.description]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen pb-24">
        <div className="w-full h-72 md:h-96 skeleton-shimmer" />
        <div className="px-page-margin-mobile md:px-page-margin-desktop py-lg max-w-3xl mx-auto space-y-xl -mt-10 relative z-10">
          <div className="bg-surface p-md rounded-2xl shadow-elevation-md space-y-md">
            <div className="h-4 w-24 skeleton-shimmer rounded-full" />
            <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
            <div className="h-4 w-48 skeleton-shimmer rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!bag) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-xl">
        <div className="text-center space-y-md max-w-xs">
          <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mx-auto text-text-faint border border-divider">
            <SmileySad size={48} weight="thin" />
          </div>
          <h2 className="font-h2 text-h2 text-text">Rescue Bag Not Found</h2>
          <p className="font-body-md text-text-muted">This bag might have already been rescued or is no longer available.</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white w-full py-4 rounded-xl font-label font-bold shadow-elevation-md active:scale-95 transition-all mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-text font-body-md antialiased pb-32">
      {/* Hero Header */}
      <div className="relative w-full h-80 md:h-[500px] overflow-hidden">
        <img
          alt={bag.title}
          className="w-full h-full object-cover"
          src={bag.image_url || 'https://images.unsplash.com/photo-1555503465-4356405bc141?auto=format&fit=crop&q=80&w=1200'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Navigation Actions */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-xl rounded-full text-white shadow-elevation-lg active:scale-90 transition-all border border-white/20"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveMerchant}
              disabled={!outletId || favouriteBusy}
              aria-label={outletSaved ? 'Remove from saved merchants' : 'Save merchant'}
              className={`w-11 h-11 flex items-center justify-center backdrop-blur-xl rounded-full text-white shadow-elevation-lg active:scale-90 transition-all border border-white/20 ${
                outletSaved ? 'bg-primary border-primary/40' : 'bg-white/10'
              } disabled:opacity-50`}
            >
              <Heart size={24} weight={outletSaved ? 'fill' : 'bold'} />
            </button>
            <button
              type="button"
              className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-xl rounded-full text-white shadow-elevation-lg active:scale-90 transition-all border border-white/20"
            >
              <ShareNetwork size={24} weight="bold" />
            </button>
          </div>
        </div>

        {/* Floating Title Info (Internal to Hero) */}
        <div className="absolute bottom-16 left-0 w-full px-page-margin-mobile md:px-page-margin-desktop text-white space-y-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-label-caps text-[10px] font-bold tracking-widest uppercase border border-white/20">
            {bag.category || 'Surprise Bag'}
          </span>
          <h1 className="font-display text-display text-white">{bag.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-page-margin-mobile md:px-page-margin-desktop max-w-3xl mx-auto -mt-10 relative z-10 space-y-lg pb-12">
        {/* Primary Info Card */}
        <section className="bg-surface rounded-2xl p-xl shadow-elevation-lg flex flex-col gap-xl border border-divider">
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary-highlight text-primary px-3 py-1 rounded-full font-label-caps text-[10px] font-bold tracking-widest uppercase border border-primary/10">
              {bag.category || 'Surprise Bag'}
            </span>
            {bag.quantity_remaining <= 3 && (
              <span className="bg-accent-highlight text-accent px-3 py-1 rounded-full font-label-caps text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 border border-accent/10">
                <Flame size={14} weight="fill" className="animate-pulse" />
                Only {bag.quantity_remaining} Left
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-h1 text-text">{bag.title}</h1>
            <div className="flex items-center gap-2 text-text font-semibold">
              <Storefront size={20} weight="fill" className="text-primary" />
              <span>{bag.outlet?.merchant?.business_name || bag.outlet?.name}</span>
            </div>
          </div>

          <div className="h-px bg-divider w-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center text-primary shrink-0 border border-divider">
                <Clock size={24} weight="bold" />
              </div>
              <div>
                <p className="font-label text-xs text-text-faint uppercase font-bold tracking-wider">Pickup Window</p>
                <p className="font-body-md text-text font-semibold">{pickupWindow}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center text-primary shrink-0 border border-divider">
                <MapPin size={24} weight="bold" />
              </div>
              <div>
                <p className="font-label text-xs text-text-faint uppercase font-bold tracking-wider">Location</p>
                <p className="font-body-md text-text font-semibold line-clamp-1">{bag.outlet?.address || 'Colombo, Sri Lanka'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Details */}
        <section className="bg-surface rounded-2xl p-xl shadow-elevation-md space-y-md border border-divider">
          <h2 className="font-h2 text-h2 text-text">What&apos;s inside?</h2>
          <p className="font-body-lg text-text-muted leading-relaxed">
            {bag.description || 'A delicious surprise mix of unsold daily items from this store. This could include a variety of pastries, meals, or fresh products depending on what is available at the end of the day.'}
          </p>
          <div className="bg-primary/5 p-4 rounded-2xl space-y-sm border border-primary/10">
            <div className="flex items-center gap-3 text-primary">
              <Leaf size={24} weight="fill" />
              <span className="font-label text-sm font-bold">Saving this bag rescues approx. 1.2kg of CO2</span>
            </div>
          </div>
        </section>

        {/* Allergen & Dietary */}
        <section className="bg-surface rounded-2xl p-xl shadow-elevation-md space-y-md border border-divider">
          <div className="flex items-center justify-between">
            <h2 className="font-h2 text-h2 text-text">Allergen & Dietary Information</h2>
            <button
              onClick={() => setShowAllergens(true)}
              className="inline-flex items-center gap-1.5 text-primary font-label text-sm font-bold hover:underline"
            >
              <Info size={16} weight="bold" />
              Details
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergens.map((item) => (
              <span key={item} className="px-3 py-1.5 rounded-full bg-surface-2 border border-divider font-label text-xs text-text-muted">
                {item}
              </span>
            ))}
          </div>
          <p className="font-body-sm text-text-muted">
            Bag contents are surprise-based and may change daily. If you have severe allergies, confirm ingredients with the merchant before consumption.
          </p>
        </section>

        {/* Collection Point */}
        <section className="bg-surface rounded-2xl p-xl shadow-elevation-md space-y-md border border-divider">
          <div className="flex justify-between items-center">
            <h2 className="font-h2 text-h2 text-text">Collection Point</h2>
            <a
              href={mapDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary font-label text-sm font-bold hover:underline"
            >
              <NavigationArrow size={18} weight="bold" />
              Get Directions
            </a>
          </div>
          <p className="font-body-md text-text-muted">{bag.outlet?.address || 'Colombo, Sri Lanka'}</p>
          <OutletLeafletMap
            lat={outletCoords?.lat}
            lng={outletCoords?.lng}
            outletName={bag.outlet?.name}
            address={bag.outlet?.address}
          />
        </section>
      </main>

      {showAllergens && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAllergens(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-xl border-t border-divider shadow-elevation-lg">
            <div className="max-w-3xl mx-auto space-y-md">
              <div className="flex items-center justify-between">
                <h3 className="font-h3 text-h3 text-text">Allergen & Dietary Details</h3>
                <button className="text-primary font-label font-bold" onClick={() => setShowAllergens(false)}>
                  Close
                </button>
              </div>
              <div className="space-y-sm">
                <p className="font-label text-xs uppercase tracking-wider text-text-faint">Possible Allergens</p>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((item) => (
                    <span key={`detail-${item}`} className="px-3 py-1.5 rounded-full bg-accent-highlight text-accent font-label text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-sm">
                <p className="font-label text-xs uppercase tracking-wider text-text-faint">Dietary Notes</p>
                <ul className="space-y-1">
                  {dietary.map((item) => (
                    <li key={item} className="font-body-sm text-text-muted">- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-xl border-t border-divider p-xl shadow-elevation-lg z-50 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-xl">
          <div className="flex flex-col">
            {bag.original_price && (
              <span className="font-price-original text-text-faint line-through text-sm font-medium">LKR {bag.original_price?.toLocaleString()}</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-accent uppercase">LKR</span>
              <span className="font-display text-3xl text-accent font-extrabold">{bag.rescue_price?.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={handleReserve}
            disabled={bag.quantity_remaining <= 0}
            className="flex-1 max-w-[260px] h-14 bg-primary hover:bg-primary-hover disabled:bg-divider disabled:cursor-not-allowed text-white font-label text-lg font-bold rounded-2xl shadow-elevation-lg active:scale-[0.97] transition-all flex items-center justify-center gap-3"
          >
            {bag.quantity_remaining > 0 && <Lightning size={24} weight="fill" />}
            {bag.quantity_remaining <= 0 ? 'Sold Out' : 'Reserve Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}