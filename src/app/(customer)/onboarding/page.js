'use client';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Leaf, ForkKnife } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

function CustomerOnboardingInner({ safeInitialStep }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(safeInitialStep);

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
      data: {
        customer_onboarding_complete: true,
      },
    });
    router.push('/discover');
  };
  const next = () => (step < 3 ? setStepAndSyncUrl(step + 1) : completeOnboarding());
  return (
    <main className="min-h-[100dvh] flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center items-center p-page-margin-mobile md:p-page-margin-desktop text-center max-w-lg mx-auto w-full">
        <div className="w-64 h-64 bg-surface-2 rounded-full mb-xl flex items-center justify-center shrink-0">
          <div className="text-primary">
            {step===1 ? <ShoppingBag weight="fill" className="w-20 h-20" /> :
             step===2 ? <Leaf weight="fill" className="w-20 h-20" /> :
             <ForkKnife weight="fill" className="w-20 h-20" />}
          </div>
        </div>
        <div className="space-y-md mb-xl">
          <h1 className="font-display text-display text-text">
            {step===1?'Save food, save money.':step===2?'Reduce your carbon footprint.':step===3?'Enjoy fresh local food.':''}
          </h1>
          <p className="font-body-lg text-body-lg text-text-muted">
            {step===1?'Get high-quality surplus food from local merchants at a fraction of the price.'
            :step===2?'Every rescue bag you buy helps prevent food waste and protects our planet.'
            :step===3?'Reserve your bag, pick it up at the store, and enjoy delicious food.':''}
          </p>
        </div>
        <div className="flex gap-2 mb-xl">
          {[1,2,3].map(i=><div key={i} className={`h-2 rounded-full transition-all ${step===i?'w-8 bg-primary-highlight':'w-2 bg-surface-2'}`}/>)}
        </div>
        <div className="w-full space-y-md pb-safe">
          <button onClick={next} className="w-full h-14 bg-primary text-white font-label text-label rounded-xl active:scale-[0.97] transition-transform">
            {step===3?'Get Started':'Next'}
          </button>
          {step < 3 && <button onClick={completeOnboarding} className="w-full h-14 bg-transparent text-text-muted font-label text-label rounded-xl active:scale-[0.97] transition-transform">Skip</button>}
        </div>
      </div>
    </main>
  );
}

function CustomerOnboardingContent() {
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams?.get('step') || '1');
  const safeInitialStep = Number.isFinite(initialStep) ? Math.min(3, Math.max(1, initialStep)) : 1;

  return <CustomerOnboardingInner key={safeInitialStep} safeInitialStep={safeInitialStep} />;
}

export default function CustomerOnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-background" />}>
      <CustomerOnboardingContent />
    </Suspense>
  );
}
