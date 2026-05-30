'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useShelfDetail } from '@/hooks/useShelfDetail';
import { isClearanceShelvesEnabled } from '@/lib/clearanceShelves';

export default function ClearanceShelfAllergensPage() {
  const { id } = useParams();
  const shelfId = Array.isArray(id) ? id[0] : id;
  const { shelf, loading, error } = useShelfDetail(shelfId);

  if (!isClearanceShelvesEnabled()) {
    return <div className="p-xl">Clearance shelves are not available.</div>;
  }

  if (loading) return <div className="p-xl">Loading allergens…</div>;
  if (error || !shelf) {
    return (
      <div className="p-xl space-y-md">
        <p>{error || 'Shelf not found.'}</p>
        <Link href="/discover">Back</Link>
      </div>
    );
  }

  const items = (shelf.items ?? []).filter((i) => i.status === 'live');

  return (
    <main className="max-w-2xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg pb-24">
      <Link href={`/shelves/${shelfId}`} className="text-sm text-primary">
        ← Shelf
      </Link>
      <h1 className="font-h1 text-h1">Allergens & dietary info</h1>
      <p className="text-text-muted text-sm">
        Item-level allergens from the merchant scan. Halal flags are hints only — confirm at pickup.
      </p>
      <ul className="divide-y divide-divider border border-divider rounded-xl">
        {items.map((item) => {
          const allergens = item.allergens_snapshot ?? [];
          return (
            <li key={item.id} className="p-md space-y-xs">
              <p className="font-semibold">{item.name_snapshot}</p>
              {item.is_halal === true ? (
                <p className="text-xs text-primary">Halal hint</p>
              ) : null}
              {allergens.length > 0 ? (
                <p className="text-sm text-text-muted">
                  Contains: {allergens.join(', ')}
                </p>
              ) : (
                <p className="text-sm text-text-muted">No allergens listed</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
