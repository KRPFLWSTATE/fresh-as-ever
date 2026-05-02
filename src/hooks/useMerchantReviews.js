'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';

export function useMerchantReviews() {
  const DEFAULT_VENUE_RATING = 4.2;
  const supabase = useMemo(() => createClient(), []);
  const { outletScopeIds, loading: contextLoading } = useMerchantContext();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!outletScopeIds?.length) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          customer:profiles(full_name)
        `)
        .in('outlet_id', outletScopeIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      setReviews(
        (data || []).map((review) => ({
          id: review.id,
          rating: Number(review.rating || 0),
          comment: review.comment || '',
          customerName: review.customer?.full_name || 'Customer',
          createdAt: review.created_at,
        }))
      );
    } catch (fetchErr) {
      setError(fetchErr?.message || 'Could not load customer reviews.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [outletScopeIds, supabase]);

  useEffect(() => {
    if (!contextLoading) {
      fetchReviews();
    }
  }, [contextLoading, fetchReviews]);

  return {
    reviews,
    averageRating:
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
        : DEFAULT_VENUE_RATING,
    loading: loading || contextLoading,
    error,
    refetch: fetchReviews,
  };
}
