'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';
import { issueComplaintRefund, patchComplaintStatus } from '@/lib/adminComplaintActions';

export default function AdminComplaintDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const sb = createClient();
    const { data, error: e } = await sb
      .from('complaints')
      .select(
        `
        id, type, description, status, photos, created_at, order_id, resolution, admin_notes,
        order:orders(id, reservation_code, total, payment_status),
        reporter:profiles!complaints_reporter_id_fkey(full_name, email)
      `,
      )
      .eq('id', id)
      .maybeSingle();
    if (e) {
      setError(mapSupabaseError(e));
      setRow(null);
    } else {
      setRow(data);
      setResolution(data?.resolution ?? '');
      setAdminNotes(data?.admin_notes ?? '');
      setError(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const runAction = async (fn) => {
    setBusy(true);
    setError(null);
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    const result = await fn(sb, user?.id ?? null);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleRefund = async () => {
    if (!row?.order_id) return;
    if (!window.confirm('Refund this order and mark the complaint resolved?')) return;
    await runAction((sb, userId) =>
      issueComplaintRefund(sb, {
        complaintId: id,
        orderId: row.order_id,
        resolution,
        userId,
      }),
    );
  };

  if (loading) return <main className="p-8">Loading…</main>;
  if (!row) return <main className="p-8">{error || 'Complaint not found.'}</main>;

  const photos = Array.isArray(row.photos) ? row.photos : [];

  return (
    <main className="max-w-3xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg">
      <Link href="/admin/complaints" className="font-label text-primary font-bold">
        ← Back to complaints
      </Link>
      <h1 className="font-display text-h1 text-text">Complaint {String(row.id).slice(0, 8)}</h1>
      <p className="font-body-md text-text-muted">{row.description}</p>
      <p className="font-label text-sm">
        Status: <strong>{row.status}</strong> · Reporter: {row.reporter?.full_name ?? '—'}
      </p>
      {row.order ? (
        <p className="font-body-sm text-text-muted">
          Order {row.order.reservation_code ?? row.order_id} · LKR {Number(row.order.total ?? 0).toLocaleString()} ·{' '}
          {row.order.payment_status}
        </p>
      ) : (
        <p className="font-body-sm text-text-muted">No order linked to this complaint.</p>
      )}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-md">
          {photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="Evidence" className="rounded-xl border border-divider w-full h-40 object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="font-body-sm text-text-muted">No photos attached.</p>
      )}
      <label className="block font-label text-xs font-bold text-text-muted uppercase tracking-widest">
        Resolution
      </label>
      <textarea
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="Resolution summary for the customer and merchant…"
        className="w-full border border-divider rounded-xl p-md font-body-md min-h-[80px]"
      />
      <label className="block font-label text-xs font-bold text-text-muted uppercase tracking-widest">
        Admin notes (internal)
      </label>
      <textarea
        value={adminNotes}
        onChange={(e) => setAdminNotes(e.target.value)}
        placeholder="Internal notes for the ops team…"
        className="w-full border border-divider rounded-xl p-md font-body-md min-h-[80px]"
      />
      {error ? <p className="text-error font-body-sm">{error}</p> : null}
      <div className="flex flex-wrap gap-md">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void runAction((sb, userId) =>
              patchComplaintStatus(sb, {
                complaintId: id,
                status: 'resolved',
                resolution: resolution || 'Resolved in-app',
                adminNotes,
                userId,
              }),
            );
          }}
          className="px-6 py-3 bg-primary text-white rounded-xl font-label font-bold disabled:opacity-50"
        >
          Mark resolved
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void runAction((sb, userId) =>
              patchComplaintStatus(sb, {
                complaintId: id,
                status: 'escalated',
                resolution,
                adminNotes,
                userId,
              }),
            );
          }}
          className="px-6 py-3 bg-accent text-white rounded-xl font-label font-bold disabled:opacity-50"
        >
          Escalate
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void runAction((sb, userId) =>
              patchComplaintStatus(sb, {
                complaintId: id,
                status: 'dismissed',
                resolution: resolution || 'Dismissed',
                adminNotes,
                userId,
              }),
            );
          }}
          className="px-6 py-3 bg-surface-2 text-text border border-divider rounded-xl font-label font-bold disabled:opacity-50"
        >
          Dismiss
        </button>
        <button
          type="button"
          disabled={busy || !row.order_id}
          onClick={() => void handleRefund()}
          className="px-6 py-3 bg-error text-white rounded-xl font-label font-bold disabled:opacity-50"
        >
          Issue refund
        </button>
      </div>
    </main>
  );
}
