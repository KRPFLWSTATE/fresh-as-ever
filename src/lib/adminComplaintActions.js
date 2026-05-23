import { postOrderRefundClient } from '@/lib/orders/refundApiClient';

/**
 * Issue refund via hosted API (PayHere + DB).
 */
export async function issueComplaintRefund(_sb, { complaintId, orderId, resolution }) {
  if (!orderId) {
    return { error: 'This complaint is not tied to an order.' };
  }

  const result = await postOrderRefundClient({
    orderId,
    complaintId,
    reason: resolution?.trim() || 'Admin refund via complaint resolution',
  });
  if (result.error) {
    return { error: result.error };
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
