import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Invites a merchant staff member by email (service role).
 * POST { merchant_id, email, role? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const merchantId = String(body.merchant_id ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const role = String(body.role ?? 'staff').trim();

    if (!merchantId || !email.includes('@')) {
      return NextResponse.json({ error: 'merchant_id and valid email required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server not configured for invites' }, { status: 503 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { merchant_id: merchantId, staff_role: role },
    });

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 400 });
    }

    const { error: rowErr } = await admin.from('merchant_staff').upsert(
      {
        merchant_id: merchantId,
        invited_email: email,
        role,
        status: 'invited',
      },
      { onConflict: 'merchant_id,invited_email' },
    );

    if (rowErr) {
      return NextResponse.json({ error: rowErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message ?? 'Invite failed' }, { status: 500 });
  }
}
