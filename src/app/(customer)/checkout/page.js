'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCheckout } from '@/hooks/useCheckout';
import { ArrowLeft, Clock, CreditCard, Money, Leaf, CheckCircle } from '@phosphor-icons/react';
import { formatPickupRangeLabel } from '@/lib/utils';
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bagId = searchParams?.get('bag_id') || searchParams?.get('draft');
  const groupRaw = searchParams?.get('group') ?? '';
  const groupBagIds = groupRaw
    ? groupRaw.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 5)
    : bagId
      ? [bagId]
      : [];
  const shelfId = searchParams?.get('shelf');
  const itemsRaw = searchParams?.get('items');
  let shelfCheckout = null;
  if (shelfId && itemsRaw) {
    try {
      shelfCheckout = { shelfId, items: JSON.parse(itemsRaw) };
    } catch {
      shelfCheckout = null;
    }
  }
  const {
    bag,
    shelfLineItems,
    isShelfCheckout,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    applyPromoCode,
    total,
    discount,
    loading,
    processing,
    handleConfirm,
    cashAllowed,
    toast,
    error,
  } = useCheckout(bagId, groupBagIds, shelfCheckout);
  const savings = (bag?.original_price || 0) - (bag?.rescue_price || 0) + (discount || 0);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-md animate-pulse">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto animate-spin" />
          <p className="font-label text-text-muted">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!bag) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-xl">
        <div className="bg-surface border border-divider rounded-2xl p-xl text-center space-y-md max-w-sm">
          <h2 className="font-h2 text-h2 text-text">Checkout unavailable</h2>
          <p className="font-body-md text-text-muted">
            We couldn&apos;t load this rescue bag. It may have been removed or already sold out.
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="w-full h-12 rounded-xl bg-primary text-white font-label font-bold"
          >
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-text min-h-screen pb-40 antialiased font-body-md">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-divider flex items-center h-16 px-page-margin-mobile md:px-page-margin-desktop w-full">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 transition-all active:scale-90"
        >
          <ArrowLeft className="w-6 h-6 text-text" weight="bold" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-display text-h3 text-text pr-10">Checkout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-page-margin-mobile md:px-page-margin-desktop py-8 space-y-8">
        {error && (
          <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 font-label text-sm text-error">
            {error}
          </div>
        )}
        {toast?.message && (
          <div
            className={`rounded-2xl border px-4 py-3 font-label text-sm ${
              toast.type === 'error'
                ? 'border-error/30 bg-error/10 text-error'
                : 'border-success/30 bg-success/10 text-success'
            }`}
            role="status"
          >
            {toast.message}
          </div>
        )}
        {/* Order Summary */}
        <section className="bg-surface rounded-3xl p-6 shadow-elevation-sm border border-divider">
          <h2 className="font-h3 text-h3 text-text mb-4">Your Order</h2>
          <div className="flex gap-6 p-4 bg-surface-2 rounded-2xl border border-divider">
            <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm">
              <img
                alt={bag?.title}
                className="w-full h-full object-cover"
                src={bag?.image_url || 'https://images.unsplash.com/photo-1555503465-4356405bc141?auto=format&fit=crop&q=80&w=400'}
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="font-label text-xs text-text-muted mb-1 uppercase tracking-wider">{bag?.outlet?.merchant?.business_name || bag?.outlet?.name}</p>
              <h3 className="font-h3 text-h3 text-text line-clamp-1">{bag?.title}</h3>
              <div className="flex items-center gap-2 text-text-muted font-label text-xs mt-2">
                <Clock className="w-5 h-5 text-primary" weight="fill" />
                <span>
                  Pickup:{' '}
                  {formatPickupRangeLabel(bag?.pickup_start, bag?.pickup_end) ||
                    `${bag?.pickup_start || '—'} – ${bag?.pickup_end || '—'}`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pickup reminder */}
        <section className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
          <p className="font-label text-sm text-primary font-bold">Pickup Reminder</p>
          <p className="font-body-sm text-text-muted mt-1">
            Arrive within the pickup window and show your order confirmation at collection.
          </p>
        </section>

        {/* Payment Selection */}
        <section className="space-y-4">
          <h2 className="font-h3 text-h3 text-text px-1">Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="cursor-pointer group">
              <input
                checked={paymentMethod === 'card'}
                className="peer sr-only"
                name="payment"
                type="radio"
                onChange={() => setPaymentMethod('card')}
              />
              <div className="p-5 rounded-3xl border-2 border-divider bg-surface peer-checked:border-primary peer-checked:bg-primary/5 transition-all shadow-elevation-sm group-hover:shadow-elevation-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-primary border border-divider">
                    <CreditCard className="w-6 h-6" weight="fill" />
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary' : 'border-divider'}`}>
                    {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="font-display text-lg text-text">Card Payment</p>
                <p className="font-label text-xs text-text-muted mt-1">Visa, Mastercard, AMEX</p>
              </div>
            </label>

            <div className={`flex flex-col gap-2 ${cashAllowed ? '' : 'opacity-55'}`}>
              <label className={`group ${cashAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <input
                  checked={paymentMethod === 'cash'}
                  className="peer sr-only"
                  name="payment"
                  type="radio"
                  disabled={!cashAllowed}
                  aria-disabled={!cashAllowed}
                  aria-label={
                    cashAllowed
                      ? 'Pay at Store'
                      : 'Pay at Store (locked until you complete one pickup)'
                  }
                  onChange={() => cashAllowed && setPaymentMethod('cash')}
                />
                <div
                  className={`p-5 rounded-3xl border-2 bg-surface transition-all shadow-elevation-sm ${
                    cashAllowed
                      ? 'border-divider peer-checked:border-primary peer-checked:bg-primary/5 group-hover:shadow-elevation-md'
                      : 'border-divider grayscale pointer-events-none'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-primary border border-divider">
                      <Money className="w-6 h-6" weight="fill" />
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary' : 'border-divider'}`}>
                      {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="font-display text-lg text-text">Pay at Store</p>
                  <p className="font-label text-xs text-text-muted mt-1">Pay on collection</p>
                </div>
              </label>
              {!cashAllowed && (
                <p className="font-label text-xs text-text-muted px-2">
                  Complete your first pickup to unlock cash at pickup
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Promo Section */}
        <section className="bg-surface rounded-3xl p-6 shadow-elevation-sm border border-divider">
          <h2 className="font-h3 text-h3 text-text mb-4">Promo Code</h2>
          <div className="flex gap-3">
            <input
              className="flex-1 bg-surface-2 border border-divider rounded-2xl px-5 py-3.5 font-label text-sm focus:outline-none focus:border-primary transition-all placeholder:text-text-faint"
              placeholder="Enter code (e.g. RESCUE10)"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button
              onClick={applyPromoCode}
              className="px-8 py-3.5 bg-primary-highlight text-primary font-bold rounded-2xl hover:bg-primary hover:text-white active:scale-95 transition-all shadow-sm"
            >
              Apply
            </button>
          </div>
        </section>

        {/* Bill Details */}
        <section className="bg-surface rounded-3xl p-6 shadow-elevation-sm border border-divider space-y-4">
          <h2 className="font-h3 text-h3 text-text mb-2">Bill Summary</h2>
          <div className="flex justify-between font-label text-text-muted">
            <span>Rescue Bag</span>
            <span className="text-text">Rs. {bag?.rescue_price?.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-label text-success">
              <span>Promo Discount</span>
              <span>- Rs. {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="h-px bg-divider w-full" />
          <div className="flex justify-between items-baseline pt-2">
            <span className="font-display text-xl text-text">Total Amount</span>
            <span className="font-display text-3xl text-primary font-bold">Rs. {total?.toLocaleString()}</span>
          </div>
          
          <div className="mt-6 bg-success/10 p-4 rounded-2xl flex items-center gap-3 border border-success/20">
            <Leaf className="w-6 h-6 text-success" weight="fill" />
            <span className="font-label text-sm text-success font-bold">You are saving Rs. {savings?.toLocaleString()} on this rescue!</span>
          </div>
        </section>
      </main>

      {/* Footer CTA */}
      <footer className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-xl border-t border-divider p-6 shadow-elevation-lg z-50 pb-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-8">
          <div className="flex flex-col">
            <span className="font-label text-[10px] text-text-muted uppercase tracking-widest">To Pay</span>
            <span className="font-display text-2xl text-text font-bold">Rs. {total?.toLocaleString()}</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 h-14 bg-primary hover:bg-primary-hover disabled:bg-divider disabled:cursor-not-allowed text-white font-label text-lg font-bold rounded-2xl shadow-elevation-md active:scale-[0.97] transition-all flex items-center justify-center gap-3"
          >
            {processing ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-6 h-6" weight="fill" />
                Confirm Order
              </>
            )}
          </button>
        </div>
        <p className="max-w-2xl mx-auto mt-2 font-label text-[11px] text-text-faint">
          By confirming, you agree to reserve this bag and follow the pickup timing shown above.
        </p>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen" />}>
      <CheckoutContent />
    </Suspense>
  );
}
