'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function LandingPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState(null);
  const [promoCode, setPromoCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: existing } = await supabase
        .from('waitlist_signups')
        .select('position, promo_code_assigned')
        .eq('phone', `+94${phone}`)
        .single();

      if (existing) {
        setPosition(existing.position);
        setPromoCode(existing.promo_code_assigned);
        setSubmitted(true);
        setLoading(false);
        return;
      }

      const { count } = await supabase
        .from('waitlist_signups')
        .select('*', { count: 'exact', head: true });

      const newPosition = (count || 0) + 1;
      const assignedPromo = newPosition <= 500 ? 'RESCUE200' : null;

      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert({
          phone: `+94${phone}`,
          email: email || null,
          signup_source: 'landing_page',
          promo_code_assigned: assignedPromo,
          position: newPosition,
        });

      if (insertError) throw insertError;

      setPosition(newPosition);
      setPromoCode(assignedPromo);
      setSubmitted(true);
    } catch (err) {
      console.error('Waitlist signup error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.landing}>
      {/* ── Cinematic Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Coming Soon to Colombo
          </div>

          <h1 className={styles.heroTitle}>
            Good food rescued. <br />
            <span className={styles.heroTitleAccent}>Great value earned.</span>
          </h1>

          <p className={styles.heroDescription}>
            Colombo's elite surplus food rescue experience. Same-day bags from your favourite outlets at up to 60% off.
          </p>

          <div className={styles.heroCtas}>
            <a href="/discover" className={styles.heroCtaPrimary}>
              Explore Bags
            </a>
            <a href="/merchant/dashboard" className={styles.heroCtaSecondary}>
              Partner with Us
            </a>
          </div>

          {/* ── Waitlist Portal ── */}
          <div className={styles.waitlistForm}>
            {!submitted ? (
              <>
                <h3 className={styles.waitlistFormTitle}>Join the Waitlist</h3>
                <p className={styles.waitlistFormSubtitle}>
                  First 500 signups get LKR 200 credit on their first order.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className={styles.waitlistInputGroup}>
                    <div className={styles.waitlistPhoneRow}>
                      <div className={styles.waitlistPhonePrefix}>+94</div>
                      <input
                        type="tel"
                        className={`${styles.waitlistInput} ${styles.waitlistPhoneInput}`}
                        placeholder="7X XXX XXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        id="waitlist-phone"
                      />
                    </div>
                    <input
                      type="email"
                      className={styles.waitlistInput}
                      placeholder="Email (optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      id="waitlist-email"
                    />
                  </div>

                  {error && (
                    <p className={styles.waitlistError}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className={styles.waitlistSubmit}
                    disabled={loading}
                    id="waitlist-submit"
                  >
                    {loading ? 'Processing...' : 'Reserve my spot →'}
                  </button>

                  <p className={styles.waitlistPrivacy}>
                    We'll only text you when we launch in your area.
                  </p>
                </form>
              </>
            ) : (
              <div className={styles.waitlistSuccess}>
                <div className={styles.waitlistSuccessEmoji}>✨</div>
                <h3 className={styles.waitlistSuccessTitle}>You're Authorized</h3>
                <div className={styles.waitlistSuccessPosition}>
                  Waitlist Position #{position}
                </div>

                {promoCode && (
                  <div className={styles.waitlistSuccessPromo}>
                    <div className={styles.waitlistSuccessPromoLabel}>Launch Day Credit Code</div>
                    <div className={styles.waitlistSuccessPromoCode}>{promoCode}</div>
                  </div>
                )}

                <p className={styles.waitlistSuccessMessage}>
                  We'll notify you when you can start ordering.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <h2>Why Fresh As Ever?</h2>
          <p>Save food. Save money. Make a difference.</p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>💰</span>
            <h3 className={styles.featureTitle}>Half the Price</h3>
            <p className={styles.featureText}>
              Rescue Bags are up to 60% off retail. Great food at prices you can afford.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🌱</span>
            <h3 className={styles.featureTitle}>Reduce Waste</h3>
            <p className={styles.featureText}>
              Every bag saved means less food goes to waste. Good for the planet.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🍽️</span>
            <h3 className={styles.featureTitle}>Fresh Daily</h3>
            <p className={styles.featureText}>
              Discover new favorites from your local bakeries, cafes and restaurants.
            </p>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className={styles.footer}>
        <div className={styles.footerText}>
          © {new Date().getFullYear()} Fresh As Ever. Food rescue, reimagined.
        </div>
      </footer>
    </div>
  );
}
