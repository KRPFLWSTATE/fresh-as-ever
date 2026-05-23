'use client';

import { Suspense, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getOnboardingHeroSrc,
  getOnboardingStep,
  ONBOARDING_TOTAL_STEPS,
} from '@/content/onboardingMoments';

function CustomerOnboardingInner({ safeInitialStep }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(safeInitialStep);
  const meta = getOnboardingStep(step);

  const setStepAndSyncUrl = (nextStep) => {
    setStep(nextStep);
    router.replace(`/onboarding?step=${nextStep}`);
  };

  const completeOnboarding = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    await supabase.auth.updateUser({
      data: { customer_onboarding_complete: true },
    });
    router.push('/discover');
  };

  const next = () =>
    step < ONBOARDING_TOTAL_STEPS ? setStepAndSyncUrl(step + 1) : completeOnboarding();

  const heroSrc = getOnboardingHeroSrc(step);

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background">
      <header className="flex items-center justify-between px-page-margin-mobile md:px-page-margin-desktop h-16 border-b border-divider">
        <div className="w-10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStepAndSyncUrl(step - 1)}
              className="text-primary font-label"
            >
              Back
            </button>
          ) : null}
        </div>
        <span className="font-h2 text-h2 text-primary">Fresh As Ever</span>
        <div className="w-10 text-right">
          {step < ONBOARDING_TOTAL_STEPS ? (
            <button type="button" onClick={completeOnboarding} className="text-text-muted font-label text-sm">
              Skip
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 flex flex-col px-page-margin-mobile md:px-page-margin-desktop py-lg max-w-lg mx-auto w-full">
        <div
          className="relative w-full overflow-hidden bg-surface-2 mb-xl shrink-0"
          style={{ borderRadius: meta.heroBorderRadius, aspectRatio: meta.heroAspect }}
        >
          <Image
            src={heroSrc}
            alt={meta.heroAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
            priority={step === 1}
          />
          {step === 1 ? (
            <div className="absolute inset-x-0 bottom-0 h-[35%] bg-black/20 pointer-events-none" />
          ) : null}
        </div>

        <div className="flex justify-center gap-2 mb-lg">
          {Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const active = n === step;
            return (
              <div
                key={n}
                className={`h-2 rounded-full transition-all ${active ? 'w-8 bg-primary-highlight' : 'w-2 bg-surface-2'}`}
              />
            );
          })}
        </div>

        <div className="flex-1 flex flex-col justify-center text-center space-y-md mb-xl">
          <h1 className="font-display text-display text-text">{meta.title}</h1>
          <p className="font-body-lg text-body-lg text-text-muted max-w-sm mx-auto">{meta.body}</p>
          {step === 3 ? (
            <div className="mt-lg p-md rounded-xl bg-surface border border-divider">
              <p className="font-label-caps text-text-muted mb-sm">Your mockup code</p>
              <p className="font-display text-primary tracking-[0.35em]">481-592</p>
            </div>
          ) : null}
        </div>

        <div className="w-full space-y-md pb-safe">
          <button
            type="button"
            onClick={next}
            className="w-full h-14 bg-primary text-white font-label text-label rounded-xl active:scale-[0.97] transition-transform"
          >
            {step === ONBOARDING_TOTAL_STEPS ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </main>
  );
}

function CustomerOnboardingContent() {
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams?.get('step') || '1');
  const safeInitialStep = Number.isFinite(initialStep)
    ? Math.min(ONBOARDING_TOTAL_STEPS, Math.max(1, initialStep))
    : 1;

  return <CustomerOnboardingInner key={safeInitialStep} safeInitialStep={safeInitialStep} />;
}

export default function CustomerOnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-background" />}>
      <CustomerOnboardingContent />
    </Suspense>
  );
}
