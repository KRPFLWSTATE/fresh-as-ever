'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function MerchantPayoutsPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Payouts</h1>
      </header>

      <div className={styles.contentCard}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏦</span>
          <h3 className={styles.emptyTitle}>Bank Payouts</h3>
          <p className={styles.emptyText}>Weekly payout history and bank configurations are arriving shortly.</p>
          <button className={styles.goBackBtn} onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    </div>
  );
}