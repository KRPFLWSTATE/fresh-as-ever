'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function PaymentsPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Payment Methods</h1>
      </header>

      <div className={styles.contentCard}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>💳</span>
          <h3 className={styles.emptyTitle}>Payment Methods</h3>
          <p className={styles.emptyText}>Add your payment methods for faster checkout.</p>
          <button className={styles.backHomeBtn} onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    </div>
  );
}