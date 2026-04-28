'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Authentication hook — handles OTP (customer) and email/password (merchant) flows.
 * Extracted from: src/app/(auth)/login/page.js
 */
export function useAuth() {
  const router = useRouter();
  const [role, setRole] = useState('customer');

  // Form state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [step, setStep] = useState('request'); // 'request' | 'verify'

  // UI state
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

  const clearToast = useCallback(() => {
    setToast({ message: null, type: null });
  }, []);

  const formatPhone = useCallback((rawPhone) => {
    return rawPhone.startsWith('+94') ? rawPhone : `+94${rawPhone.replace(/^0/, '')}`;
  }, []);

  const handleRequestOTP = useCallback(async (e) => {
    e.preventDefault();
    clearToast();
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;

      setStep('verify');
      showToast('Verification code sent to your phone', 'success');
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      showToast(err.message || 'Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  }, [phone, supabase, showToast, clearToast, formatPhone]);

  const handleVerifyOTP = useCallback(async (e) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) {
      showToast('Please enter all 6 digits', 'error');
      return;
    }

    clearToast();
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      router.push('/discover');
    } catch (err) {
      showToast(err.message || 'Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, supabase, showToast, clearToast, formatPhone, router]);

  const handleEmailLogin = useCallback(async (e) => {
    e.preventDefault();
    clearToast();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/merchant/dashboard');
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  }, [email, password, supabase, showToast, clearToast, router]);

  const handleOtpChange = useCallback((index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const resetToPhoneEntry = useCallback(() => {
    setStep('request');
    setOtp(Array(6).fill(''));
    clearToast();
  }, [clearToast]);

  return {
    // State
    role, setRole,
    phone, setPhone,
    email, setEmail,
    password, setPassword,
    otp, otpRefs,
    step,
    loading,
    toast,

    // Actions
    handleRequestOTP,
    handleVerifyOTP,
    handleEmailLogin,
    handleOtpChange,
    handleOtpKeyDown,
    resetToPhoneEntry,
    showToast,
    clearToast,
  };
}
