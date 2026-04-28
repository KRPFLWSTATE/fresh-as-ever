'use client';

import { useState, useEffect, use, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminMerchantDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const loadMerchant = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*, profiles:owner_id(full_name, email, phone), outlets(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      setMerchant(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => { loadMerchant(); }, [loadMerchant]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateStatus = async (status, activateOutlets = false) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.from('merchants').update({ status }).eq('id', id);
      if (error) throw error;
      
      if (activateOutlets && merchant.outlets?.length > 0) {
        await Promise.all(
          merchant.outlets.map(o => supabase.from('outlets').update({ is_active: true }).eq('id', o.id))
        );
      }
      
      await loadMerchant();
      showToast(`Entity status successfully transitioned to ${status.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      showToast('Neural link failed: Unable to update registry status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.loadingOverlay}>
      <h2 className={styles.loadingTitle}>SYNCHRONIZING RECORDS</h2>
      <p className={styles.loadingSubtitle}>Accessing Merchant Data Substrate...</p>
    </div>
  );

  if (!merchant) return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.centerCard}`}>
        <h2 className={styles.voidTitle}>VOID DETECTED</h2>
        <p className={styles.voidSubtitle}>UUID does not match any known merchant identity.</p>
        <Link href="/admin/merchants" className={styles.btnTeal}>
          Back to Registry
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {toast && (
        <div className={`${styles.toastContainer} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.message}
        </div>
      )}

      <header className={styles.header}>
        <Link href="/admin/merchants" className={styles.btnBack}>
          ← REGISTRY
        </Link>
        <div className={styles.titleWrapper}>
          <h1>Review Application</h1>
          <p className={styles.subtitle}>PLATFORM GOVERNANCE PROTOCOL v4.0</p>
        </div>
        <div className={`${styles.statusBadge} ${styles[merchant.status]}`}>
          {merchant.status.toUpperCase()}
        </div>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.section}>
          
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span>Business Blueprint</span>
              <span className={styles.refLabel}>REF: {merchant.id.slice(0,13)}</span>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Business Name</label>
                <span>{merchant.business_name}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Legal Name</label>
                <span>{merchant.legal_name || 'UNDECLARED'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Registration</label>
                <span>{merchant.business_registration_number || 'PENDING'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Primary Contact</label>
                <span>{merchant.contact_name}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Phone</label>
                <span>{merchant.contact_phone}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Email</label>
                <span>{merchant.contact_email}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span>Physical Terminal Network</span>
              <div className={styles.outletCount}>
                {merchant.outlets?.length || 0}
              </div>
            </div>
            
            {merchant.outlets?.map(o => (
              <div key={o.id} className={styles.outletCard}>
                <div className={styles.outletHeader}>
                  <span className={styles.outletName}>
                    {o.name} <span className={styles.outletCategory}>/ {o.category.toUpperCase()}</span>
                  </span>
                  <div className={`${styles.outletStatus} ${o.is_active ? styles.online : styles.offline}`}>
                    {o.is_active ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
                <p className={styles.outletAddress}>{o.address}</p>
                {o.pickup_instructions && (
                  <p className={styles.pickupInstructions}>
                    TRANSFER PROTOCOL: {o.pickup_instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
          
        </div>

        <aside>
          <div className={styles.actionCard}>
            <h3 className={styles.cardTitle}>Command Terminal</h3>
            <div className={styles.actionButtons}>
              
              {merchant.status === 'pending' && (
                <>
                  <button className={`${styles.btnAction} ${styles.btnApprove}`} disabled={actionLoading} onClick={() => updateStatus('approved', true)}>
                    {actionLoading ? 'UPDATING...' : 'Authorize Entity'}
                  </button>
                  <button className={`${styles.btnAction} ${styles.btnReject}`} disabled={actionLoading} onClick={() => updateStatus('rejected')}>
                    Terminate Application
                  </button>
                </>
              )}

              {merchant.status === 'approved' && (
                <button className={`${styles.btnAction} ${styles.btnSuspend}`} disabled={actionLoading} onClick={() => updateStatus('suspended')}>
                  Suspend Access
                </button>
              )}

              {(merchant.status === 'suspended' || merchant.status === 'rejected') && (
                <button className={`${styles.btnAction} ${styles.btnApprove}`} disabled={actionLoading} onClick={() => updateStatus('approved')}>
                  Reinstate Entity
                </button>
              )}

            </div>
          </div>

          <div className={`${styles.card} ${styles.fiscalCard}`}>
            <h3 className={styles.cardTitle}>Fiscal Stream</h3>
            <div className={styles.payoutGrid}>
              <div className={styles.payoutItem}>
                <strong>Method</strong>
                <span>{merchant.payout_method?.replace('_', ' ').toUpperCase()}</span>
              </div>
              {merchant.payout_method === 'bank_transfer' && merchant.bank_details && (
                <>
                   <div className={styles.payoutItem}>
                    <strong>Bank</strong>
                    <span>{merchant.bank_details.bank_name}</span>
                  </div>
                  <div className={styles.payoutItem}>
                    <strong>Account</strong>
                    <span>{merchant.bank_details.account_number}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

