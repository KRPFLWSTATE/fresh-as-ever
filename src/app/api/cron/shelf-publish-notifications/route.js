import { NextResponse } from 'next/server';
import { invokeShelfPublishNotify } from '@/lib/push/invokeShelfPublishNotify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorizeCron(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;
  const vercel = request.headers.get('x-vercel-cron') ?? request.headers.get('X-Vercel-Cron');
  return vercel === '1' && Boolean(secret);
}

/**
 * Vercel Cron: process shelf_publish_notification_queue and fan out in-app + Expo push
 * to customers who favourited the outlet (respects profiles.notification_prefs.push).
 */
export async function GET(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await invokeShelfPublishNotify({ processQueue: true, limit: 20 });
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
