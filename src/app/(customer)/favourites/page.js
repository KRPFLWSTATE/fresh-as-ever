'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ZeroState from '@/components/spatial/ZeroState';
import styles from './page.module.css';

export default function FavouritesPage() {
  const router = useRouter();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchFavourites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('favourite_outlets')
        .select(`
          outlet_id,
          outlet:outlets(name, address, category, average_rating, cover_image_url)
        `)
        .eq('customer_id', user.id);
      
      setFavourites(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  if (loading) return <div className={styles.loadingWrapper}>Loading favorites...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Saved Places</h1>
      </header>
      
      {favourites.length === 0 ? (
        <ZeroState 
          icon="❤️"
          title="Static Signal"
          description="You haven't archived any favorite bakehouses yet. Secure your most-loved merchants for faster access."
        />
      ) : (
        <div className={styles.grid}>
          {favourites.map(fav => (
            <div 
              key={fav.outlet_id} 
              className={styles.card}
              onClick={() => router.push(`/outlets/${fav.outlet_id}`)}
            >
              <img 
                src={fav.outlet.cover_image_url || '/placeholder-bag.png'} 
                alt="" 
                className={styles.cardImage}
              />
              <div className={styles.cardContent}>
                <h3 className={styles.outletName}>{fav.outlet.name}</h3>
                <p className={styles.category}>{fav.outlet.category}</p>
                <div className={styles.rating}>⭐ {fav.outlet.average_rating || 'New'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
