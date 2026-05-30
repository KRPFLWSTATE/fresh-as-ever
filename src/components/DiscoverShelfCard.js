'use client';

import Link from 'next/link';
import { Clock, MapPin } from '@phosphor-icons/react';
import { OutletTrustBadge } from '@/components/OutletTrustBadge';
import { formatPickupRangeLabel, formatDistanceAwayLabel } from '@/lib/utils';

export function DiscoverShelfCard({ item, userLat, userLng }) {
  const outletName = item.outlet_name ?? item.merchant_name ?? 'Outlet';
  const distanceLabel =
    userLat != null && userLng != null
      ? formatDistanceAwayLabel(userLat, userLng, item.outlet_lat, item.outlet_lng)
      : null;
  const thumb = item.thumbnails?.[0];

  return (
    <Link href={`/shelves/${item.id}`} className="block group">
      <article className="bg-surface rounded-2xl border border-divider shadow-elevation-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-elevation-lg hover:border-primary/20 group-hover:-translate-y-1 h-full">
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-2 flex">
          {item.thumbnails?.length > 0 ? (
            item.thumbnails.slice(0, 3).map((src, i) => (
              <img
                key={src + i}
                alt=""
                className="flex-1 h-full object-cover border-r border-divider/30 last:border-0"
                src={src}
              />
            ))
          ) : (
            <div className="w-full h-full bg-surface-2" />
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-accent/90 text-white shadow-sm">
              Pick your own
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/90 text-primary shadow-sm backdrop-blur-md">
              Clearance shelf
            </span>
          </div>
          {item.itemCount > 0 ? (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-primary text-white shadow-lg">
                {item.itemCount} item{item.itemCount === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-xl flex flex-col flex-1 gap-sm">
          <div className="space-y-1">
            <p className="font-label-caps text-xs text-text-faint">{outletName}</p>
            <div className="pt-1">
              <OutletTrustBadge
                size="sm"
                trustScore={item.trust_score}
                averageRating={item.average_rating}
                totalReviews={item.total_reviews}
              />
            </div>
            <h3 className="font-h3 text-h3 text-text line-clamp-1 group-hover:text-primary transition-colors">
              Today&apos;s clearance shelf
            </h3>
            {item.previewItemNames?.length > 0 ? (
              <p className="text-sm text-text-muted line-clamp-2">
                {item.previewItemNames.join(' · ')}
              </p>
            ) : null}
            {item.savingsPercentMin != null && item.savingsPercentMax != null ? (
              <p className="text-sm text-secondary font-medium">
                {item.savingsPercentMin === item.savingsPercentMax
                  ? `Save up to ${item.savingsPercentMax}%`
                  : `Save ${item.savingsPercentMin}–${item.savingsPercentMax}%`}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-text-muted font-body-sm py-1">
            <Clock size={18} weight="bold" className="text-primary/60" />
            <span className="line-clamp-2">
              Pickup:{' '}
              {formatPickupRangeLabel(item.pickup_start, item.pickup_end) ||
                'See shelf for times'}
            </span>
          </div>

          {distanceLabel ? (
            <div className="flex items-center gap-2 text-text-muted font-body-sm">
              <MapPin size={18} weight="bold" className="text-primary/60 shrink-0" />
              <span>{distanceLabel}</span>
            </div>
          ) : null}

          <div className="flex justify-between items-end mt-auto pt-4 border-t border-divider/50 gap-2">
            <div className="flex flex-col">
              <span className="font-label text-xs text-text-muted">From</span>
              <span className="font-price text-2xl text-accent">
                LKR {Math.round(item.minPrice ?? 0).toLocaleString('en-LK')}
              </span>
            </div>
            <span className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 font-label font-bold text-white">
              Browse shelf
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
