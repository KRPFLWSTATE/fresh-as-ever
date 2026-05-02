'use client';

import Link from 'next/link';
import { 
  ShoppingBag, 
  Receipt, 
  HandCoins, 
  TrendUp, 
  Plus, 
  QrCode, 
  ChartLineUp, 
  User,
  ArrowRight,
  Circle
} from '@phosphor-icons/react';
import { useMerchantDashboard } from '@/hooks/useMerchantDashboard';

export default function MerchantDashboardPage() {
  const { stats, recentOrders, loading } = useMerchantDashboard();

  const kpis = [
    { label: 'Active Bags', value: stats?.active_bags || 0, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', href: '/merchant/bags?view=active' },
    { label: "Today's Orders", value: stats?.today_orders || 0, icon: Receipt, color: 'text-accent', bg: 'bg-accent/10', href: '/merchant/orders?view=all&status=active' },
    { label: 'Revenue', value: `Rs. ${stats?.today_revenue?.toLocaleString() || '0'}`, icon: HandCoins, color: 'text-success', bg: 'bg-success/10', href: '/merchant/orders?view=all&status=paid' },
    { label: 'Pickup Rate', value: `${stats?.pickup_rate || 0}%`, icon: TrendUp, color: 'text-primary', bg: 'bg-primary/10', href: '/merchant/orders?view=verification&status=ready_for_pickup' },
  ];

  return (
    <main className="max-w-7xl mx-auto p-page-margin-mobile md:p-page-margin-desktop space-y-lg md:space-y-xl pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-4">
        <div className="space-y-2">
          <p className="font-label-caps text-label-caps text-primary/60 uppercase tracking-widest mb-xs">Business Performance</p>
          <h1 className="font-display text-h1 md:text-display text-text">Merchant Dashboard</h1>
          <p className="font-body-md text-text-muted max-w-md">Manage your rescue bags and track daily performance with real-time analytics.</p>
        </div>
        <div className="flex items-center gap-sm bg-surface-2 px-4 py-2 rounded-full border border-divider shadow-sm w-fit">
          <Circle size={12} weight="fill" className="text-success animate-pulse" />
          <span className="font-label text-sm font-semibold text-text-muted">Live Tracking</span>
        </div>
      </div>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-md md:gap-lg">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={i}
              href={kpi.href}
              className="bg-surface rounded-[2.5rem] p-lg border border-divider shadow-elevation-sm hover:shadow-elevation-md transition-all group hover:-translate-y-1 block"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 mb-xl border border-divider/50 ${kpi.bg} ${kpi.color}`}>
                <Icon size={28} weight="fill" />
              </div>
              <div className="space-y-1">
                <p className="font-label text-xs font-bold text-text-muted uppercase tracking-wider">{kpi.label}</p>
                <h3 className="font-display text-h1 text-text">{loading ? '...' : kpi.value}</h3>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg md:gap-xl">
        {/* Recent Activity */}
        <section className="lg:col-span-2 bg-surface rounded-[3rem] p-lg md:p-xl border border-divider shadow-elevation-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-xl">
            <h2 className="font-h3 text-h3 text-text">Recent Activity</h2>
            <Link href="/merchant/orders?view=all&status=active" className="bg-surface-2 hover:bg-surface-2 text-text-muted hover:text-text px-5 py-2.5 rounded-full font-label text-xs font-bold transition-all flex items-center gap-2 border border-divider">
              View All Orders
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-md">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface-2 animate-pulse rounded-[2rem]" />)}
            </div>
          ) : recentOrders?.length > 0 ? (
            <div className="space-y-md">
              {recentOrders.map((order) => (
                <Link href={`/merchant/orders/${order.id}`} key={order.id} className="block group">
                  <div className="flex items-center justify-between p-5 rounded-[2rem] border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-md min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-divider flex items-center justify-center text-text-faint shrink-0 group-hover:text-primary transition-colors">
                        <User size={28} weight="bold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-lg font-bold text-text truncate group-hover:text-primary transition-colors">{order.customer_name}</p>
                        <p className="font-label text-xs font-bold text-text-muted uppercase tracking-widest truncate">{order.bag_title}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${
                        order.status === 'ready_for_pickup' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-surface-2 text-text-muted border-divider'
                      }`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                      <p className="font-label text-[11px] font-bold text-text-faint uppercase">{order.time}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-xl opacity-50">
              <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center border border-divider">
                <Receipt size={48} weight="thin" className="text-text-faint" />
              </div>
              <p className="font-display text-xl font-bold text-text-muted">No orders received yet today.</p>
            </div>
          )}
        </section>

        {/* Action Panel */}
        <section className="space-y-md md:space-y-lg">
          <h2 className="font-h3 text-h3 text-text px-2">Quick Operations</h2>
          <div className="flex flex-col gap-md">
            <Link href="/merchant/bags/new" className="group bg-primary hover:bg-primary-hover text-white p-8 rounded-[3rem] shadow-elevation-lg flex items-center gap-xl transition-all active:scale-[0.98]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:rotate-90 transition-transform duration-500 shadow-inner">
                <Plus size={32} weight="bold" />
              </div>
              <div>
                <p className="font-display text-2xl font-black tracking-tight">Add Bag</p>
                <p className="text-white/60 font-label text-xs font-bold uppercase tracking-wider">New Rescue Listing</p>
              </div>
            </Link>
            
            <Link href="/merchant/orders" className="group bg-surface hover:bg-surface-2 text-text border border-divider p-8 rounded-[3rem] shadow-elevation-sm flex items-center gap-xl transition-all active:scale-[0.98] hover:border-primary/20">
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary-highlight text-primary flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/10">
                <QrCode size={32} weight="bold" />
              </div>
              <div>
                <p className="font-display text-2xl font-black tracking-tight">Verify QR</p>
                <p className="text-text-muted font-label text-xs font-bold uppercase tracking-wider">Customer Pickup</p>
              </div>
            </Link>

            <Link href="/merchant/analytics" className="group bg-surface hover:bg-surface-2 text-text border border-divider p-8 rounded-[3rem] shadow-elevation-sm flex items-center gap-xl transition-all active:scale-[0.98] hover:border-accent/20">
              <div className="w-16 h-16 rounded-[1.5rem] bg-accent-highlight text-accent flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/10">
                <ChartLineUp size={32} weight="bold" />
              </div>
              <div>
                <p className="font-display text-2xl font-black tracking-tight">Insights</p>
                <p className="text-text-muted font-label text-xs font-bold uppercase tracking-wider">Growth Metrics</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

