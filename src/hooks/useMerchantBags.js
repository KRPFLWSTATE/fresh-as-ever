'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';
import { mapSupabaseError } from '@/lib/supabaseError';
import { canPublishRescueBags } from '@/lib/outletListingMode';

export function useMerchantBags() {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, loading: contextLoading } = useMerchantContext();

  const bagsAllowed = canPublishRescueBags(activeOutlet?.category);

  const fetchBags = useCallback(async () => {
    await Promise.resolve();
    if (!activeOutlet?.id || !bagsAllowed) {
      setBags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('rescue_bags')
        .select('*')
        .eq('outlet_id', activeOutlet.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formatted = (data || []).map(b => ({
        id: b.id,
        title: b.title,
        rescue_price: b.rescue_price,
        retail_value_estimate: b.retail_value_estimate,
        quantity_available: b.quantity_remaining,
        status: b.status,
        category: b.category,
        image_url: b.image_url,
        is_active: b.status === 'live',
        pickupStart: b.pickup_start,
        pickupEnd: b.pickup_end,
      }));
      
      setBags(formatted);
    } catch (err) {
      setError(mapSupabaseError(err, 'Could not load bags.'));
    } finally {
      setLoading(false);
    }
  }, [activeOutlet, bagsAllowed, supabase]);

  useEffect(() => {
    if (contextLoading) return undefined;
    const t = window.setTimeout(() => {
      void fetchBags();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchBags, contextLoading]);

  const deleteBag = async (id) => {
    try {
      setBags(prev => prev.filter(b => b.id !== id));
      const { error } = await supabase
        .from('rescue_bags')
        .update({ status: 'removed' })
        .eq('id', id);
        
      if (error) throw error;
    } catch (err) {
      console.error('Delete bag error:', err);
      // Revert optimistic update on failure
      fetchBags();
    }
  };

  const createBag = async (bagData) => {
    if (!activeOutlet?.id) {
      throw new Error('Merchant outlet is not ready yet.');
    }
    
    try {
      const { data, error } = await supabase
        .from('rescue_bags')
        .insert({
          ...bagData,
          outlet_id: activeOutlet.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      await fetchBags();
      return data;
    } catch (err) {
      console.error('Create bag error:', err);
      throw err;
    }
  };

  const updateBag = async (bagId, bagData) => {
    try {
      const { data, error } = await supabase
        .from('rescue_bags')
        .update(bagData)
        .eq('id', bagId)
        .select()
        .single();

      if (error) throw error;
      await fetchBags();
      return data;
    } catch (err) {
      console.error('Update bag error:', err);
      throw err;
    }
  };

  return {
    bags,
    loading: loading || contextLoading,
    error,
    activeOutlet,
    deleteBag,
    createBag,
    updateBag,
    refetch: fetchBags
  };
}
