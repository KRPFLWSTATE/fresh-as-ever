'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Bag detail hook — fetch, realtime updates, reserve action.
 * Extracted from: src/app/(customer)/bags/[id]/page.js
 */
export function useBagDetail(bagId) {
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
        .eq('id', bagId)
        .single();

      if (error) throw error;
      setBag(data);
    } catch (err) {
      console.error('Error fetching bag details:', err);
      setError('Bag not found or no longer available.');
    } finally {
      setLoading(false);
    }
  }, [bagId, supabase]);

  // Fetch + realtime subscription
  useEffect(() => {
    if (!bagId) return;
    fetchBagDetails();

    const channel = supabase
      .channel(`bag-${bagId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rescue_bags', filter: `id=eq.${bagId}` },
        (payload) => {
          setBag(prev => prev ? {
            ...prev,
            quantity_remaining: payload.new.quantity_remaining,
            rescue_price: payload.new.rescue_price,
          } : null);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bagId, fetchBagDetails, supabase]);

  const handleReserve = useCallback(() => {
    router.push(`/checkout?bag_id=${bagId}`);
  }, [router, bagId]);

  const getCategory = useCallback((title) => {
    const t = (title || '').toLowerCase();
    if (['bread', 'cake', 'croissant', 'pastry', 'bun', 'donut', 'muffin'].some(k => t.includes(k))) return 'Bakery';
    if (['vegan', 'organic', 'green', 'plant'].some(k => t.includes(k))) return 'Eco';
    if (['premium', 'gold', 'deluxe', 'chef'].some(k => t.includes(k))) return 'Gourmet';
    return 'Cuisine';
  }, []);

  // Derived state
  const isSoldOut = bag ? bag.quantity_remaining <= 0 : false;
  const isUrgent = bag ? bag.quantity_remaining > 0 && bag.quantity_remaining <= 3 : false;

  return {
    bag,
    loading,
    error,
    isSoldOut,
    isUrgent,
    handleReserve,
    getCategory,
  };
}
