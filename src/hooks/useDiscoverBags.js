'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseOutletLatLng } from '@/lib/geo/parseOutletLatLng';
import { normalizeVenueRating } from '@/lib/venueRating';
import { mapSupabaseError } from '@/lib/supabaseError';
import { ERROR } from '@/lib/messages/errors';
import { fetchPublishedShelves, mergeDiscoverFeed } from '@/lib/discoverFeed';

function outletCoordsFromRow(row) {
  const nested = parseOutletLatLng(
    row?.outlet?.location ?? row?.outlet_location ?? row?.location
  );
  if (nested) return nested;
  const latRaw = row?.outlet_lat ?? row?.outlet_latitude;
  const lngRaw = row?.outlet_lng ?? row?.outlet_longitude;
  const lat = typeof latRaw === 'number' ? latRaw : parseFloat(latRaw);
  const lng = typeof lngRaw === 'number' ? lngRaw : parseFloat(lngRaw);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

async function enrichBagsWithOutletLocations(supabase, bags) {
  if (!bags?.length) return bags;
  const needsAny = bags.some(
    (b) => !(Number.isFinite(b.outlet_lat) && Number.isFinite(b.outlet_lng))
  );
  if (!needsAny) return bags;

  const ids = [...new Set(bags.map((b) => b.id).filter(Boolean))];
  if (ids.length === 0) return bags;

  const { data: rows, error: joinError } = await supabase
    .from('rescue_bags')
    .select('id, outlet_id, outlet:outlets(location)')
    .in('id', ids);

  if (joinError) {
    console.warn('enrichBagsWithOutletLocations (rescue_bags join):', joinError.message);
    return bags;
  }

  /** @type {Map<string, { lat: number, lng: number }>} */
  const coordsByBagId = new Map();
  /** @type {Map<string, string|null|undefined>} */
  const outletIdByBagId = new Map();

  for (const row of rows || []) {
    outletIdByBagId.set(row.id, row.outlet_id ?? null);
    const c = parseOutletLatLng(row?.outlet?.location);
    if (c) coordsByBagId.set(row.id, c);
  }

  let merged = bags.map((b) => {
    const outletId = b.outlet_id ?? outletIdByBagId.get(b.id) ?? null;
    const base = { ...b, outlet_id: outletId };

    if (Number.isFinite(base.outlet_lat) && Number.isFinite(base.outlet_lng)) return base;
    const c = coordsByBagId.get(b.id);
    return c ? { ...base, outlet_lat: c.lat, outlet_lng: c.lng } : base;
  });

  const missingOid = [
    ...new Set(
      merged
        .filter(
          (b) =>
            !(Number.isFinite(b.outlet_lat) && Number.isFinite(b.outlet_lng)) && b.outlet_id
        )
        .map((b) => b.outlet_id)
    ),
  ];
  if (missingOid.length === 0) return merged;

  const { data: outletRows, error: outletError } = await supabase
    .from('outlets')
    .select('id, location')
    .in('id', missingOid);

  if (outletError) {
    console.warn('enrichBagsWithOutletLocations (outlets table):', outletError.message);
    return merged;
  }

  const coordsByOutletId = new Map();
  for (const o of outletRows || []) {
    const p = parseOutletLatLng(o.location);
    if (p) coordsByOutletId.set(o.id, p);
  }

  return merged.map((b) => {
    if (Number.isFinite(b.outlet_lat) && Number.isFinite(b.outlet_lng)) return b;
    const p = b.outlet_id ? coordsByOutletId.get(b.outlet_id) : null;
    return p ? { ...b, outlet_lat: p.lat, outlet_lng: p.lng } : b;
  });
}

// Category filtering (module scope so hooks don’t recreate objects each render).
const CATEGORY_KEYWORDS = {
  Bakery: ['bread', 'cake', 'croissant', 'pastry', 'bun', 'donut', 'muffin'],
  'Café': ['coffee', 'latte', 'cafe', 'tea'],
  Restaurant: ['meal', 'dinner', 'lunch', 'rice', 'curry', 'kottu', 'hoppers', 'string'],
  Supermarket: ['groceries', 'vegetables', 'fruit', 'milk', 'egg'],
  Hotel: ['premium', 'buffet', 'gourmet'],
  'Mixed Meals': ['box', 'mixed', 'pack', 'combo'],
  Groceries: ['pack', 'essentials', 'basket'],
};
const CATEGORY_ALIASES = {
  Bakery: ['bakery'],
  'Café': ['cafe'],
  Restaurant: ['restaurant', 'mixed_meals'],
  Supermarket: ['supermarket', 'groceries'],
  'Mixed Meals': ['mixed_meals'],
};

function normalizeCategory(value) {
  return String(value || '').toLowerCase().replace(/[^\w]/g, '');
}

function containsKeyword(text, keyword) {
  const safeKeyword = String(keyword || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${safeKeyword}\\b`, 'i').test(String(text || ''));
}

function mapRowToDiscoverBag(row) {
  const coords = outletCoordsFromRow(row);
  return {
    id: row.id,
    outlet_id: row.outlet_id ?? row.outlet?.id ?? null,
    title: row.title,
    category: row.category,
    rescue_price: row.rescue_price,
    original_price: row.retail_value_estimate ?? row.original_price,
    image_url: row.image_url,
    pickup_start: row.pickup_start,
    pickup_end: row.pickup_end,
    quantity_remaining: row.quantity_remaining || 0,
    merchant_name:
      row.merchant_name ??
      row.outlet?.merchant?.business_name ??
      row.outlet?.name ??
      'Local Merchant',
    outlet_name: row.outlet_name ?? row.outlet?.name ?? 'Outlet',
    outlet_category: row.outlet?.category ?? row.outlet_category ?? null,
    rating: normalizeVenueRating(row.rating ?? row.outlet?.average_rating),
    review_count: row.review_count ?? row.outlet?.total_reviews ?? 0,
    trust_score:
      row.trust_score ?? row.outlet?.trust_score ?? null,
    average_rating: row.outlet?.average_rating ?? null,
    total_reviews: row.outlet?.total_reviews ?? row.review_count ?? 0,
    collection_rate_pct: row.outlet?.collection_rate_pct ?? null,
    complaint_rate_pct: row.outlet?.complaint_rate_pct ?? null,
    no_show_rate_pct: row.outlet?.no_show_rate_pct ?? null,
    outlet_lat: coords?.lat ?? null,
    outlet_lng: coords?.lng ?? null,
  };
}

/**
 * Discover bags hook — geolocation, Supabase RPC fetch, search, category filtering.
 * Extracted from: src/app/(customer)/discover/page.js
 */
export function useDiscoverBags() {
  const [bags, setBags] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 });
  const [locStatus, setLocStatus] = useState('pending');

  const supabase = useMemo(() => createClient(), []);
  const [locationLabel, setLocationLabel] = useState('Colombo 07');
  /** Browser geolocation accuracy in meters when last fix was from GPS; null if unknown or manual location. */
  const [positionAccuracyM, setPositionAccuracyM] = useState(null);

  const fetchNearbyBags = useCallback(async (lat, lng) => {
    await Promise.resolve();
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('nearby_bags', {
        user_lat: lat,
        user_lng: lng,
        radius_km: 10,
      });

      if (error) throw error;
      let nextBags = (data || []).map(mapRowToDiscoverBag);

      // Fallback query for environments where nearby_bags returns empty due seed/geolocation mismatch.
      if (nextBags.length === 0) {
        const { data: fallbackRows, error: fallbackError } = await supabase
          .from('rescue_bags')
          .select(`
            id,
            outlet_id,
            title,
            category,
            rescue_price,
            retail_value_estimate,
            image_url,
            pickup_start,
            pickup_end,
            quantity_remaining,
            outlet:outlets (
              id,
              name,
              category,
              average_rating,
              total_reviews,
              trust_score,
              collection_rate_pct,
              complaint_rate_pct,
              no_show_rate_pct,
              location,
              merchant:merchants (business_name)
            )
          `)
          .in('status', ['live', 'draft'])
          .gt('quantity_remaining', 0)
          .order('created_at', { ascending: false })
          .limit(24);

        if (fallbackError) throw fallbackError;

        nextBags = (fallbackRows || []).map(mapRowToDiscoverBag);
      }

      nextBags = await enrichBagsWithOutletLocations(supabase, nextBags);

      const nextShelves = await fetchPublishedShelves(supabase);
      setBags(nextBags);
      setShelves(nextShelves);
    } catch (err) {
      setError(mapSupabaseError(err, ERROR.discover.loadBags));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filteredBags = useMemo(() => {
    let result = bags;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.outlet_name?.toLowerCase().includes(q) ||
          b.merchant_name?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'All') {
      const keywords = CATEGORY_KEYWORDS[activeCategory] || [];
      const normalizedActiveCategory = normalizeCategory(activeCategory);
      const aliasCategories = (CATEGORY_ALIASES[activeCategory] || []).map(normalizeCategory);
      if (keywords.length > 0) {
        result = result.filter(
          (b) =>
            keywords.some((k) => containsKeyword(b.title, k)) ||
            aliasCategories.includes(normalizeCategory(b.category)) ||
            normalizeCategory(b.category) === normalizedActiveCategory
        );
      } else {
        result = result.filter((b) => normalizeCategory(b.category) === normalizedActiveCategory);
      }
    }

    return result;
  }, [searchQuery, activeCategory, bags]);

  // Geolocation init
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(coords);
          setLocStatus('granted');
          const acc = position.coords.accuracy;
          setPositionAccuracyM(
            typeof acc === 'number' && Number.isFinite(acc) ? acc : null
          );
          fetchNearbyBags(coords.lat, coords.lng);
        },
        () => {
          setLocStatus('denied');
          setPositionAccuracyM(null);
          fetchNearbyBags(6.9271, 79.8612);
        },
        { enableHighAccuracy: true, timeout: 22000, maximumAge: 0 }
      );
    } else {
      void Promise.resolve().then(() => {
        setLocStatus('denied');
        setPositionAccuracyM(null);
        return fetchNearbyBags(6.9271, 79.8612);
      });
    }
  }, [fetchNearbyBags]);

  const handleRefresh = useCallback(() => {
    fetchNearbyBags(location.lat, location.lng);
  }, [fetchNearbyBags, location]);

  const setLocationByCoords = useCallback(async ({ lat, lng, label, status = 'manual', accuracyM }) => {
    const coords = { lat, lng };
    setLocation(coords);
    setLocStatus(status);
    if (label) setLocationLabel(label);
    if (accuracyM !== undefined) {
      setPositionAccuracyM(
        accuracyM !== null && Number.isFinite(Number(accuracyM)) ? Number(accuracyM) : null
      );
    } else if (status === 'manual') {
      setPositionAccuracyM(null);
    }
    await fetchNearbyBags(lat, lng);
  }, [fetchNearbyBags]);

  const getCategoryPill = useCallback((bagTitle) => {
    const title = bagTitle.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => title.includes(k))) return cat;
    }
    return 'Cuisine';
  }, []);

  const feedItems = useMemo(
    () => mergeDiscoverFeed(filteredBags, shelves),
    [filteredBags, shelves],
  );

  return {
    bags: filteredBags,
    shelves,
    feedItems,
    allBags: bags,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    setSelectedCategory: setActiveCategory, // Alias for backward compatibility if needed, but let's check component again.
    locStatus,
    setLocStatus,
    location,
    locationLabel,
    setLocationLabel,
    setLocationByCoords,
    handleRefresh,
    getCategoryPill,
    positionAccuracyM,
  };
}
