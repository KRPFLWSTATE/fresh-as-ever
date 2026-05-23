import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function bearerFromRequest(request) {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = auth.slice(7).trim();
  return token || null;
}

/**
 * POST /api/payhere/hash
 * Requires Authorization: Bearer <supabase_access_token>.
 * Validates order ownership, amount (2 d.p. LKR-style), and payable state before returning PayHERE MD5 hash.
 */
export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const accessToken = bearerFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { order_id, amount, currency: currencyRaw = 'LKR' } = body ?? {};
    const currency = String(currencyRaw).toUpperCase();
    if (order_id == null || String(order_id).trim() === '') {
      return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    }
    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'amount required' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    const formattedAmount = parsedAmount.toFixed(2);

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, customer_id, total, payment_status, order_status')
      .eq('id', order_id)
      .maybeSingle();

    if (orderErr) {
      console.error('PayHere hash order fetch:', orderErr);
      return NextResponse.json({ error: 'Order lookup failed' }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (String(order.customer_id) !== String(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const storedTotal = Number(order.total);
    if (!Number.isFinite(storedTotal)) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 500 });
    }
    if (storedTotal.toFixed(2) !== formattedAmount) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 403 });
    }

    const payStatus = String(order.payment_status ?? '').toLowerCase();
    const ordStatus = String(order.order_status ?? '').toLowerCase();
    if (payStatus !== 'pending' || ordStatus !== 'reserved') {
      return NextResponse.json({ error: 'Order not payable' }, { status: 403 });
    }

    if (currency !== 'LKR') {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
    }

    const merchant_id =
      process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || process.env.PAYHERE_MERCHANT_ID;
    const original_secret = process.env.PAYHERE_SECRET || process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchant_id || !original_secret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const hashedsecret = crypto.createHash('md5').update(original_secret).digest('hex').toUpperCase();
    const hashString = merchant_id + String(order_id) + formattedAmount + currency + hashedsecret;
    const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

    return NextResponse.json({ hash, merchant_id, currency, amount: formattedAmount });
  } catch (err) {
    console.error('Error generating hash:', err);
    return NextResponse.json({ error: 'Failed to generate hash' }, { status: 500 });
  }
}
