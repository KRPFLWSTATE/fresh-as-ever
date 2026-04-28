'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Compass, ShoppingBag, Heart, User } from '@phosphor-icons/react';
import styles from './layout.module.css';

function KineticSkeleton() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner} />
    </div>
  );
}

const navItems = [
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Favourites', href: '/favourites', icon: Heart },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function CustomerLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        <Suspense fallback={<KineticSkeleton />}>
          {children}
        </Suspense>
      </main>

      <nav className={styles.bottomNav} aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.navIcon}>
                <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
              </span>
              <span className={styles.navText}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}