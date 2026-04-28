'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from './layout.module.css';

function KineticSkeleton() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner} />
    </div>
  );
}

export default function MerchantLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/merchant/dashboard', icon: '📊' },
    { name: 'Bags', href: '/merchant/bags', icon: '🛍️' },
    { name: 'Orders', href: '/merchant/orders', icon: '📋' },
    { name: 'Finance', href: '/merchant/finance', icon: '💰' },
    { name: 'Profile', href: '/merchant/profile', icon: '👤' },
  ];

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        <Suspense fallback={<KineticSkeleton />}>
          {children}
        </Suspense>
      </main>

      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <div className={styles.navIcon}>{item.icon}</div>
              <div className={styles.navText}>{item.name}</div>
              <div className={styles.activeIndicator} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
