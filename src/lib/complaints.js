import { createClient } from '@/lib/supabase/client';
import { isOpenComplaintStatus } from '@/lib/adminComplaints';

export const CUSTOMER_COMPLAINT_TYPE_OPTIONS = [
  { value: 'quality', label: 'Quality or missing items' },
  { value: 'no_show_merchant', label: "Couldn't collect / outlet issue" },
  { value: 'other', label: 'Something else' },
];

export async function fetchCustomerComplaintForOrder(orderId, reporterId) {
  const sb = createClient();
  const { data, error } = await sb
    .from('complaints')
    .select('id, status, created_at')
    .eq('order_id', orderId)
    .eq('reporter_id', reporterId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: String(data.id),
    status: String(data.status ?? 'open'),
    created_at: data.created_at ?? null,
  };
}

export function customerCanReportProblem(orderStatus, existing) {
  const st = String(orderStatus ?? '').trim().toLowerCase();
  if (!['collected', 'disputed'].includes(st)) return false;
  if (!existing) return true;
  return !isOpenComplaintStatus(existing.status);
}

export async function uploadComplaintPhoto(orderId, userId, file) {
  const sb = createClient();
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/${orderId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage
    .from('complaint-images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data } = sb.storage.from('complaint-images').getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) throw new Error('Could not resolve photo URL.');
  return `${url}?t=${Date.now()}`;
}

export async function submitCustomerComplaint({
  orderId,
  reporterId,
  type,
  description,
  photoUrls = [],
}) {
  const trimmed = String(description ?? '').trim();
  if (trimmed.length < 10) {
    return { ok: false, message: 'Please describe the problem in at least 10 characters.' };
  }

  const sb = createClient();
  const { data, error } = await sb
    .from('complaints')
    .insert({
      order_id: orderId,
      reporter_id: reporterId,
      type,
      status: 'open',
      description: trimmed,
      photos: photoUrls.length > 0 ? photoUrls : null,
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, message: error.message || 'Could not submit your report.' };
  }

  return { ok: true, complaintId: String(data.id) };
}
