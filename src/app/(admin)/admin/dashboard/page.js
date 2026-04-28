'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

import styles from './page.module.css';

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({
    activeMerchants: 0,
    pendingMerchants: 0,
    totalUsers: 0,
    todayOrders: 0,
    todayRevenue: 0,
    openComplaints: 0
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      // Pulse platform substrates for aggregate data
      const [[merchantsData], [usersData], [ordersData], [complaintsData]] = await Promise.all([
        supabase.from('merchants').select('status'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
        supabase.from('orders').select('total, order_status, created_at').gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('complaints').select('id', { count: 'exact' }).eq('status', 'open')
      ]);

      const activeM = merchantsData.data?.filter(m => m.status === 'approved').length || 0;
      const pendingM = merchantsData.data?.filter(m => m.status === 'pending').length || 0;
      const todayTotal = ordersData.data?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;

      setStats({
        activeMerchants: activeM,
        pendingMerchants: pendingM,
        totalUsers: usersData.count || 0,
        todayOrders: ordersData.data?.length || 0,
        todayRevenue: todayTotal,
        openComplaints: complaintsData.count || 0
      });
    } catch (err) {
      console.error('Registry Overload Sync Failure:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboard();
    
    // Platform-wide Pulse Sync
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merchants' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => loadDashboard())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadDashboard, supabase]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingContent}>
            <h2 className={styles.loadingTitle}>CONNECTING TO REGISTRY OVERLORD</h2>
            <p className={styles.loadingSubtitle}>Synchronizing platform substrates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>REGISTRY OVERLORD</h1>
        <p>Operational Platform Substrates & Neural Metrics</p>
      </header>

      {/* KPI Matrix Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Approved Merchants</span>
          <div className={styles.kpiValue}>{stats.activeMerchants}</div>
        </div>
        <div className={`${styles.kpiCard} ${stats.pendingMerchants > 0 ? styles.warning : ''}`}>
          <span className={styles.kpiLabel}>Pending Registry Auth</span>
          <div className={styles.kpiValue}>{stats.pendingMerchants}</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Operational Customers</span>
          <div className={styles.kpiValue}>{stats.totalUsers}</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cycle Syncs (Today)</span>
          <div className={styles.kpiValue}>{stats.todayOrders}</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Current Cycle GMV</span>
          <div className={styles.kpiValue}>Rs. {stats.todayRevenue.toLocaleString()}</div>
        </div>
        <div className={`${styles.kpiCard} ${stats.openComplaints > 0 ? styles.danger : ''}`}>
          <span className={styles.kpiLabel}>Active Anomalies</span>
          <div className={styles.kpiValue}>{stats.openComplaints}</div>
        </div>
      </div>

      {/* Command Actions */}
      <h2 className={styles.actionsTitle}>Command Sequences</h2>
      <div className={styles.actionGrid}>
        <Link href="/admin/merchants" className={styles.actionCard}>
          <div>
            <h3>Review Gateway Applications</h3>
            <p>{stats.pendingMerchants} entities awaiting registry approval</p>
          </div>
          <span className={styles.actionArrow}>→</span>
        </Link>
        <Link href="/admin/complaints" className={styles.actionCard}>
          <div>
            <h3>Resolve Neural Anomalies</h3>
            <p>{stats.openComplaints} open registry issues</p>
          </div>
          <span className={styles.actionArrow}>→</span>
        </Link>
      </div>
    </div>
  );
}

