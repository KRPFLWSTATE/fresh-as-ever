'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Storefront, MapPin, FileArrowUp, ArrowRight, Check, CaretLeft } from '@phosphor-icons/react';

function MerchantOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Number(searchParams?.get('step') || '1');
  const safeInitialStep = Number.isFinite(initialStep) ? Math.min(3, Math.max(1, initialStep)) : 1;
  const [step, setStep] = useState(safeInitialStep);

  useEffect(() => {
    setStep(safeInitialStep);
  }, [safeInitialStep]);

  const setStepAndSyncUrl = (nextStep) => {
    setStep(nextStep);
    router.replace(`/merchant/onboarding?step=${nextStep}`);
  };

  const next = () => {
    if (step < 3) {
      setStepAndSyncUrl(step + 1);
      return;
    }
    router.push('/merchant/dashboard');
  };
  const back = () => step > 1 && setStepAndSyncUrl(step - 1);

  const steps = [
    { id: 1, title: 'Store Details', icon: Storefront },
    { id: 2, title: 'Location', icon: MapPin },
    { id: 3, title: 'Verification', icon: FileArrowUp }
  ];

  return (
    <main className="min-h-[100dvh] flex flex-col bg-background p-page-margin-mobile md:p-page-margin-desktop max-w-2xl mx-auto w-full pb-24">
      {/* Progress Bar */}
      <div className="pt-xl flex flex-col gap-xl">
        <div className="flex items-center justify-between">
          <button 
            onClick={back} 
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${step > 1 ? 'bg-surface border border-divider hover:bg-surface-2 text-primary' : 'opacity-0 pointer-events-none'}`}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div className="flex-1 flex gap-3 px-xl">
            {steps.map(s => (
              <div key={s.id} className="flex-1 space-y-2">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s.id ? 'bg-primary shadow-sm' : 'bg-divider'}`} />
              </div>
            ))}
          </div>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-highlight text-primary border border-primary/10 mb-2">
            {step === 1 && <Storefront size={32} weight="fill" />}
            {step === 2 && <MapPin size={32} weight="fill" />}
            {step === 3 && <FileArrowUp size={32} weight="fill" />}
          </div>
          <h1 className="font-display text-h1 text-text">{steps[step-1].title}</h1>
          <p className="font-body-md text-text-muted">
            {step === 1 && 'Tell us about your business to get started.'}
            {step === 2 && 'Where can customers pick up their rescue bags?'}
            {step === 3 && 'Upload necessary documents for account verification.'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-xl">
        {step === 1 && (
          <div className="space-y-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[
              { l: 'Business Name', p: 'e.g. The Artisan Baker', i: Storefront },
              { l: 'Business Type', p: 'e.g. Bakery, Cafe, Grocery', i: Tag },
              { l: 'Phone Number', p: '+94 77 123 4567', i: Phone }
            ].map((f, i) => (
              <div key={i} className="space-y-2 group">
                <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{f.l}</label>
                <div className="relative">
                  <input className="w-full bg-surface border border-divider rounded-2xl py-4 px-6 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-elevation-sm placeholder:text-text-faint/50" placeholder={f.p}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[
              { l: 'Street Address', p: 'e.g. 142 Galle Road', i: MapPin },
              { l: 'City', p: 'e.g. Colombo 03', i: MapPin },
              { l: 'Postal Code', p: 'e.g. 00300', i: Hash }
            ].map((f, i) => (
              <div key={i} className="space-y-2 group">
                <label className="font-label text-xs font-bold text-text-muted uppercase tracking-widest ml-1">{f.l}</label>
                <div className="relative">
                  <input className="w-full bg-surface border border-divider rounded-2xl py-4 px-6 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body-md text-text shadow-elevation-sm placeholder:text-text-faint/50" placeholder={f.p}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-lg">
              {[
                { l: 'Business Registration', d: 'Valid BR certificate (PDF, JPG or PNG)' },
                { l: 'Food Safety License', d: 'Required for all food establishments' }
              ].map((f, i) => (
                <div key={i} className="w-full p-xl rounded-[2.5rem] border-2 border-dashed border-divider bg-surface flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')]" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-md group-hover:scale-110 transition-transform border border-divider shadow-elevation-sm">
                      <FileArrowUp size={28} weight="bold" className="text-primary" />
                    </div>
                    <p className="font-display text-lg font-bold text-text mb-1">{f.l}</p>
                    <p className="font-body-sm text-text-muted">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-xl pb-safe">
        <button 
          onClick={next} 
          className="w-full h-16 bg-primary hover:bg-primary-hover text-white font-display text-lg font-black rounded-[2rem] shadow-elevation-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-primary/20"
        >
          {step === 3 ? (
            <>
              <Check size={24} weight="bold" />
              Complete Registration
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={24} weight="bold" />
            </>
          )}
        </button>
      </div>
    </main>
  );
}

export default function MerchantOnboardingPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-background" />}>
      <MerchantOnboardingContent />
    </Suspense>
  );
}

// Simple Icon placeholders since we don't have all imports at top for brevity in logic
const Tag = ({size, weight, className}) => <div className={className} style={{width:size, height:size}} />;
const Phone = ({size, weight, className}) => <div className={className} style={{width:size, height:size}} />;
const Hash = ({size, weight, className}) => <div className={className} style={{width:size, height:size}} />;

