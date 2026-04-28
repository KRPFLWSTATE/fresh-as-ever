'use client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Help & Support</h1>
      </header>

      <div className={styles.contentCard}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🤝</span>
          <h3 className={styles.emptyTitle}>Support Center</h3>
          <p className={styles.emptyText}>Need help? Our support team is ready to assist you.</p>
          <button className={styles.backHomeBtn} onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    </div>
  );
}