'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  SquaresFour, 
  Receipt, 
  ShoppingBag, 
  ChartBar, 
  Wallet, 
  Gear, 
  Storefront, 
  SignOut,
  House,
  User,
  Package
} from '@phosphor-icons/react';
import { useMerchantContext } from '@/hooks/useMerchantContext';
import { outletListingMode } from '@/lib/outletListingMode';
import { merchantInventoryVisibility } from '@/lib/merchantInventoryVisibility';

const baseNavItems = [
  { href: '/merchant/dashboard', icon: SquaresFour, label: 'Dashboard' },
  { href: '/merchant/orders', icon: Receipt, label: 'Orders' },
  { href: '/merchant/analytics', icon: ChartBar, label: 'Analytics' },
  { href: '/merchant/finance', icon: Wallet, label: 'Finance' },
  { href: '/merchant/settings', icon: Gear, label: 'Settings' },
];

export default function MerchantSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeOutlet } = useMerchantContext();
  const category = activeOutlet?.category;
  const { mode, showShelves, showBags, isHybrid } = merchantInventoryVisibility(category);

  const navItems = useMemo(() => {
    const inventory = [];
    if (showShelves) {
      inventory.push({
        href: '/merchant/shelves',
        icon: Package,
        label: mode === 'hybrid' ? "Today's shelf" : 'Clearance shelves',
      });
    }
    if (showBags) {
      inventory.push({
        href: '/merchant/bags',
        icon: ShoppingBag,
        label: mode === 'hybrid' ? 'Rescue bags' : 'Rescue Bags',
      });
    }
    return [
      baseNavItems[0],
      baseNavItems[1],
      ...inventory,
      ...baseNavItems.slice(2),
    ];
  }, [showBags, showShelves, mode]);

  const mobileNavItems = useMemo(() => {
    const items = [
      { href: '/merchant/dashboard', icon: House, label: 'Home' },
      { href: '/merchant/orders', icon: Receipt, label: 'Orders' },
    ];
    if (showBags) {
      items.push({
        href: '/merchant/bags',
        icon: ShoppingBag,
        label: isHybrid ? 'Bags' : 'Bags',
      });
    }
    if (showShelves) {
      items.push({
        href: '/merchant/shelves',
        icon: Package,
        label: isHybrid ? 'Shelves' : 'Shelf',
      });
    }
    items.push({ href: '/merchant/settings', icon: User, label: 'Settings' });
    return items;
  }, [isHybrid, showBags, showShelves]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen z-50 w-72 border-r border-divider bg-surface shadow-sm">
        <div className="p-xl border-b border-divider flex flex-col gap-md">
          <Link href="/merchant/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <h1 className="font-display text-xl tracking-tight text-primary">Merchant</h1>
          </Link>
          
          <div className="bg-surface-2 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-highlight flex items-center justify-center text-primary">
              <Storefront size={24} weight="fill" />
            </div>
            <div className="min-w-0">
              <p className="font-label text-text truncate">Green Bakery</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <p className="font-label-caps text-[9px] text-success">Verified</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-md flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-white shadow-elevation-md"
                    : "text-text-muted hover:bg-surface-2 hover:text-text"
                }`}
              >
                <Icon size={24} weight={isActive ? "fill" : "bold"} />
                <span className="font-label text-sm font-semibold">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </Link>
            );
          })}
        </div>

        <div className="p-md mt-auto border-t border-divider">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-error hover:bg-error/5 transition-colors font-label"
          >
            <SignOut size={24} weight="bold" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 pb-safe z-50 bg-surface/95 backdrop-blur-xl border-t border-divider shadow-elevation-lg">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 flex-1 active:scale-90 transition-all duration-120 ${
                isActive
                  ? 'text-primary scale-105'
                  : 'text-text-faint'
              }`}
            >
              <Icon size={24} weight={isActive ? "fill" : "bold"} className="mb-0.5" />
              <span className="text-[10px] font-bold tracking-tight uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
