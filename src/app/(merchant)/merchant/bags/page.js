'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';
import ZeroState from '@/components/spatial/ZeroState';

export default function MerchantBagsPage() {
  const router = useRouter();
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const loadBags = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: merchant } = await supabase
        .from('merchants')
        .select('outlets(id)')
        .eq('owner_id', user.id)
        .single();

      if (!merchant?.outlets || merchant.outlets.length === 0) {
        setBags([]);
        setLoading(false);
        return;
      }

      const outletIds = merchant.outlets.map(o => o.id);

      const { data: bagsData, error } = await supabase
        .from('rescue_bags')
        .select(`
          *,
          outlet:outlets(name)
        `)
        .in('outlet_id', outletIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBags(bagsData || []);
    } catch (err) {
      console.error('Neural registry sync failure:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadBags();
  }, [loadBags]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <h2 className={styles.loadingTitle}>SYNCING INVENTORY</h2>
            <p className={styles.loadingText}>Calibrating active rescue nodes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Active Nodes</h1>
          <p className={styles.headerDescription}>Operational Rescue Inventory</p>
        </div>
        <Link href="/merchant/bags/create" className={styles.deployBtn}>+ DEPLOY NEW ASSET</Link>
      </header>

      {bags.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <ZeroState 
            icon="🛍️"
            title="Empty Substrate"
            description="You have no active rescue bags deployed in the spatial registry."
            action={
              <Link href="/merchant/bags/create" className={styles.initBtn}>
                INITIALIZE NODE
              </Link>
            }
          />
        </div>
      ) : (
        <div className={styles.inventoryGrid}>
          {bags.map((bag) => (
            <Link href={`/merchant/bags/${bag.id}/edit`} key={bag.id} className={styles.bagCard}>
              <div className={styles.bagHeader}>
                <div>
                  <span className={styles.bagCategory}>{bag.category || 'Standard Node'}</span>
                  <h3 className={styles.bagTitle}>{bag.title}</h3>
                  <p className={styles.outletName}>{bag.outlet?.name}</p>
                </div>
                <span className={`${styles.statusBadge} ${styles['status-' + bag.status]}`}>
                  {bag.status === 'active' ? 'OPERATIONAL' : bag.status.toUpperCase().replace('_', ' ')}
                </span>
              </div>

              <div className={styles.bagStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Available</span>
                  <span className={styles.statValue} data-low={bag.quantity_remaining <= 0}>
                    {bag.quantity_remaining}
                  </span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Deployed</span>
                  <span className={styles.statValue}>{bag.quantity_total}</span>
                </div>
              </div>

              <div className={styles.bagFooter}>
                <div className={styles.priceGroup}>
                  <span className={styles.rescuePrice}>Rs. {bag.rescue_price.toLocaleString()}</span>
                  <span className={styles.retailPrice}>Rs. {bag.retail_value_estimate.toLocaleString()}</span>
                </div>
                <div className={styles.arrow}>→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

