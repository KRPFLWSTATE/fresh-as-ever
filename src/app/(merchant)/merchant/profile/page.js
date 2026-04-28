'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

import styles from './page.module.css';

export default function MerchantProfile() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [pRes, mRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('merchants').select('*, outlets(*)').eq('owner_id', user.id).single()
      ]);

      setProfile(pRes.data);
      setMerchant(mRes.data);
    } catch (err) {
      console.error('Identity Substrate Failure:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingContent}>
            <h2 className={styles.loadingTitle}>PULSING ENTITY GATEWAY</h2>
            <p className={styles.loadingText}>Validating identity substrates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>ENTITY IDENTITY</h1>
      </header>

      {/* Primary Identity Substrate */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {profile?.full_name?.charAt(0) || 'M'}
        </div>
        <div>
          <h2 className={styles.name}>{profile?.full_name}</h2>
          <p className={styles.phone}>{profile?.phone}</p>
          <span className={styles.roleBadge}>{profile?.role?.toUpperCase()}</span>
        </div>
      </div>

      {/* Operational Business Substrate */}
      {merchant && (
        <div className={styles.businessCard}>
          <h3 className={styles.businessTitle}>Business Configuration</h3>
          <div className={styles.businessGrid}>
            <div className={styles.businessRow}>
              <span className={styles.businessLabel}>Entity Name</span> 
              <span className={styles.businessValue}>{merchant.business_name}</span>
            </div>
            <div className={styles.businessRow}>
              <span className={styles.businessLabel}>Status Protocol</span> 
              <span className={`badge ${merchant.status === 'approved' ? 'badge-teal' : 'badge-amber'}`}>{merchant.status.toUpperCase()}</span>
            </div>
            <div className={styles.businessRow}>
              <span className={styles.businessLabel}>Active Outlets</span> 
              <span className={styles.businessValue}>{(merchant.outlets || []).length} NODES</span>
            </div>
            <div className={styles.businessRow}>
              <span className={styles.businessLabel}>Registry Fee</span> 
              <span className={styles.businessValue}>{(merchant.commission_rate * 100).toFixed(0)}% DELTA</span>
            </div>
          </div>
        </div>
      )}

      {/* Command Matrix */}
      <div className={styles.settingsList}>
        {merchant && (
          <Link href="/merchant/outlets" className={styles.settingsItem}>
            <span>MANAGE OPERATIONAL NODES</span>
            <span>→</span>
          </Link>
        )}
        <Link href="/support" className={styles.settingsItem}>
          <span>CONTACT REGISTRY SUPPORT</span>
          <span>→</span>
        </Link>
        <button onClick={handleSignOut} className={styles.settingsItem + ' ' + styles.signOut}>
          <span>DEACTIVATE SESSION</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

