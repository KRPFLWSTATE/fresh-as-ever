'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ReservationSuccessOverlay } from '@/components/celebration/ReservationSuccessOverlay';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { QrCode, HourglassHigh, CheckCircle, Check, XCircle, ArrowLeft, Clock, MapPin, Star, MapPinLine } from '@phosphor-icons/react';
import { OrderPickupQr } from '@/components/OrderPickupQr';
import { ReportProblemSection } from '@/components/ReportProblemSection';
import { formatPickupRangeLabel, normalizeOrderStatus } from '@/lib/utils';
import { orderDisplayTitle, orderPickupWindow } from '@/lib/orderDisplay';

const statusConfig = {
  reserved: { label: 'Reserved', bg: 'bg-primary-highlight', text: 'text-primary', icon: CheckCircle },
  ready_for_pickup: { label: 'Ready for Pickup', bg: 'bg-success/10', text: 'text-success', icon: QrCode },
  paid: { label: 'Paid', bg: 'bg-surface-2', text: 'text-text-muted', icon: HourglassHigh },
  collected: { label: 'Collected', bg: 'bg-success/10', text: 'text-success', icon: Check },
  cancelled: { label: 'Cancelled', bg: 'bg-error/10', text: 'text-error', icon: XCircle },
};

export default function OrderDetailPage() {
  const resolvedParams = useParams();
  const router = useRouter();
  const {
    order,
    loading,
    bag,
    shelf,
    orderItems,
    isShelfOrder,
    outlet,
    collectible,
    arrivalEligible,
    arrivalBusy,
    signalArrival,
  } = useOrderDetail(resolvedParams.id);
  const [arrivalError, setArrivalError] = useState(null);
  const normalizedStatus = normalizeOrderStatus(order?.order_status);

  const handleArrival = async () => {
    setArrivalError(null);
    const result = await signalArrival();
    if (result?.error) setArrivalError(result.error);
  };
  const status = statusConfig[normalizedStatus] || statusConfig.reserved;
  const orderFlow = ['reserved', 'paid', 'ready_for_pickup', 'collected'];
  const currentStepIndex = Math.max(orderFlow.indexOf(normalizedStatus), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-page-margin-mobile md:p-page-margin-desktop">
        <div className="max-w-2xl mx-auto space-y-lg pt-20">
          <div className="h-6 w-32 skeleton-shimmer rounded" />
          <div className="bg-surface rounded-xl p-md space-y-md">
            <div className="h-4 w-24 skeleton-shimmer rounded" />
            <div className="h-5 w-48 skeleton-shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <Suspense fallback={null}>
        <ReservationSuccessOverlay orderId={resolvedParams.id} />
      </Suspense>
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 border-b border-divider flex justify-between items-center w-full px-4 h-16 bg-background">
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 active:scale-95 transition-all text-primary"
        >
          <ArrowLeft weight="bold" className="w-6 h-6" />
        </button>
        <h1 className="font-label text-label text-primary">Order Details</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="max-w-2xl mx-auto px-page-margin-mobile md:px-page-margin-desktop py-lg space-y-lg">
        {/* Status Banner */}
        <div className={`${status.bg} rounded-xl p-lg flex items-center gap-md`}>
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center shrink-0">
            <status.icon className={`w-7 h-7 ${status.text}`} weight="fill" />
          </div>
          <div>
            <h2 className={`font-h2 text-h2 ${status.text}`}>{status.label}</h2>
            <p className="font-body-sm text-body-sm text-text-muted mt-1">Order #{order?.reservation_code || order?.id?.slice(0, 8)}</p>
          </div>
        </div>

        {/* Progress Timeline */}
        {!['cancelled'].includes(normalizedStatus) && (
          <div className="bg-surface rounded-xl p-md shadow-[0_4px_12px_rgba(30,27,20,0.04)] border border-divider">
            <p className="font-label text-label text-text-muted mb-sm">Order Progress</p>
            <div className="grid grid-cols-4 gap-2">
              {orderFlow.map((step, index) => {
                const reached = index <= currentStepIndex;
                return (
                  <div key={step} className="space-y-2">
                    <div className={`h-2 rounded-full ${reached ? 'bg-primary' : 'bg-surface-2'}`} />
                    <p className={`font-label-caps text-[10px] ${reached ? 'text-primary' : 'text-text-faint'}`}>
                      {step.replaceAll('_', ' ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-surface rounded-xl p-md shadow-[0_4px_12px_rgba(30,27,20,0.04)] space-y-md">
          <h3 className="font-h3 text-h3 text-text">{orderDisplayTitle(order)}</h3>
          <p className="font-body-md text-body-md text-text-muted">{outlet?.merchant?.business_name || outlet?.name}</p>
          {isShelfOrder && orderItems?.length > 0 ? (
            <ul className="divide-y divide-divider border border-divider rounded-lg">
              {orderItems.map((line) => (
                <li key={line.id} className="flex justify-between gap-2 p-3 text-sm">
                  <span>
                    {line.name_snapshot} × {line.quantity}
                  </span>
                  <span className="font-semibold text-accent">
                    LKR {Number(line.line_total ?? 0).toLocaleString('en-LK')}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex justify-between items-center pt-sm border-t border-divider">
            <span className="font-label text-label text-text-muted">Amount Paid</span>
            <span className="font-price text-price text-accent">Rs. {order?.total?.toLocaleString() || order?.total_amount?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="bg-surface rounded-xl p-md shadow-[0_4px_12px_rgba(30,27,20,0.04)] space-y-md">
          <h3 className="font-h3 text-h3 text-text">Pickup Info</h3>
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-primary-highlight flex items-center justify-center text-primary shrink-0">
              <Clock weight="fill" className="w-5 h-5" />
            </div>
            <div>
              <p className="font-label text-label">
                {formatPickupRangeLabel(
                  orderPickupWindow(order).start,
                  orderPickupWindow(order).end,
                ) || 'Pickup time TBC'}
              </p>
              <p className="font-body-sm text-body-sm text-text-muted">Pickup window</p>
            </div>
          </div>
          <div className="flex items-center gap-md pt-sm border-t border-divider">
            <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-text-muted shrink-0">
              <MapPin weight="fill" className="w-5 h-5" />
            </div>
            <div>
              <p className="font-label text-label">{outlet?.merchant?.business_name || outlet?.name}</p>
              <p className="font-body-sm text-body-sm text-text-muted">{outlet?.address || 'Colombo'}</p>
            </div>
          </div>
        </div>

        {/* Customer arrival */}
        {collectible && !['cancelled', 'collected'].includes(normalizedStatus) ? (
          <div className="bg-surface rounded-xl p-md border border-divider space-y-sm">
            {order?.customer_arrived_at ? (
              <div className="flex items-center gap-md text-primary">
                <MapPinLine weight="fill" className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-label font-bold">Outlet notified</p>
                  <p className="font-body-sm text-text-muted">
                    {new Date(order.customer_arrived_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="font-body-sm text-text-muted">
                  {arrivalEligible
                    ? 'Let the merchant know you have arrived for pickup.'
                    : 'Available 15 minutes before your pickup window opens.'}
                </p>
                {arrivalError ? <p className="font-body-sm text-error">{arrivalError}</p> : null}
                <button
                  type="button"
                  onClick={handleArrival}
                  disabled={!arrivalEligible || arrivalBusy}
                  className="w-full bg-primary text-white font-label py-3 rounded-xl disabled:bg-divider disabled:cursor-not-allowed"
                >
                  {arrivalBusy ? 'Notifying...' : "I'm at the outlet"}
                </button>
              </>
            )}
          </div>
        ) : null}

        {/* QR Code (for active orders) */}
        {['reserved', 'paid', 'ready_for_pickup'].includes(normalizedStatus) && (
          <div className="bg-surface rounded-xl p-lg shadow-[0_4px_12px_rgba(30,27,20,0.04)] flex flex-col items-center">
            <h3 className="font-h3 text-h3 text-text mb-md">Show this at pickup</h3>
            <OrderPickupQr code={order?.reservation_code} />
            <div className="mt-md w-full bg-primary/5 border border-primary/10 rounded-lg p-sm">
              <p className="font-label text-xs text-primary font-bold">Pickup tip</p>
              <p className="font-body-sm text-text-muted mt-1">
                Arrive within your pickup window and keep this screen ready for quick handover.
              </p>
            </div>
          </div>
        )}

        {/* Review CTA (for collected orders) */}
        {normalizedStatus === 'collected' && (
          <button
            onClick={() => router.push(`/orders/${order.id}/review`)}
            className="w-full bg-primary text-white font-label text-label py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <Star weight="fill" className="w-5 h-5" />
            Leave a Review
          </button>
        )}

        <ReportProblemSection
          orderId={order?.id}
          orderStatus={normalizedStatus}
          isShelfOrder={isShelfOrder}
        />
      </main>
    </div>
  );
}
