'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [impactStats, setImpactStats] = useState({ bagsRescued: 0, moneySaved: 0, co2Saved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You are not logged in. Auth is currently bypassed in dev so the profile cannot be loaded.');
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch impact stats (from completed orders)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('quantity, unit_price, discount_amount, bag:rescue_bags(retail_value_estimate)')
        .eq('customer_id', user.id)
        .eq('order_status', 'completed');
        
      if (!ordersError && ordersData) {
        let bags = 0;
        let saved = 0;
        ordersData.forEach(o => {
          bags += o.quantity;
          const retailVal = o.bag?.retail_value_estimate || 0;
          const paid = (o.unit_price * o.quantity) - o.discount_amount;
          saved += (retailVal * o.quantity) - paid;
        });
        
        setImpactStats({
          bagsRescued: bags,
          moneySaved: saved,
          co2Saved: bags * 2.5 // Estimate 2.5kg CO2 saved per bag
        });
      }

    } catch (err) {
      console.error(err);
      setError('Could not load profile data.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
        <div className={styles.content}>
          <div className={`${styles.skeleton} ${styles.skeletonAvatar}`} />
          <div className={`${styles.skeleton} ${styles.skeletonText}`} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>My Profile</h1>
        </header>
        <div className={styles.emptyState}>
          <span className={styles.emptyStateIcon}>👤</span>
          <h3>Oops</h3>
          <p>{error}</p>
          <button className={styles.secondaryBtn} onClick={() => router.push('/login')}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>My Profile</h1>
      </header>

      <div className={styles.topSection}>
        <div className={styles.avatar}>
          {profile.first_name ? profile.first_name[0].toUpperCase() : '👤'}
        </div>
        <h2 className={styles.name}>{profile.first_name} {profile.last_name}</h2>
        <p className={styles.phone}>{profile.phone_number}</p>
      </div>

      <div className={styles.content}>
        
        {/* Impact Stats */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>My Impact</h3>
          <div className={styles.impactGrid}>
            <div className={styles.impactCard}>
              <span className={styles.impactIcon}>🛍️</span>
              <span className={styles.impactValue}>{impactStats.bagsRescued}</span>
              <span className={styles.impactLabel}>Bags Rescued</span>
            </div>
            <div className={styles.impactCard}>
              <span className={styles.impactIcon}>💰</span>
              <span className={styles.impactValue}>Rs. {impactStats.moneySaved}</span>
              <span className={styles.impactLabel}>Money Saved</span>
            </div>
            <div className={styles.impactCard}>
              <span className={styles.impactIcon}>🌍</span>
              <span className={styles.impactValue}>{impactStats.co2Saved.toFixed(1)}</span>
              <span className={styles.impactLabel}>kg CO2e Saved</span>
            </div>
          </div>
        </section>

        {/* Settings Links */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Account</h3>
          <div className={styles.listGroup}>
            <button className={styles.listItem}>
              <span>Personal Details</span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.listItem}>
              <span>Payment Methods</span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.listItem}>
              <span>Dietary Preferences</span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.listItem}>
              <span>Notifications</span>
              <span className={styles.chevron}>›</span>
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Support</h3>
          <div className={styles.listGroup}>
            <button className={styles.listItem}>
              <span>Help Center</span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.listItem}>
              <span>Terms & Policies</span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={`${styles.listItem} ${styles.logoutBtn}`} onClick={handleLogout}>
              <span>Log Out</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
