import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USER_AGENT = 'FreshAsEver/1.0 (https://freshasever.com)';
const CACHE_TTL_DAYS = 30;
const BARCODE_RE = /^[0-9]{8,14}$/;

const ALLERGEN_MAP: Record<string, string> = {
  'en:gluten': 'Gluten',
  'en:milk': 'Dairy',
  'en:eggs': 'Egg',
  'en:nuts': 'Nuts',
  'en:peanuts': 'Peanuts',
  'en:soybeans': 'Soy',
  'en:sesame-seeds': 'Sesame',
  'en:fish': 'Fish',
  'en:crustaceans': 'Shellfish',
};

type ProductRow = {
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  allergens: string[];
  is_halal_hint: boolean | null;
  ingredients_summary: string | null;
  weight_grams: number | null;
  source: string;
};

function resolveServiceRoleKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (legacy) return legacy;
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')?.trim();
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      for (const key of ['service_role', 'SUPABASE_SERVICE_ROLE_KEY', 'service_role_key']) {
        const v = obj[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
  } catch {
    return raw;
  }
  return '';
}

function normalizeAllergens(tags: string[] | undefined): string[] {
  if (!tags?.length) return [];
  const out = new Set<string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    const mapped = ALLERGEN_MAP[key];
    if (mapped) out.add(mapped);
  }
  return [...out];
}

function halalFromLabels(labels: string[] | undefined): boolean | null {
  if (!labels?.length) return null;
  const hit = labels.some((l) => l.toLowerCase().includes('halal'));
  return hit ? true : null;
}

function parseOffProduct(data: Record<string, unknown>, barcode: string, source: string): ProductRow | null {
  const status = data.status as number | undefined;
  if (status === 0) return null;
  const product = (data.product ?? data) as Record<string, unknown>;
  const name = String(product.product_name ?? product.product_name_en ?? '').trim();
  if (!name) return null;
  const brand = product.brands ? String(product.brands).split(',')[0].trim() : null;
  const allergensTags = product.allergens_tags as string[] | undefined;
  const labelsTags = product.labels_tags as string[] | undefined;
  const image =
    (product.image_front_url as string) ||
    (product.image_url as string) ||
    null;
  const quantity = product.quantity ? String(product.quantity) : null;
  let weightGrams: number | null = null;
  if (typeof product.product_quantity === 'number') {
    weightGrams = product.product_quantity as number;
  }

  return {
    barcode,
    name,
    brand,
    category: product.categories ? String(product.categories).split(',')[0] : null,
    image_url: image,
    allergens: normalizeAllergens(allergensTags),
    is_halal_hint: halalFromLabels(labelsTags),
    ingredients_summary: product.ingredients_text
      ? String(product.ingredients_text).slice(0, 500)
      : null,
    weight_grams: weightGrams,
    source,
  };
}

async function fetchOff(barcode: string, baseUrl: string, source: string): Promise<ProductRow | null> {
  const url = `${baseUrl}/api/v2/product/${barcode}.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (res.status === 404) return null;
    if (res.status === 429) throw new Error('upstream_rate_limited');
    if (!res.ok) throw new Error(`upstream_error:${source}:${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    return parseOffProduct(data, barcode, source);
  } finally {
    clearTimeout(timeout);
  }
}

async function upsertCatalog(
  supabase: ReturnType<typeof createClient>,
  product: ProductRow,
): Promise<void> {
  const { data: existing } = await supabase
    .from('product_catalog')
    .select('lookup_count')
    .eq('barcode', product.barcode)
    .maybeSingle();

  const lookupCount = (existing?.lookup_count ?? 0) + 1;

  const { error } = await supabase.from('product_catalog').upsert(
    {
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      category: product.category,
      image_url: product.image_url,
      allergens: product.allergens,
      is_halal_hint: product.is_halal_hint,
      ingredients_summary: product.ingredients_summary,
      weight_grams: product.weight_grams,
      source: product.source,
      last_seen_at: new Date().toISOString(),
      lookup_count: lookupCount,
      updated_at: new Date().toISOString(),
      is_disabled: false,
    },
    { onConflict: 'barcode' },
  );
  if (error) {
    console.warn(
      JSON.stringify({ event: 'catalog_upsert_failed', barcode: product.barcode, error: error.message }),
    );
  }
}

async function bumpLookup(supabase: ReturnType<typeof createClient>, barcode: string): Promise<void> {
  const { data } = await supabase
    .from('product_catalog')
    .select('lookup_count')
    .eq('barcode', barcode)
    .maybeSingle();
  const next = (data?.lookup_count ?? 0) + 1;
  await supabase
    .from('product_catalog')
    .update({ lookup_count: next, last_seen_at: new Date().toISOString() })
    .eq('barcode', barcode);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const started = Date.now();
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'authentication_required' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = resolveServiceRoleKey();

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: 'authentication_required' }, 401);
    }

    const { data: staffRow } = await userClient
      .from('merchant_staff')
      .select('id')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle();

    if (!staffRow) {
      return json({ error: 'not_a_merchant' }, 403);
    }

    const body = (await req.json()) as { barcode?: string };
    const barcode = String(body.barcode ?? '').trim();
    if (!BARCODE_RE.test(barcode)) {
      return json({ error: 'invalid_barcode' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey || anonKey);

    const { data: cached } = await admin
      .from('product_catalog')
      .select('*')
      .eq('barcode', barcode)
      .eq('is_disabled', false)
      .maybeSingle();

    if (cached) {
      const ageMs = Date.now() - new Date(cached.last_seen_at).getTime();
      const fresh = ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
      void bumpLookup(admin, barcode);
      log('cache_hit', barcode, 'cache', Date.now() - started, fresh);
      return json({
        product: cached,
        source: 'cache',
        stale: !fresh,
      });
    }

    let product: ProductRow | null = null;
    let source = 'openfoodfacts';

    try {
      product = await fetchOff(barcode, 'https://world.openfoodfacts.org', 'openfoodfacts');
    } catch (e) {
      const msg = String(e);
      if (msg.includes('upstream_rate_limited')) {
        return json({ error: 'upstream_rate_limited' }, 429);
      }
      log('off_error', barcode, 'openfoodfacts', Date.now() - started, false, msg);
    }

    if (!product) {
      try {
        product = await fetchOff(barcode, 'https://world.openproductsfacts.org', 'openproductsfacts');
        source = 'openproductsfacts';
      } catch (e) {
        const msg = String(e);
        if (msg.includes('upstream_rate_limited')) {
          return json({ error: 'upstream_rate_limited' }, 429);
        }
        log('opf_error', barcode, 'openproductsfacts', Date.now() - started, false, msg);
      }
    }

    if (!product) {
      log('not_found', barcode, 'none', Date.now() - started, false);
      return json({ error: 'not_found', hint: 'manual_entry' }, 404);
    }

    product.source = source;
    void upsertCatalog(admin, product);
    log('upstream_hit', barcode, source, Date.now() - started, true);
    return json({ product, source });
  } catch (err) {
    console.error(JSON.stringify({ event: 'lookup_fatal', error: String(err) }));
    return json({ error: 'internal_error' }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function log(
  event: string,
  barcode: string,
  source: string,
  latency_ms: number,
  ok: boolean,
  detail?: string,
) {
  console.log(
    JSON.stringify({ event, barcode, source, latency_ms, status: ok ? 'ok' : 'error', detail }),
  );
}
