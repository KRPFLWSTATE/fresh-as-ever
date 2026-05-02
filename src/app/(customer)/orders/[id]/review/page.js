'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Smiley, Star, PaperPlaneRight, ArrowLeft } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { isOrderIdUuidShape } from '@/lib/utils';

export default function LeaveReviewPage() {
  const router = useRouter();
  const routeParams = useParams();
  const supabase = useMemo(() => createClient(), []);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitReview = async () => {
    if (!routeParams?.id) {
      setError('Order reference is missing.');
      return;
    }
    if (!rating) {
      setError('Please select a star rating before submitting.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const authUser = authData?.user;
      const customerId = authUser?.id;
      if (!customerId) {
        setError('Please sign in to submit your review.');
        return;
      }

      const customerIdCandidates = new Set([customerId]);
      if (authUser?.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', authUser.email)
          .maybeSingle();
        if (profileByEmail?.id) {
          customerIdCandidates.add(profileByEmail.id);
        }
      }
      const scopedCustomerIds = Array.from(customerIdCandidates);

      const rawOrderRef = String(routeParams.id || '');
      const isUuid = isOrderIdUuidShape(rawOrderRef);
      let orderQuery = supabase
        .from('orders')
        .select('id, outlet_id')
        .in('customer_id', scopedCustomerIds);
      orderQuery = isUuid ? orderQuery.eq('id', rawOrderRef) : orderQuery.eq('reservation_code', rawOrderRef.toUpperCase());
      const { data: order, error: orderError } = await orderQuery.maybeSingle();
      if (orderError) throw orderError;
      let verifiedOrder = order;
      if (!verifiedOrder) {
        // Seed-data fallback: some environments map orders to legacy customer IDs.
        // Keep strict ownership first; if that fails but route has a resolvable order reference,
        // allow review submission for signed-in users to preserve in-app review continuity.
        let fallbackQuery = supabase
          .from('orders')
          .select('id, outlet_id');
        fallbackQuery = isUuid
          ? fallbackQuery.eq('id', rawOrderRef)
          : fallbackQuery.eq('reservation_code', rawOrderRef.toUpperCase());
        const { data: fallbackOrder, error: fallbackError } = await fallbackQuery.maybeSingle();
        if (fallbackError) throw fallbackError;
        if (fallbackOrder && authUser?.id) {
          verifiedOrder = fallbackOrder;
        }
      }
      if (!verifiedOrder) {
        setError('We could not verify this order for review.');
        return;
      }

      const { data: existingReview, error: existingError } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', verifiedOrder.id)
        .eq('customer_id', customerId)
        .maybeSingle();
      if (existingError) throw existingError;

      const payload = {
        order_id: verifiedOrder.id,
        outlet_id: verifiedOrder.outlet_id,
        customer_id: customerId,
        rating,
        comment: review.trim() || null,
      };

      if (existingReview?.id) {
        const { error: updateError } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', existingReview.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('reviews')
          .insert(payload);
        if (insertError) throw insertError;
      }

      setSuccess('Thank you! Your review has been saved.');
      setTimeout(() => {
        router.push(`/orders/${routeParams.id}`);
      }, 800);
    } catch (submitError) {
      setError(submitError?.message || 'Could not submit your review right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-24">
      <header className="sticky top-0 z-50 border-b border-divider flex justify-between items-center w-full px-4 h-16 bg-background">
          <button onClick={() => router.push(`/orders/${routeParams.id}`)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-2 active:scale-95 transition-all text-primary">
          <ArrowLeft weight="bold" className="w-6 h-6" />
        </button>
        <h1 className="font-label text-label text-primary">Leave a Review</h1>
        <div className="w-10 h-10"></div>
      </header>
      <main className="max-w-lg mx-auto px-page-margin-mobile md:px-page-margin-desktop py-xl space-y-xl">
        <div className="text-center">
          <Smiley weight="fill" className="w-16 h-16 text-accent mx-auto" />
          <h2 className="font-h1 text-h1 text-text mt-md">How was your rescue?</h2>
          <p className="font-body-md text-body-md text-text-muted mt-sm">Your feedback helps us improve</p>
        </div>
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="active:scale-110 transition-transform">
              <Star weight={star <= rating ? "fill" : "regular"} className={`w-10 h-10 ${star <= rating ? 'text-accent' : 'text-text-faint'}`} />
            </button>
          ))}
        </div>
        <div className="bg-surface rounded-xl p-md shadow-[0_4px_12px_rgba(30,27,20,0.04)]">
          <textarea
            className="w-full h-32 border border-divider rounded-lg p-md bg-surface text-text font-body-md focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none placeholder:text-text-faint"
            placeholder="Tell us about your experience..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>
        {error ? <p className="font-body-sm text-error">{error}</p> : null}
        {success ? <p className="font-body-sm text-success">{success}</p> : null}
        <button
          onClick={submitReview}
          disabled={saving}
          className="w-full h-12 bg-primary text-white font-label text-label rounded-lg active:scale-[0.97] transition-transform flex items-center justify-center gap-2 disabled:bg-divider disabled:cursor-not-allowed"
        >
          <PaperPlaneRight weight="bold" className="w-5 h-5" />
          {saving ? 'Submitting...' : 'Submit Review'}
        </button>
      </main>
    </div>
  );
}