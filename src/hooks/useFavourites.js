'use client';

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useFavourites() {
  const DEFAULT_VENUE_RATING = 4.2;
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchFavourites = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view favourites.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('favourite_outlets')
        .select(`
          outlet_id,
          outlet:outlets (
            id,
            name,
            average_rating,
            cover_image_url,
            rescue_bags (
              quantity_remaining,
              status
            )
          )
        `)
        .eq('customer_id', user.id);

      if (fetchError) throw fetchError;

      const formatted = (data || []).map(fav => {
        const out = fav.outlet;
        const liveBags = (out.rescue_bags || []).filter(b => b.status === 'live' || b.status === 'draft');
        const bagsAvailable = liveBags.reduce((sum, b) => sum + (b.quantity_remaining || 0), 0);
        
        return {
          id: out.id,
          name: out.name,
          rating: out.average_rating || DEFAULT_VENUE_RATING,
          distance: 'Nearby', // Mock distance since we need user location to calculate
          image: out.cover_image_url || '/api/placeholder/400/200',
          status: bagsAvailable > 0 ? 'selling_fast' : 'sold_out',
          bagsAvailable,
        };
      });

      setFavourites(formatted);
    } catch (err) {
      console.error('Fetch favourites error:', err);
      setError('Could not load favourites.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    startTransition(() => {
      fetchFavourites();
    });
  }, [fetchFavourites]);

  const savedOutletIds = useMemo(
    () => new Set((favourites || []).map((f) => f.id)),
    [favourites]
  );

  const isSaved = useCallback((outletId) => savedOutletIds.has(outletId), [savedOutletIds]);

  const removeFavourite = async (outletId) => {
    setFavourites((prev) => prev.filter((f) => f.id !== outletId));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('favourite_outlets').delete().match({ customer_id: user.id, outlet_id: outletId });
      await fetchFavourites();
    }
  };

  const addFavourite = async (outletId) => {
    if (!outletId) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('SIGN_IN_REQUIRED');
    }
    const { error: insertError } = await supabase.from('favourite_outlets').insert({
      customer_id: user.id,
      outlet_id: outletId,
    });
    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }
    await fetchFavourites();
  };

  const toggleFavourite = async (outletId) => {
    if (isSaved(outletId)) {
      await removeFavourite(outletId);
    } else {
      await addFavourite(outletId);
    }
  };

  return {
    favourites,
    loading,
    error,
    removeFavourite,
    addFavourite,
    toggleFavourite,
    isSaved,
    refetch: fetchFavourites,
  };
}
