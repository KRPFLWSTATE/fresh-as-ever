'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from './useMerchantContext';

export function useMerchantFinance() {
  const [summary, setSummary] = useState({
    pending: 'Rs. 0',
    available: 'Rs. 0',
    lifetime: 'Rs. 0'
  });

  const [history, setHistory] = useState([
    { id: 'PO-2023-11', date: 'Oct 15, 2023', amount: 'Rs. 32,400', status: 'completed' },
    { id: 'PO-2023-10', date: 'Oct 08, 2023', amount: 'Rs. 28,600', status: 'completed' },
    { id: 'PO-2023-09', date: 'Oct 01, 2023', amount: 'Rs. 31,200', status: 'completed' },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, loading: contextLoading } = useMerchantContext();

  const fetchFinanceData = useCallback(async () => {
    if (!activeOutlet?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, payment_status, order_status')
        .eq('outlet_id', activeOutlet.id);

      if (ordersError) throw ordersError;

      const validOrders = orders.filter(
        o => o.payment_status === 'paid' || o.order_status === 'collected'
      );

      const lifetimeSum = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
      
      // For now, we mock the split between pending and available
      // In a real system, this would be based on payout records.
      const availableSum = lifetimeSum; 
      const pendingSum = 0;

      setSummary({
        pending: `Rs. ${pendingSum.toLocaleString()}`,
        available: `Rs. ${availableSum.toLocaleString()}`,
        lifetime: `Rs. ${lifetimeSum.toLocaleString()}`
      });

    } catch (err) {
      console.error('Fetch finance error:', err);
      setError('Could not load finance data.');
    } finally {
      setLoading(false);
    }
  }, [activeOutlet, supabase]);

  useEffect(() => {
    if (!contextLoading) {
      fetchFinanceData();
    }
  }, [fetchFinanceData, contextLoading]);

  const requestPayout = async () => {
    // Implement request payout logic here
    console.log('Payout requested');
  };

  return {
    summary,
    history,
    loading: loading || contextLoading,
    error,
    requestPayout,
    refetch: fetchFinanceData
  };
}
