import { createClient } from '@/lib/supabase/client';

/**
 * Admin mark-collected — uses `admin_collect_order` RPC only.
 */
export async function adminCollectOrder(orderId) {
  const supabase = createClient();
  const { error: rpcError } = await supabase.rpc('admin_collect_order', {
    p_order_id: orderId,
  });

  if (rpcError) {
    const rpcMissing =
      rpcError.code === 'PGRST202' ||
      /admin_collect_order/i.test(rpcError.message ?? '');
    if (rpcMissing) {
      return {
        ok: false,
        message: 'admin_collect_order is not available on this project. Apply the admin_collect_order migration.',
      };
    }
    return { ok: false, message: rpcError.message };
  }

  return { ok: true };
}
