import { createClient } from '@/lib/supabase/client';

/**
 * Issue refund via hosted API (PayHere + DB).
 */
export async function postOrderRefundClient({ orderId, complaintId, reason }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { error: 'Not signed in' };
  }
  const res = await fetch('/api/orders/refund', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      complaint_id: complaintId,
      reason,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.error || 'Refund failed' };
  }
  return { ok: true, alreadyRefunded: json.alreadyRefunded };
}
