import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refundOrder } from '@/lib/orders/refundOrder';

function bearerFromRequest(request) {
  const auth = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const accessToken = bearerFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const {
      data: { user },
      error: authErr,
    } = await userClient.auth.getUser();
    if (authErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { order_id: orderId, complaint_id: complaintId, reason } = body ?? {};
    if (!orderId) {
      return NextResponse.json({ error: 'order_id required' }, { status: 400 });
    }

    const { data: profile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = String(profile?.role ?? '').toLowerCase();

    const adminSb = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderErr } = await adminSb
      .from('orders')
      .select('id, outlet_id, payment_status')
      .eq('id', orderId)
      .maybeSingle();
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let actorRole = null;
    if (role === 'admin') {
      actorRole = 'admin';
    } else {
      const { data: merchantRow } = await adminSb
        .from('merchants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      let allowed = false;
      if (merchantRow?.id) {
        const { data: outlet } = await adminSb
          .from('outlets')
          .select('id')
          .eq('id', order.outlet_id)
          .eq('merchant_id', merchantRow.id)
          .maybeSingle();
        allowed = Boolean(outlet);
      }
      if (!allowed) {
        const { data: staff } = await adminSb
          .from('merchant_staff')
          .select('merchant_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (staff?.merchant_id) {
          const { data: outlet } = await adminSb
            .from('outlets')
            .select('id')
            .eq('id', order.outlet_id)
            .eq('merchant_id', staff.merchant_id)
            .maybeSingle();
          allowed = Boolean(outlet);
        }
      }
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      actorRole = 'merchant';
    }

    const result = await refundOrder(adminSb, {
      orderId: String(orderId),
      complaintId: complaintId ? String(complaintId) : undefined,
      reason: String(reason ?? '').trim() || 'Refund via Fresh As Ever',
      actorRole,
      actorUserId: user.id,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, alreadyRefunded: Boolean(result.alreadyRefunded) });
  } catch (err) {
    console.error('Refund API error:', err);
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}
