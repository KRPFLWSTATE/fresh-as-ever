'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';

export default function LeaveReviewPage({ params }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const submitReview = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to review');

      const { data: order } = await supabase
        .from('orders')
        .select('outlet_id')
        .eq('id', params.id)
        .single();
        
      if (!order) throw new Error('Order not found');

      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          order_id: params.id,
          customer_id: user.id,
          outlet_id: order.outlet_id,
          rating,
          comment
        });

      if (insertError) throw insertError;

      alert('Review submitted! Thank you.');
      router.push(`/orders/${params.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        ← Back
      </button>
      <h1 className={styles.title}>Rate your Rescue</h1>
      <p className={styles.subtitle}>How was your Surprise Bag experience?</p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <div className={styles.stars}>
           {[1, 2, 3, 4, 5].map(star => (
             <button 
               key={star} 
               onClick={() => setRating(star)}
               className={`${styles.starBtn} ${star <= rating ? styles.activeStar : ''}`}
             >
               ★
             </button>
           ))}
        </div>
        
        <textarea 
          className={styles.textarea}
          rows="4" 
          placeholder="Tell us what you loved (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        
        <button 
          className={styles.submitBtn}
          onClick={submitReview}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}