'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';

// Floating Toast Notification
function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.toastContainer} ${type === 'error' ? styles.toastError : styles.toastSuccess}`} onAnimationEnd={() => setTimeout(onClose, 4000)}>
      {type === 'error' ? '⚠️' : '✅'} {message}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('customer'); // 'customer' or 'merchant'
  
  // State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: null, type: null });

  const otpRefs = useRef([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const handleRequestOTP = useCallback(async (e) => {
    e.preventDefault();
    showToast(null);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+94') ? phone : `+94${phone.replace(/^0/, '')}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;
      
      setStep('verify');
      showToast('Verification code sent to your phone', 'success');
      // Focus first OTP input on next tick
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      showToast(err.message || 'Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  }, [phone, supabase, showToast]);

  const handleVerifyOTP = useCallback(async (e) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) {
      showToast('Please enter all 6 digits', 'error');
      return;
    }
    
    showToast(null);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+94') ? phone : `+94${phone.replace(/^0/, '')}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token,
        type: 'sms',
      });

      if (error) throw error;
      
      router.push('/discover');
    } catch (err) {
      showToast(err.message || 'Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, supabase, showToast, router]);

  const handleEmailLogin = useCallback(async (e) => {
    e.preventDefault();
    showToast(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/merchant/dashboard'); // Zenith Merchant dashboard
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  }, [email, password, supabase, showToast, router]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles.container}>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: null, type: null })} 
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>
      </div>

      {step === 'request' && (
        <div className={styles.roleToggle}>
          <div className={`${styles.toggleSlider} ${role === 'customer' ? styles.toggleCustomer : styles.toggleMerchant}`} />
          <button 
            type="button"
            className={`${styles.roleButton} ${role === 'customer' ? styles.roleButtonActiveCustomer : ''}`}
            onClick={() => { setRole('customer'); showToast(null); }}
          >
            Customer
          </button>
          <button 
            type="button"
            className={`${styles.roleButton} ${role === 'merchant' ? styles.roleButtonActiveMerchant : ''}`}
            onClick={() => { setRole('merchant'); showToast(null); }}
          >
            Merchant
          </button>
        </div>
      )}

      {role === 'customer' ? (
        step === 'request' ? (
          <form onSubmit={handleRequestOTP} className={styles.form}>
            <div className="input-group">
              <label className="input-label">Mobile Number</label>
              <div className={styles.phoneGroup}>
                <div className={styles.phonePrefix}>+94</div>
                <input
                  type="tel"
                  className="input"
                  placeholder="77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\s/g, ''))}
                  required
                />
              </div>
            </div>
            <button type="submit" className={`${styles.authBtn} ${styles.authBtnPrimary}`} disabled={loading || phone.length < 9}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className={styles.form}>
            <div className={styles.otpGroup}>
              <div className={styles.otpInputGroup}>
                <label className={styles.otpInputLabel}>Enter 6-digit code</label>
                <div className={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      className={styles.otpSegment}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onClick={(e) => e.target.select()}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.otpActions}>
                <button type="submit" className={`${styles.authBtn} ${styles.authBtnPrimary}`} disabled={loading || otp.join('').length !== 6}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <button 
                  type="button" 
                  className={`${styles.authBtn} ${styles.authBtnGhost}`}
                  onClick={() => { setStep('request'); setOtp(Array(6).fill('')); showToast(null); }}
                >
                  Use a different number
                </button>
              </div>
            </div>
          </form>
        )
      ) : (
        <form onSubmit={handleEmailLogin} className={styles.form}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="merchant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={`${styles.authBtn} ${styles.authBtnMerchant}`} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In as Merchant'}
          </button>
        </form>
      )}
    </div>
  );
}
