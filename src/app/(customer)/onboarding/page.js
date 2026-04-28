'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Discover Nearby Deals",
      desc: "Find surplus food from top bakeries, cafes, and supermarkets in Colombo at roughly 1/3 of the price.",
      icon: "🔍"
    },
    {
      title: "Reserve Instantly",
      desc: "Swipe to confirm your surprise rescue bag. You can pay with your card online or cash when you arrive.",
      icon: "🛍️"
    },
    {
      title: "Collect Your Food",
      desc: "Head over to the store during the pickup window, show your reservation code, and grab your food!",
      icon: "📍"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Mark onboarding as complete (could store in localStorage)
      if (typeof window !== 'undefined') {
        localStorage.setItem('has_seen_onboarding', 'true');
      }
      router.push('/discover');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.skipContainer}>
        <button className={styles.skipButton} onClick={() => router.push('/discover')}>Skip</button>
      </div>

      <div className={styles.carousel}>
        <div className={styles.iconCircle}>
          {steps[step].icon}
        </div>
        <h1 className={styles.title}>{steps[step].title}</h1>
        <p className={styles.description}>{steps[step].desc}</p>
      </div>

      <div className={styles.bottomControls}>
        <div className={styles.dots}>
          {steps.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i === step ? styles.activeDot : ''}`} />
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={handleNext}>
          {step === steps.length - 1 ? 'Start Rescuing' : 'Next'}
        </button>
      </div>
    </div>
  );
}
