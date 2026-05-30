export const ANALYTICS_WINDOW_OPTIONS = [
  { key: 7, label: 'Last 7 days' },
  { key: 30, label: 'Last 30 days' },
  { key: 90, label: 'Last 90 days' },
];

const COLLECTED = new Set(['collected', 'completed']);

export function cutoffIsoForWindow(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function aggregateHourBuckets(rows) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const row of rows) {
    const ts = row.created_at ? new Date(row.created_at) : null;
    if (!ts || Number.isNaN(ts.getTime())) continue;
    buckets[ts.getHours()].count += 1;
  }
  return buckets;
}

export function countDistinctCustomers(rows) {
  const ids = new Set();
  for (const row of rows) {
    if (row.customer_id) ids.add(String(row.customer_id));
  }
  return ids.size;
}

export function sumRevenue(rows) {
  return rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
}

export function sumSurplusRecovered(rows) {
  let total = 0;
  for (const row of rows) {
    const retail = Number(row.bag?.retail_value_estimate ?? 0);
    if (!Number.isFinite(retail) || retail <= 0) continue;
    const qty = Math.max(1, Number(row.quantity ?? 1) || 1);
    total += retail * qty;
  }
  return Math.round(total);
}

export function retailToKgProxy(retail) {
  const r = Number(retail ?? 0);
  if (!Number.isFinite(r) || r <= 0) return 1;
  return Math.max(0.5, Math.round((r / 800) * 10) / 10);
}

export function estimateWasteKg(orders, bagWeightById) {
  let kg = 0;
  for (const o of orders) {
    const bagId = o.bag_id != null ? String(o.bag_id) : '';
    const qty = Number(o.quantity ?? 1) || 1;
    kg += (bagWeightById.get(bagId) ?? 1) * qty;
  }
  return Math.round(kg * 10) / 10;
}

export function aggregateTopBags(rows, limit = 5) {
  const map = new Map();
  for (const row of rows) {
    const bagId = row.bag_id != null ? String(row.bag_id) : '';
    if (!bagId) continue;
    const qty = Number(row.quantity ?? 1) || 1;
    const rev = Number(row.total ?? 0);
    const title = row.bag?.title?.trim() || 'Rescue bag';
    const cur = map.get(bagId) ?? { bagId, title, units: 0, revenue: 0 };
    cur.units += qty;
    cur.revenue += rev;
    map.set(bagId, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, limit);
}

export function isCollectedOrder(status) {
  return COLLECTED.has(String(status ?? '').toLowerCase());
}

export function formatLkr(n) {
  return `LKR ${Math.round(n).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

export function peakHourLabel(buckets) {
  const peak = buckets.reduce(
    (best, b) => (b.count > best.count ? b : best),
    buckets[0] ?? { hour: 0, count: 0 },
  );
  const fmt = (x) => {
    const h = x % 24;
    return `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`;
  };
  return `${fmt(peak.hour)}–${fmt((peak.hour + 1) % 24)}`;
}
