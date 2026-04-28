'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Clock, MapPin, Package, Warning } from '@phosphor-icons/react';
import styles from './page.module.css';
import Link from 'next/link';

export default function BagDetailPage({ params }) {
  const router = useRouter();
  const [bag, setBag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const fetchBagDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rescue_bags')
        .select(`
          *,
          outlet:outlets (
            id, name, address, landmark, location, average_rating, total_reviews,
            merchant:merchants (
              business_name
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setBag(data);
    } catch (err) {
      console.error('Error fetching bag details:', err);
      setError('Bag not found or no longer available.');
    } finally {
      setLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchBagDetails();

    const channel = supabase
      .channel(`bag-${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rescue_bags', filter: `id=eq.${params.id}` },
        (payload) => {
          setBag(prev => prev ? { ...prev, quantity_remaining: payload.new.quantity_remaining, rescue_price: payload.new.rescue_price } : null);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.id, fetchBagDetails, supabase]);

  const handleReserve = () => {
    router.push(`/checkout?bag_id=${bag.id}`);
  };

  const getCategory = (title) => {
    const t = title.toLowerCase();
    if (['bread', 'cake', 'croissant', 'pastry', 'bun', 'donut', 'muffin'].some(k => t.includes(k))) return 'Bakery';
    if (['vegan', 'organic', 'green', 'plant'].some(k => t.includes(k))) return 'Eco';
    if (['premium', 'gold', 'deluxe', 'chef'].some(k => t.includes(k))) return 'Gourmet';
    return 'Cuisine';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
        <div className={styles.skeletonBody}>
          <div className={styles.skeleton} style={{ height: 24, width: '75%', borderRadius: 6 }} />
          <div className={styles.skeleton} style={{ height: 16, width: '50%', borderRadius: 6 }} />
          <div className={styles.skeleton} style={{ height: 80, borderRadius: 12 }} />
          <div className={styles.skeleton} style={{ height: 80, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (error || !bag) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <Warning size={48} />
          </span>
          <h3 className={styles.emptyTitle}>Bag unavailable</h3>
          <p className={styles.emptyText}>{error || 'This bag is no longer available.'}</p>
          <Link href="/discover" className={styles.reserveBtn} style={{ marginTop: 8 }}>
            Browse other bags
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = bag.quantity_remaining <= 0;
  const isUrgent = bag.quantity_remaining > 0 && bag.quantity_remaining <= 3;
  const category = getCategory(bag.title);
  const pickupStart = bag.pickup_start ? new Date(bag.pickup_start) : null;
  const pickupEnd = bag.pickup_end ? new Date(bag.pickup_end) : null;
  const timeRange = pickupStart && pickupEnd
    ? `${pickupStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${pickupEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'See details';

  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <img
          src={bag.image_url || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'}
          alt={bag.title}
          className={styles.heroImage}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className={styles.heroOverlay} />

        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>

        {isUrgent && (
          <div className={styles.urgencyBadge}>Only {bag.quantity_remaining} left</div>
        )}
        {isSoldOut && (
          <div className={styles.soldOutBadge}>Sold Out</div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <div className={styles.titleText}>
            <span className={styles.bagCategory}>{category}</span>
            <h1 className={styles.bagTitle}>{bag.title}</h1>
          </div>
          <div className={styles.priceCol}>
            <span className={styles.priceCurrent}>Rs. {bag.rescue_price}</span>
            {bag.retail_value_estimate && (
              <span className={styles.priceOriginal}>Rs. {bag.retail_value_estimate}</span>
            )}
          </div>
        </div>

        <p className={styles.merchantLine}>
          Sold by <strong>{bag.outlet?.merchant?.business_name || bag.outlet?.name || 'Local Merchant'}</strong>
        </p>

        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <span className={styles.infoCardIcon}>
              <Clock size={20} />
            </span>
            <div className={styles.infoCardContent}>
              <span className={styles.infoCardLabel}>Collection Time</span>
              <span className={styles.infoCardValue}>Today</span>
              <span className={styles.infoCardSub}>{timeRange}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.infoCardIcon}>
              <MapPin size={20} />
            </span>
            <div className={styles.infoCardContent}>
              <span className={styles.infoCardLabel}>Location</span>
              <span className={styles.infoCardValue}>{bag.outlet?.name || 'View on map'}</span>
              <span className={styles.infoCardSub}>{bag.outlet?.address || ''}</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className={styles.mapCard}>
          {bag.outlet?.location ? (
            <MapPin size={24} style={{ color: 'var(--color-text-faint)' }} />
          ) : (
            <div className={styles.mapEmpty}>
              <MapPin size={24} />
              <span className={styles.mapEmptyText}>Location available in app</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className={styles.sectionBlock}>
          <h3 className={styles.sectionTitle}>What's inside</h3>
          <p className={styles.sectionBody}>
            {bag.description || 'A surprise bag of perfectly good surplus food from the day\'s operations. Contents vary daily based on what\'s available at closing time. Every bag is a delicious rescue.'}
          </p>
        </div>

        {/* Allergens */}
        {bag.allergens && bag.allergens.length > 0 && (
          <div className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Allergens & Dietary</h3>
            <div className={styles.allergenTags}>
              {bag.allergens.map((allergen, idx) => (
                <span key={idx} className={styles.allergenTag}>{allergen}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <div className={styles.priceInfo}>
            <span className={styles.priceInfoLabel}>Total</span>
            <span className={styles.priceInfoValue}>Rs. {bag.rescue_price}</span>
          </div>
          <button
            onClick={handleReserve}
            className={styles.reserveBtn}
            disabled={isSoldOut}
          >
            {isSoldOut ? 'Sold Out' : 'Reserve Now'}
          </button>
        </div>
      </div>
    </div>
  );
}