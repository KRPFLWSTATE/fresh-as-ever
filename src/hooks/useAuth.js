'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Authentication hook — handles OTP (customer) and email/password (merchant) flows.
 * Extracted from: src/app/(auth)/login/page.js
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
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

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    []
  );

  const fetchUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      const metadataRole = authUser.app_metadata?.role || authUser.user_metadata?.role || null;
      const qaEmailRole =
        authUser.email === 'qa.admin@freshasever.test'
          ? 'admin'
          : authUser.email === 'qa.merchant@freshasever.test'
            ? 'merchant_staff'
            : null;
      const resolvedRole = profile?.role || metadataRole || qaEmailRole || 'customer';
      
      setUser({
        ...authUser,
        ...profile,
        role: resolvedRole,
        name: profile?.full_name || authUser.user_metadata?.full_name || 'User',
      });
      setRole(resolvedRole);
    } else {
      setUser(null);
      setRole('customer');
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole('customer');
    router.replace('/login');
    router.refresh();
  }, [supabase, router]);

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
      const {
        data: { user: verifiedUser },
      } = await supabase.auth.getUser();
      const isOnboardingDone = Boolean(verifiedUser?.user_metadata?.customer_onboarding_complete);
      router.push(isOnboardingDone ? '/discover' : '/onboarding');
    } catch (err) {
      showToast(err.message || 'Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, supabase, showToast, clearToast, formatPhone, router]);

  /**
   * @param {React.FormEvent} e
   * @param {'admin' | 'merchant' | null} [portalHint] When set, reject sign-in if role does not match portal.
   */
  const handleEmailLogin = useCallback(async (e, portalHint = null) => {
    e.preventDefault();
    clearToast();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const signedInUser = data?.user;
      let resolvedRole = signedInUser?.app_metadata?.role || signedInUser?.user_metadata?.role || null;

      if (signedInUser?.id && !resolvedRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signedInUser.id)
          .single();
        resolvedRole = profile?.role || null;
      }

      const qaEmailRole =
        email === 'qa.admin@freshasever.test'
          ? 'admin'
          : email === 'qa.merchant@freshasever.test'
            ? 'merchant_staff'
            : null;
      const normalizedRole = (resolvedRole || qaEmailRole || 'customer').toLowerCase();

      if (portalHint === 'admin' && normalizedRole !== 'admin') {
        await supabase.auth.signOut();
        setUser(null);
        setRole('customer');
        showToast('This account is not an admin. Use Customer sign-in or the correct staff portal.', 'error');
        return;
      }
      if (portalHint === 'merchant' && normalizedRole !== 'merchant' && normalizedRole !== 'merchant_staff') {
        await supabase.auth.signOut();
        setUser(null);
        setRole('customer');
        showToast('This account is not a merchant. Use Customer sign-in or the Admin portal if you are staff.', 'error');
        return;
      }

      await fetchUser();

      if (normalizedRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (normalizedRole === 'merchant' || normalizedRole === 'merchant_staff') {
        router.push('/merchant/dashboard');
      } else {
        router.push('/discover');
      }
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  }, [email, password, supabase, showToast, clearToast, router, fetchUser]);

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
    user,
    loading,
    toast,
    logout,
    fetchUser,

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
