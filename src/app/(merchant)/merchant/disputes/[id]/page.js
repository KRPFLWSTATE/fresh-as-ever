'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useMerchantComplaints } from '@/hooks/useMerchantComplaints';
import { postOrderRefundClient } from '@/lib/orders/refundApiClient';

export default function MerchantDisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { outletScopeIds } = useMerchantComplaints();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { data, error: qErr } = await sb
      .from('complaints')
      .select(
        `
        id, type, description, status, merchant_notes, photos, created_at,
        order:orders(id, reservation_code, total, outlet_id, outlet:outlets(name)),
        reporter:profiles!complaints_reporter_id_fkey(full_name)
      `,
      )
      .eq('id', id)
      .maybeSingle();

    if (qErr || !data) {
      setError(qErr?.message ?? 'Complaint not found');
      setComplaint(null);
      setLoading(false);
      return;
    }

    const order = data.order;
    const outletId = String(order?.outlet_id ?? '');
    if (outletScopeIds.length && !outletScopeIds.includes(outletId)) {
      setError('This complaint is not for one of your outlets.');
      setComplaint(null);
      setLoading(false);
      return;
    }

    setComplaint({
      ...data,
      orderLabel: order?.reservation_code ? `#${order.reservation_code}` : 'Order',
      orderTotal: Number(order?.total ?? 0),
      orderId: order?.id,
      outletName: order?.outlet?.name ?? 'Outlet',
      reporterName: data.reporter?.full_name ?? 'Customer',
    });
    setNote(String(data.merchant_notes ?? ''));
    setLoading(false);
  }, [id, outletScopeIds]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const escalate = async () => {
    if (!complaint) return;
    setBusy(true);
    const sb = createClient();
    const { error: upErr } = await sb
      .from('complaints')
      .update({ status: 'escalated', merchant_notes: note.trim() || null })
      .eq('id', complaint.id);
    setBusy(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    await load();
  };

  const refund = async () => {
    if (!complaint?.orderId) return;
    if (!window.confirm(`Refund Rs. ${complaint.orderTotal.toFixed(0)} to the customer?`)) return;
    setBusy(true);
    const result = await postOrderRefundClient({
      orderId: complaint.orderId,
      complaintId: complaint.id,
      reason: note.trim() || 'Merchant refund via dispute',
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await load();
  };

  const resolved = complaint && ['resolved', 'closed', 'dismissed'].includes(String(complaint.status).toLowerCase());

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="flex items-center gap-xl px-page-margin-mobile pt-4 mb-lg">
        <button
          type="button"
          onClick={() => router.push('/merchant/disputes')}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-divider hover:bg-surface-2 active:scale-90 transition-all text-primary shadow-elevation-sm"
        >
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-black text-text tracking-tight">Dispute detail</h1>
          <Link href="/merchant/disputes" className="font-body-sm text-primary">
            Back to list
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-page-margin-mobile py-lg space-y-md">
        {error && (
          <p className="font-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        {loading && <div className="bg-surface rounded-xl p-lg border border-divider animate-pulse h-32" />}
        {!loading && complaint && (
          <>
            <div className="bg-surface rounded-xl p-md border border-divider space-y-sm">
              <p className="font-h3 text-h3 text-text">{complaint.type}</p>
              <p className="font-body-sm text-text-muted">
                {complaint.outletName} · {complaint.orderLabel} · {complaint.reporterName}
              </p>
              <p className="font-label text-label text-text-muted">Status: {complaint.status}</p>
              <p className="font-body-md text-text mt-md">{complaint.description}</p>
              {Array.isArray(complaint.photos) && complaint.photos.length > 0 && (
                <div className="flex flex-wrap gap-sm mt-md">
                  {complaint.photos.map((url) => (
                    <img key={url} src={url} alt="Evidence" className="w-24 h-24 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface rounded-xl p-md border border-divider">
              <label htmlFor="merchant-note" className="font-label text-label text-text block mb-sm">
                Your response
              </label>
              <textarea
                id="merchant-note"
                className="w-full min-h-[88px] rounded-lg border border-divider bg-background p-md font-body-md text-text"
                value={note}
                disabled={resolved || busy}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {!resolved && (
              <div className="flex flex-col gap-sm">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void refund()}
                  className="w-full py-md rounded-xl bg-primary text-on-primary font-label disabled:opacity-50"
                >
                  Refund customer
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void escalate()}
                  className="w-full py-md rounded-xl border border-divider bg-surface font-label text-text disabled:opacity-50"
                >
                  Escalate to Fresh As Ever
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
