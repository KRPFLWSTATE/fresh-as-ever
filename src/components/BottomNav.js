'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Receipt, Heart, User } from '@phosphor-icons/react';

const navItems = [
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/orders', icon: Receipt, label: 'Orders' },
  { href: '/favourites', icon: Heart, label: 'Favourites' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const hideBottomNav =
    pathname?.startsWith('/bags/') ||
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/orders/');

  if (hideBottomNav) return null;

  return (
    <nav className="bg-surface/95 backdrop-blur-xl border-t border-divider shadow-elevation-lg fixed bottom-0 left-0 w-full h-16 z-50 flex justify-around items-center pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/discover' && pathname?.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 transition-all duration-200 active:scale-90 ${
              isActive
                ? 'text-primary scale-105'
                : 'text-text-faint'
            }`}
          >
            <Icon 
              size={24} 
              weight={isActive ? "fill" : "bold"} 
              className="mb-0.5"
            />
            <span className="font-label text-[10px] font-bold tracking-tight uppercase">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
