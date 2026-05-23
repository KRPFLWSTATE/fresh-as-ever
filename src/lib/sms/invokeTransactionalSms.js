/**
 * Invoke Supabase Edge Function send-transactional-sms (service role).
 */
export async function invokeTransactionalSms({
  userId,
  template,
  orderId,
  payload,
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { skipped: true, reason: 'missing_config' };
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/send-transactional-sms`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, template, orderId, payload }),
    });
    if (!res.ok) {
      console.error('SMS invoke failed', await res.text());
      return { error: 'sms_failed' };
    }
    return { ok: true };
  } catch (e) {
    console.error('SMS invoke error', e);
    return { error: 'sms_failed' };
  }
}
