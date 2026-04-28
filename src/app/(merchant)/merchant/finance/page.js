'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function MerchantFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    lifetimeEarned: 0,
    currentPeriodEarned: 0,
    withdrawable: 0,
    cashDueToPlatform: 0
  });
  const [settlements, setSettlements] = useState([]);
  const [merchant, setMerchant] = useState(null);

  const supabase = useMemo(() => createClient(), []);

  const loadFinance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('*, outlets(id)')
        .eq('owner_id', user.id)
        .single();
        
      if (!merchantData) return;
      setMerchant(merchantData);
      
      const outletIds = merchantData.outlets.map(o => o.id);

      // Recursive delta sync: Load all-time finalized transfers
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total, payment_method, order_status')
        .in('outlet_id', outletIds)
        .eq('order_status', 'collected');

      // Ledger sync: past settlements
      const { data: pastSettlements } = await supabase
        .from('settlements')
        .select('*')
        .eq('merchant_id', merchantData.id)
        .order('period_end', { ascending: false });

      setSettlements(pastSettlements || []);

      let lifetime = 0;
      let cashDue = 0;
      
      const commRate = Number(merchantData.commission_rate || 0.15); 

      (allOrders || []).forEach(o => {
        const amt = Number(o.total || 0);
        const netAmt = amt * (1 - commRate);
        lifetime += netAmt;

        if(o.payment_method === 'cash') {
          // Cash flow protocol: merchant holds cash, owes commission substrate
          const comm = amt * commRate;
          cashDue += comm;
        }
      });

      setStats({
        lifetimeEarned: lifetime,
        currentPeriodEarned: lifetime, 
        withdrawable: Math.max(0, lifetime - cashDue), 
        cashDueToPlatform: cashDue
      });
      
    } catch (err) {
      console.error('Capital Core Sync failure:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadFinance();
    
    // Kinetic Financial Sync
    const channel = supabase
      .channel('merchant-finance-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadFinance())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadFinance, supabase]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingContent}>
            <h2 className={styles.loadingTitle}>SYNCING CAPITAL CORE</h2>
            <p className={styles.loadingText}>Validating ledger substrates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>FINANCIAL NEXUS</h1>
      </header>

      {/* Capital Core Balance Card */}
      <div className={styles.balanceCard}>
        <span className={styles.balanceLabel}>OPERATIONAL NET REVENUE</span>
        <h2 className={styles.balanceAmount}>Rs. {stats.lifetimeEarned.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
        
        <div className={styles.balanceBreakdown}>
          <div className={styles.breakdownItem}>
            <span>Registry Protocol Fee (15%)</span>
            <span>- Rs. {((stats.lifetimeEarned / 0.85) * 0.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
          </div>
          <div className={styles.breakdownItem}>
            <span>Cash Handover Liability</span>
            <span className={styles.cashDue}>- Rs. {stats.cashDueToPlatform.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
          </div>
        </div>

        <button 
          className={styles.withdrawBtn}
          onClick={() => alert('Neural Link: Withdrawal protocol active. Funds being bridged.')}
        >
          INITIATE WITHDRAWAL
        </button>
      </div>

      {/* Channel Settings */}
      <div className={styles.settingsCard}>
        <h3>SETTLEMENT PROTOCOL</h3>
        <div className={styles.settingsRow}>
          <span>Method:</span>
          <strong className={styles.uppercaseText}>{merchant?.payout_method?.replace('_', ' ') || 'SYSTEM DEFAULT'}</strong>
        </div>
        {merchant?.payout_method === 'bank_transfer' && merchant?.bank_details && (
          <div className={styles.settingsRow}>
            <span>Registry Node:</span>
            <strong>{merchant.bank_details.bank_name} ···· {merchant.bank_details.account_number?.slice(-4)}</strong>
          </div>
        )}
      </div>

      <h3 className={styles.sectionTitle}>LEDGER SUBSTRATE</h3>
      {settlements.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>NO HISTORICAL DELTAS</h3>
          <p className={styles.emptyText}>Transfer records will synchronize here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {settlements.map(s => (
            <div key={s.id} className={styles.row}>
              <div>
                <p className={styles.rowDate}>{new Date(s.period_start).toLocaleDateString()} — {new Date(s.period_end).toLocaleDateString()}</p>
                <span className={styles.smallBadge}>{s.status.toUpperCase()}</span>
              </div>
              <div className={styles.rowRight}>
                <p className={styles.rowAmount}>Rs. {Number(s.net_payout).toLocaleString()}</p>
                <p className={styles.rowMeta}>{s.total_orders} NODES SYNCED</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

