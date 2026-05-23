import { createClient } from '@/lib/supabase/client';
import { mapSupabaseError } from '@/lib/supabaseError';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 */
export async function issueComplaintRefund(sb, { complaintId, orderId, resolution, userId }) {
  if (!orderId) {
    return { error: 'This complaint is not tied to an order.' };
  }

  const { error: orderErr } = await sb
    .from('orders')
    .update({
      order_status: 'cancelled',
      payment_status: 'refunded',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Admin refund via complaint resolution',
      cancelled_by: 'admin',
    })
    .eq('id', orderId);

  if (orderErr) {
    return { error: mapSupabaseError(orderErr, 'Refund failed.') };
  }

  const { error: complaintErr } = await sb
    .from('complaints')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId ?? null,
      resolution: resolution?.trim() || 'Refunded and cancelled',
    })
    .eq('id', complaintId);

  if (complaintErr) {
    return {
      error: mapSupabaseError(
        complaintErr,
        'Order refunded but complaint status could not be updated.',
      ),
    };
  }

  return { ok: true };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 */
export async function patchComplaintStatus(sb, { complaintId, status, resolution, adminNotes, userId }) {
  const patch = { status };
  if (resolution != null) patch.resolution = resolution;
  if (adminNotes != null) patch.admin_notes = adminNotes;
  if (status === 'resolved') {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by = userId ?? null;
  }
  if (status === 'dismissed') {
    patch.resolved_at = null;
    patch.resolved_by = null;
  }

  const { error } = await sb.from('complaints').update(patch).eq('id', complaintId);
  if (error) return { error: mapSupabaseError(error, 'Could not update complaint.') };
  return { ok: true };
}
