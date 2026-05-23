'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CaretLeft,
  Phone,
  Eye,
  EyeSlash,
  User as UserIcon,
  Storefront,
  Shield,
} from '@phosphor-icons/react';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = searchParams?.get('portal');
  const tabFromUrl =
    portalParam === 'admin' ? 'admin' : portalParam === 'merchant' ? 'merchant' : 'customer';
  const [tabOverride, setTabOverride] = useState(null);
  const activeTab = tabOverride ?? tabFromUrl;
  const [showPassword, setShowPassword] = useState(false);

  const {
    phone,
    setPhone,
    email,
    setEmail,
    password,
    setPassword,
    otp,
    otpRefs,
    step,
    loading,
    toast,
    handleRequestOTP,
    handleVerifyOTP,
    handleEmailLogin,
    handleOtpChange,
    handleOtpKeyDown,
    resetToPhoneEntry,
    handleSignInWithGoogle,
    handleSignInWithApple,
  } = useAuth();

  const subtitle =
    step === 'verify'
      ? `We've sent a 6-digit code to ${phone}`
      : activeTab === 'customer'
        ? 'Sign in to rescue delicious food and save more.'
        : activeTab === 'admin'
          ? 'Admin sign-in (email & password).'
          : 'Merchant sign-in with your business email.';

  const staffSubmit = (e) =>
    activeTab === 'admin' ? handleEmailLogin(e, 'admin') : handleEmailLogin(e, 'merchant');

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-page-margin-mobile md:p-page-margin-desktop font-body-md bg-background text-text">
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 h-16 bg-background/80 backdrop-blur-md z-50">
        <button
          aria-label="Go Back"
          onClick={() => (step === 'verify' ? resetToPhoneEntry() : router.replace('/'))}
          className="text-primary hover:bg-surface-2 transition-colors flex items-center justify-center p-2 rounded-full"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          <h1 className="font-display font-bold text-lg text-primary tracking-tight">Fresh As Ever</h1>
        </div>
        <div className="w-10" aria-hidden="true" />
      </header>

      <main className="w-full max-w-md mt-16 pb-16">
        <div className="text-center mb-xl">
          <h2 className="font-display text-4xl text-text mb-sm font-extrabold tracking-tight">
            {step === 'verify' ? 'Verify OTP' : 'Welcome Back'}
          </h2>
          <p className="font-body-md text-text-muted">{subtitle}</p>
        </div>

        <div className="bg-surface rounded-2xl p-md md:p-xl shadow-elevation-lg border border-divider">
          {step === 'request' && (
            <>
              <div className="flex flex-wrap gap-1 border-b border-divider mb-lg">
                <button
                  type="button"
                  onClick={() => setTabOverride('customer')}
                  className={`flex-1 min-w-[90px] pb-3 font-label text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'customer'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-faint hover:text-text-muted'
                  }`}
                >
                  <UserIcon size={18} weight={activeTab === 'customer' ? 'fill' : 'bold'} />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setTabOverride('merchant')}
                  className={`flex-1 min-w-[90px] pb-3 font-label text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'merchant'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-faint hover:text-text-muted'
                  }`}
                >
                  <Storefront size={18} weight={activeTab === 'merchant' ? 'fill' : 'bold'} />
                  Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setTabOverride('admin')}
                  className={`flex-1 min-w-[90px] pb-3 font-label text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'admin'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-faint hover:text-text-muted'
                  }`}
                >
                  <Shield size={18} weight={activeTab === 'admin' ? 'fill' : 'bold'} />
                  Admin
                </button>
              </div>

              {toast.message && (
                <div
                  className={`mb-lg p-3 rounded-xl border ${
                    toast.type === 'error'
                      ? 'bg-error/10 border-error/20 text-error'
                      : 'bg-success/10 border-success/20 text-success'
                  }`}
                >
                  <p className="font-body-sm font-medium">{toast.message}</p>
                </div>
              )}

              {activeTab === 'customer' && (
                <>
                  <SocialAuthButtons
                    loading={loading}
                    onGoogle={() => void handleSignInWithGoogle()}
                    onApple={() => void handleSignInWithApple()}
                  />
                <form className="space-y-lg" onSubmit={handleRequestOTP}>
                  <div className="space-y-xs">
                    <label className="block font-label text-sm font-bold text-text" htmlFor="phone">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-faint group-focus-within:text-primary">
                        <Phone size={20} weight="bold" />
                      </span>
                      <input
                        className="block w-full pl-12 pr-4 py-3.5 rounded-xl border border-divider bg-surface text-text font-body-md focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                        id="phone"
                        name="phone"
                        placeholder="77 123 4567"
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    className="w-full h-14 bg-primary text-white rounded-2xl font-label text-lg font-bold flex items-center justify-center hover:bg-primary-hover active:scale-[0.98] transition-all shadow-elevation-md disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
                </>
              )}

              {(activeTab === 'merchant' || activeTab === 'admin') && (
                <form className="space-y-lg" onSubmit={staffSubmit}>
                  <div className="space-y-xs">
                    <label className="block font-label text-sm font-bold text-text" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      className="block w-full px-4 py-3.5 rounded-xl border border-divider bg-surface text-text font-body-md focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                      id="email"
                      name="email"
                      placeholder={activeTab === 'admin' ? 'admin@yourorg.com' : 'merchant@cafe.com'}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-xs">
                    <div className="flex justify-between items-center">
                      <label className="block font-label text-sm font-bold text-text" htmlFor="password">
                        Password
                      </label>
                      <Link
                        className="font-label text-sm font-bold text-primary hover:underline"
                        href="/login?portal=merchant"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <input
                        className="block w-full px-4 py-3.5 rounded-xl border border-divider bg-surface text-text font-body-md focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-faint hover:text-text focus:outline-none"
                        type="button"
                      >
                        {showPassword ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}
                      </button>
                    </div>
                  </div>
                  <button
                    className="w-full h-14 bg-primary text-white rounded-2xl font-label text-lg font-bold flex items-center justify-center hover:bg-primary-hover active:scale-[0.98] transition-all shadow-elevation-md disabled:opacity-50"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? 'Signing in...'
                      : activeTab === 'admin'
                        ? 'Sign In as Admin'
                        : 'Sign In as Merchant'}
                  </button>
                </form>
              )}
            </>
          )}

          {step === 'verify' && (
            <form className="space-y-lg" onSubmit={handleVerifyOTP}>
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    className="w-12 h-14 bg-surface border-2 border-divider rounded-xl text-center font-display text-xl font-bold text-text focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              <button
                className="w-full h-14 bg-primary text-white rounded-2xl font-label text-lg font-bold flex items-center justify-center hover:bg-primary-hover active:scale-[0.98] transition-all shadow-elevation-md disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={resetToPhoneEntry}
                className="w-full text-center font-label text-sm font-bold text-text-muted hover:text-primary transition-colors"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background text-text-muted font-body-md">
      Loading sign-in…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
