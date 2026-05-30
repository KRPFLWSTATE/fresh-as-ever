'use client';

import { useState } from 'react';
import { Star, Info } from '@phosphor-icons/react';
import { formatTrustScoreLabel } from '@/lib/outletTrust';
import styles from './OutletTrustBadge.module.css';

/**
 * @param {{
 *   trustScore?: number | null;
 *   averageRating?: number | null;
 *   totalReviews?: number | null;
 *   collectionRatePct?: number | null;
 *   complaintRatePct?: number | null;
 *   noShowRatePct?: number | null;
 *   size?: 'sm' | 'md';
 *   showInfo?: boolean;
 * }} props
 */
export function OutletTrustBadge({
  trustScore,
  averageRating,
  totalReviews,
  collectionRatePct,
  complaintRatePct,
  noShowRatePct,
  size = 'md',
  showInfo = true,
}) {
  const [open, setOpen] = useState(false);
  const label = formatTrustScoreLabel(trustScore);
  const isNew = trustScore == null || !Number.isFinite(Number(trustScore));
  const compact = size === 'sm';

  const pill = (
    <span className={`${styles.pill} ${compact ? styles.pillSm : ''}`} data-testid="outlet-trust-badge">
      <Star size={compact ? 14 : 16} weight={isNew ? 'regular' : 'fill'} className={styles.star} />
      <span className={styles.label}>{label}</span>
      {showInfo && !isNew ? <Info size={compact ? 12 : 14} className={styles.infoIcon} /> : null}
    </span>
  );

  if (!showInfo || isNew) {
    return pill;
  }

  return (
    <>
      <button
        type="button"
        className={styles.pillButton}
        aria-label="Outlet trust score details"
        onClick={() => setOpen(true)}
      >
        {pill}
      </button>
      {open ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setOpen(false)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-labelledby="trust-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="trust-title" className={styles.sheetTitle}>
              Outlet trust
            </h3>
            <p className={styles.sheetLead}>
              Based on the last 90 days of pickups, reviews, and complaints.
            </p>
            <dl className={styles.metrics}>
              <div>
                <dt>Trust score</dt>
                <dd>{label}</dd>
              </div>
              {averageRating != null && Number(averageRating) > 0 ? (
                <div>
                  <dt>Star average</dt>
                  <dd>
                    {Number(averageRating).toFixed(1)}
                    {totalReviews != null ? ` (${totalReviews} reviews)` : ''}
                  </dd>
                </div>
              ) : null}
              {collectionRatePct != null ? (
                <div>
                  <dt>Collection rate</dt>
                  <dd>{Number(collectionRatePct).toFixed(0)}%</dd>
                </div>
              ) : null}
              {noShowRatePct != null ? (
                <div>
                  <dt>No-show rate</dt>
                  <dd>{Number(noShowRatePct).toFixed(0)}%</dd>
                </div>
              ) : null}
              {complaintRatePct != null ? (
                <div>
                  <dt>Complaint rate</dt>
                  <dd>{Number(complaintRatePct).toFixed(0)}%</dd>
                </div>
              ) : null}
            </dl>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
