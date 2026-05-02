'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChatCenteredDots, WarningCircle, CheckCircle, Funnel, MagnifyingGlass } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantContext } from '@/hooks/useMerchantContext';

export default function MerchantDisputesPage() {
  const supabase = useMemo(() => createClient(), []);
  const { activeOutlet, loading: merchantLoading } = useMerchantContext();
  const [query, setQuery] = useState('');
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadDisputes = async () => {
      if (!activeOutlet?.id) {
        if (!merchantLoading) {
          setDisputes([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            reservation_code,
            order_status,
            created_at,
            updated_at,
            customer:profiles(full_name)
          `)
          .eq('outlet_id', activeOutlet.id)
          .order('updated_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const mapped = (data || [])
          .filter((order) => ['cancelled', 'refunded', 'collected', 'ready_for_pickup', 'reserved'].includes(order.order_status))
          .slice(0, 12)
          .map((order) => {
            let status = 'open';
            let reason = 'Customer reported pickup issue';
            if (order.order_status === 'refunded' || order.order_status === 'cancelled') {
              status = 'resolved';
              reason = 'Refund/cancellation dispute completed';
            } else if (order.order_status === 'collected') {
              status = 'resolved';
              reason = 'Collection mismatch inquiry resolved';
            } else if (order.order_status === 'ready_for_pickup') {
              status = 'investigating';
              reason = 'Pickup confirmation discrepancy under review';
            }

            return {
              orderId: order.id,
              id: `DSP-${String(order.id).slice(0, 6).toUpperCase()}`,
              order: `#${order.reservation_code || String(order.id).slice(0, 8).toUpperCase()}`,
              reason,
              status,
              updated: new Date(order.updated_at || order.created_at).toLocaleString(),
              customer: order.customer?.full_name || 'Customer',
            };
          });

        setDisputes(mapped);
      } catch (_err) {
        setDisputes([]);
      } finally {
        setLoading(false);
      }
    };

    loadDisputes();
  }, [activeOutlet?.id, merchantLoading, supabase]);

  const visibleDisputes = disputes.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.order.toLowerCase().includes(q) ||
      item.reason.toLowerCase().includes(q) ||
      item.customer.toLowerCase().includes(q)
    );
  });

  const resolveDispute = async (orderId) => {
    try {
      setUpdatingId(orderId);
      setNotice('');
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'collected', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('outlet_id', activeOutlet?.id);

      if (error) throw error;

      setDisputes((prev) =>
        prev.map((item) =>
          item.orderId === orderId ? { ...item, status: 'resolved', reason: 'Collection mismatch inquiry resolved', updated: new Date().toLocaleString() } : item
        )
      );
      setNotice('Dispute marked as resolved.');
    } catch (_err) {
      setNotice('Could not resolve dispute right now.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Operations</p>
          <h1 className="font-display text-h1 text-text">Disputes</h1>
        </div>
        <div className="flex items-center gap-sm w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search dispute ID or order..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-surface border border-divider rounded-xl py-2.5 pl-10 pr-4 font-body-md focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button className="h-10 px-3 rounded-xl bg-surface border border-divider text-text-muted hover:text-primary">
            <Funnel size={18} weight="bold" />
          </button>
        </div>
      </header>

      <section className="bg-surface rounded-2xl border border-divider shadow-elevation-sm divide-y divide-divider overflow-hidden">
        {notice ? (
          <article className="p-md md:p-lg bg-surface-2">
            <p className="font-body-sm text-text-muted">{notice}</p>
          </article>
        ) : null}
        {loading && (
          <article className="p-md md:p-lg">
            <p className="font-body-sm text-text-muted">Loading disputes...</p>
          </article>
        )}
        {!loading && visibleDisputes.length === 0 && (
          <article className="p-md md:p-lg">
            <p className="font-body-sm text-text-muted">No disputes found for this outlet yet.</p>
          </article>
        )}
        {!loading && visibleDisputes.map((item) => (
          <article key={item.id} className="p-md md:p-lg flex items-start gap-md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              item.status === 'resolved' ? 'bg-success/10 text-success' : item.status === 'investigating' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
            }`}>
              {item.status === 'resolved' ? <CheckCircle size={20} weight="fill" /> : item.status === 'investigating' ? <ChatCenteredDots size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-label text-text font-bold">{item.reason}</p>
              <p className="font-body-sm text-text-muted">{item.id} • {item.order}</p>
            </div>
            <div className="text-right space-y-2">
              <p className="font-label-caps text-[10px] text-text-faint uppercase">{item.status}</p>
              <p className="font-body-sm text-text-muted">{item.updated}</p>
              {item.status !== 'resolved' ? (
                <button
                  onClick={() => resolveDispute(item.orderId)}
                  disabled={updatingId === item.orderId}
                  className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-bold disabled:bg-divider disabled:cursor-not-allowed"
                >
                  {updatingId === item.orderId ? 'Resolving...' : 'Resolve'}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
