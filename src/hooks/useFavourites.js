'use client';

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';
import { ERROR } from '@/lib/messages/errors';
import { distanceLabelFromOutlet } from '@/lib/geoDistance';
import { normalizeVenueRating } from '@/lib/venueRating';

function mapFavouriteRow(fav, userCoords) {
  const out = fav.outlet;
  if (!out?.id) return null;

  const liveBags = (out.rescue_bags || []).filter(
    (b) => b.status === 'live' || b.status === 'draft',
  );
  const bagsAvailable = liveBags.reduce(
    (sum, b) => sum + (b.quantity_remaining || 0),
    0,
  );

  let status = 'sold_out';
  if (bagsAvailable > 0) status = 'selling_fast';
  else if (liveBags.length > 0) status = 'sold_out_today';

  const distanceLabel = distanceLabelFromOutlet(userCoords, out.location);

  return {
    id: out.id,
    name: out.name,
    rating: normalizeVenueRating(out.average_rating),
    trustScore: out.trust_score ?? null,
    averageRating: out.average_rating ?? null,
    totalReviews: out.total_reviews ?? null,
    collectionRatePct: out.collection_rate_pct ?? null,
    complaintRatePct: out.complaint_rate_pct ?? null,
    noShowRatePct: out.no_show_rate_pct ?? null,
    distanceLabel,
    distance: distanceLabel,
    image: out.cover_image_url || '/api/placeholder/400/200',
    status,
    bagsAvailable,
  };
}

export function useFavourites() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [locStatus, setLocStatus] = useState('pending');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setLocStatus('unavailable');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocStatus('granted');
        },
        () => setLocStatus('denied'),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
      );
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const fetchFavourites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(ERROR.favourites.signIn);
        setFavourites([]);
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
            total_reviews,
            trust_score,
            collection_rate_pct,
            complaint_rate_pct,
            no_show_rate_pct,
            cover_image_url,
            location,
            rescue_bags (
              quantity_remaining,
              status
            )
          )
        `)
        .eq('customer_id', user.id);

      if (fetchError) throw fetchError;

      const formatted = (data || [])
        .map((fav) => mapFavouriteRow(fav, userCoords))
        .filter(Boolean);

      setFavourites(formatted);
    } catch (err) {
      console.error('Fetch favourites error:', err);
      setError(mapSupabaseError(err, ERROR.favourites.load));
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, userCoords]);

  useEffect(() => {
    startTransition(() => {
      fetchFavourites();
    });
  }, [fetchFavourites]);

  const savedOutletIds = useMemo(
    () => new Set((favourites || []).map((f) => f.id)),
    [favourites],
  );

  const isSaved = useCallback((outletId) => savedOutletIds.has(outletId), [savedOutletIds]);

  const removeFavourite = async (outletId) => {
    setFavourites((prev) => prev.filter((f) => f.id !== outletId));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('favourite_outlets')
        .delete()
        .match({ customer_id: user.id, outlet_id: outletId });
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
    locStatus,
    removeFavourite,
    addFavourite,
    toggleFavourite,
    isSaved,
    refetch: fetchFavourites,
  };
}
