import { createClient } from '@/lib/supabase/client';

/** Re-seeds demo bags/shelves for the outlet's current listing mode after category changes. */
export async function ensureOutletDemoListings(outletId) {
  const id = String(outletId ?? '').trim();
  if (!id) return { error: 'Missing outlet id' };

  const supabase = createClient();
  const { error } = await supabase.rpc('ensure_outlet_demo_listings', { p_outlet_id: id });
  if (error) return { error: error.message };
  return {};
}
