'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Discover bags hook — geolocation, Supabase RPC fetch, search, category filtering.
 * Extracted from: src/app/(customer)/discover/page.js
 */
export function useDiscoverBags() {
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
      setError(null);
      const { data, error } = await supabase.rpc('nearby_bags', {
        user_lat: lat,
        user_lng: lng,
        radius_km: 10,
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

  // Category-based keyword filtering
  const CATEGORY_KEYWORDS = {
    Bakery: ['bread', 'cake', 'croissant', 'pastry', 'bun', 'donut', 'muffin'],
    Eco: ['vegan', 'organic', 'green', 'plant'],
    Gourmet: ['premium', 'gold', 'deluxe', 'chef'],
    Cuisine: ['rice', 'curry', 'kottu', 'hoppers', 'string'],
  };

  // Apply search + category filters
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
      const keywords = CATEGORY_KEYWORDS[activeCategory] || [];
      if (keywords.length > 0) {
        result = result.filter(b =>
          keywords.some(k => b.title.toLowerCase().includes(k))
        );
      }
    }

    setFilteredBags(result);
  }, [searchQuery, activeCategory, bags]);

  // Geolocation init
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(coords);
          setLocStatus('granted');
          fetchNearbyBags(coords.lat, coords.lng);
        },
        () => {
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

  const handleRefresh = useCallback(() => {
    fetchNearbyBags(location.lat, location.lng);
  }, [fetchNearbyBags, location]);

  const getCategoryPill = useCallback((bagTitle) => {
    const title = bagTitle.toLowerCase();
    if (CATEGORY_KEYWORDS.Bakery.some(k => title.includes(k))) return 'Bakery';
    if (CATEGORY_KEYWORDS.Eco.some(k => title.includes(k))) return 'Eco';
    if (CATEGORY_KEYWORDS.Gourmet.some(k => title.includes(k))) return 'Gourmet';
    return 'Cuisine';
  }, []);

  return {
    bags: filteredBags,
    allBags: bags,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    locStatus,
    setLocStatus,
    location,
    handleRefresh,
    getCategoryPill,
  };
}
