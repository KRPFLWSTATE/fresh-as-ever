import styles from './layout.module.css';
import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🌿</span> Fresh As Ever
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.formContainer}>
          {children}
        </div>
      </main>
    </div>
  );
}
