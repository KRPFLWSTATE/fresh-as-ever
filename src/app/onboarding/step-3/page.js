import { redirect } from 'next/navigation';

export default function OnboardingStep3AliasPage() {
  redirect('/onboarding?step=3');
}
