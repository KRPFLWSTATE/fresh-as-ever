'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MagnifyingGlass, MapPin, ArrowClockwise, Package, ForkKnife, Leaf, Star, ArrowRight } from '@phosphor-icons/react';
import styles from './page.module.css';
import Link from 'next/link';

export default function DiscoverPage() {
  const [bags, setBags] = useState([]);
  const [filteredBags, setFilteredBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 });
  const [locStatus, setLocStatus] = useState('pending');

  const supabase = useMemo(() => createClient(), []);

  const fetchNearbyBags = useCallback(async (lat, lng) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('nearby_bags', {
        user_lat: lat,
        user_lng: lng,
        radius_km: 10
      });

      if (error) throw error;
      setBags(data || []);
      setFilteredBags(data || []);
    } catch (err) {
      console.error('Error fetching bags:', err);
      setError('Could not load bags. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Category config with icons
  const categories = [
    { name: 'All', icon: null },
    { name: 'Bakery', icon: ForkKnife },
    { name: 'Cuisine', icon: Package },
    { name: 'Gourmet', icon: Star },
    { name: 'Eco', icon: Leaf },
  ];

  // Filter logic
  useEffect(() => {
    let result = bags;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.outlet_name?.toLowerCase().includes(q) ||
        b.merchant_name?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'All') {
      const catHash = {
        'Bakery': ['bread', 'cake', 'croissant', 'pastry', 'bun', 'donut', 'muffin'],
        'Eco': ['vegan', 'organic', 'green', 'plant'],
        'Gourmet': ['premium', 'gold', 'deluxe', 'chef'],
        'Cuisine': ['rice', 'curry', 'kottu', 'hoppers', 'string']
      };
      const keywords = catHash[activeCategory] || [];
      if (keywords.length > 0) {
        result = result.filter(b =>
          keywords.some(k => b.title.toLowerCase().includes(k))
        );
      }
    }

    setFilteredBags(result);
  }, [searchQuery, activeCategory, bags]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocStatus('granted');
          fetchNearbyBags(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setLocStatus('denied');
          fetchNearbyBags(6.9271, 79.8612);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocStatus('denied');
      fetchNearbyBags(6.9271, 79.8612);
    }
  }, [fetchNearbyBags]);

  const handleRefresh = () => {
    fetchNearbyBags(location.lat, location.lng);
  };

  const handleLocationTrigger = () => {
    setLocStatus('pending');
  };

  const getCategoryPill = (bagTitle) => {
    const title = bagTitle.toLowerCase();
    if (['bread', 'cake', 'croissant', 'pastry', 'bun', 'donut', 'muffin'].some(k => title.includes(k))) return 'Bakery';
    if (['vegan', 'organic', 'green', 'plant'].some(k => title.includes(k))) return 'Eco';
    if (['premium', 'gold', 'deluxe', 'chef'].some(k => title.includes(k))) return 'Gourmet';
    return 'Cuisine';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button
          className={styles.locationTrigger}
          onClick={handleLocationTrigger}
          title="Change location"
        >
          <span className={styles.locationIconWrap}>
            <MapPin size={18} weight="fill" />
          </span>
          <span className={styles.locationTextCol}>
            <span className={styles.locationLabel}>Delivering to</span>
            <span className={styles.locationValue}>
              {locStatus === 'denied' ? 'Colombo' : locStatus === 'pending' ? 'Detecting...' : 'Your Location'}
            </span>
          </span>
        </button>
        <button className={styles.avatarBtn} aria-label="Profile">
          K
        </button>
      </header>

      {/* Hero */}
      <section className={styles.heroSection}>
        <h1 className={styles.pageTitle}>
          Fresh Food, <span className={styles.pageTitleAccent}>Rescued.</span>
        </h1>
        <p className={styles.pageSubtitle}>Save money. Reduce waste. Eat well.</p>

        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>
            <MagnifyingGlass size={18} />
          </span>
          <input
            type="text"
            placeholder="Search cafes, bakeries, markets..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Filters */}
      <section className={styles.filterSection}>
        <div className={styles.filterChips}>
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                className={`${styles.chip} ${activeCategory === cat.name ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                {Icon && <Icon size={14} style={{ marginRight: 4 }} />}
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Feed */}
      <section className={styles.feedSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Now</h2>
          <button className={styles.refreshBtn} onClick={handleRefresh} title="Refresh">
            <ArrowClockwise size={14} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className={styles.bagsList}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
                <div className={styles.skeletonBody}>
                  <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%' }} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '80%' }} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Package size={48} />
            </span>
            <h3 className={styles.emptyTitle}>Something went wrong</h3>
            <p className={styles.emptyText}>{error}</p>
            <button className={styles.emptyAction} onClick={handleRefresh}>
              Try again
            </button>
          </div>
        ) : filteredBags.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Package size={48} />
            </span>
            <h3 className={styles.emptyTitle}>No bags available</h3>
            <p className={styles.emptyText}>
              {searchQuery
                ? `Nothing found for "${searchQuery}". Try a different search.`
                : "No rescue bags nearby right now. Check back during peak hours."}
            </p>
          </div>
        ) : (
          <div className={styles.bagsList}>
            {filteredBags.map((bag, idx) => {
              const urgency = bag.quantity_remaining > 0 && bag.quantity_remaining <= 3;
              const category = getCategoryPill(bag.title);
              return (
                <Link
                  href={`/bags/${bag.id}`}
                  key={bag.id}
                  className={styles.bagCard}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <img
                    src={bag.image_url || `https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800&sig=${bag.id}`}
                    alt={bag.title}
                    className={styles.bagCardImage}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800';
                    }}
                  />

                  <div className={styles.bagCardBody}>
                    <div className={styles.bagCardTop}>
                      <div className={styles.bagCardMeta}>
                        <span className={styles.bagCategory}>{category}</span>
                        <h3 className={styles.bagTitle}>{bag.title}</h3>
                        <p className={styles.bagMerchant}>{bag.outlet_name || bag.merchant_name || 'Local Merchant'}</p>
                      </div>
                    </div>

                    <div className={styles.bagCardBottom}>
                      <div className={styles.bagPriceRow}>
                        <span className={styles.bagPrice}>Rs. {bag.price || bag.rescue_price}</span>
                        {bag.retail_value_estimate && (
                          <span className={styles.bagPriceOriginal}>Rs. {bag.retail_value_estimate}</span>
                        )}
                      </div>
                      {urgency && (
                        <span className={styles.bagUrgency}>{bag.quantity_remaining} left</span>
                      )}
                    </div>

                    <div className={styles.bagDetails}>
                      <span className={styles.bagDetailItem}>
                        {new Date(bag.pickup_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={styles.bagDetailDot} />
                      <span className={styles.bagDetailItem}>
                        {bag.distance_km !== undefined ? `${Number(bag.distance_km).toFixed(1)} km` : 'Nearby'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}