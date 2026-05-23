/**
 * PayHere Refund API — server-side only.
 * Requires PAYHERE_APP_ID + PAYHERE_APP_SECRET (Business App with refund permission).
 */

function payhereApiBase() {
  const env = process.env.PAYHERE_ENVIRONMENT || process.env.PAYHERE_ENV || 'sandbox';
  if (env === 'production' || env === 'live') {
    return process.env.PAYHERE_API_BASE || 'https://www.payhere.lk';
  }
  return process.env.PAYHERE_API_BASE || 'https://sandbox.payhere.lk';
}

async function getAccessToken() {
  const appId = process.env.PAYHERE_APP_ID;
  const appSecret = process.env.PAYHERE_APP_SECRET;
  if (!appId || !appSecret) {
    return { error: 'PayHere app credentials not configured' };
  }
  const base = payhereApiBase();
  const res = await fetch(`${base}/merchant/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      app_id: appId,
      app_secret: appSecret,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    return { error: json.error_description || json.message || 'PayHere auth failed' };
  }
  return { token: json.access_token };
}

/**
 * @param {{ paymentId: string, description: string }} params
 */
export async function refundPayHerePayment({ paymentId, description }) {
  if (!paymentId) {
    return { error: 'Missing PayHere payment_id' };
  }
  const auth = await getAccessToken();
  if (auth.error) return { error: auth.error };

  const base = payhereApiBase();
  const res = await fetch(`${base}/payhere/api/payments/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({
      payment_id: paymentId,
      description: description.slice(0, 500),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.status === 1) {
    return { ok: true, data: json.data };
  }
  return { error: json.msg || json.message || 'PayHere refund failed' };
}
