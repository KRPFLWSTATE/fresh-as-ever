'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function MerchantSettingsPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Store Settings</h1>
      </header>

      <div className={styles.contentCard}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>⚙️</span>
          <h3 className={styles.emptyTitle}>Advanced Settings</h3>
          <p className={styles.emptyText}>Location and notification settings are currently locked.</p>
          <button className={styles.goBackBtn} onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    </div>
  );
}