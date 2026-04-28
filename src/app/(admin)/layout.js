'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './layout.module.css';

function DarkKineticSkeleton() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner} />
    </div>
  );
}

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📈' },
    { name: 'Merchants', href: '/admin/merchants', icon: '🏪' },
    { name: 'Orders', href: '/admin/orders', icon: '📋' },
    { name: 'Complaints', href: '/admin/complaints', icon: '⚠️' },
    { name: 'Settlements', href: '/admin/settlements', icon: '💸' },
    { name: 'Promo Codes', href: '/admin/promos', icon: '🎟️' },
  ];

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar / Mobile Top Nav */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>Fresh As Ever</span>
          <span className={styles.badge}>Admin Panel</span>
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navText}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleSignOut}>
             Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <Suspense fallback={<DarkKineticSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
