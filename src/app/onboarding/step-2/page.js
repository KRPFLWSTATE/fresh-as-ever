import { redirect } from 'next/navigation';

export default function OnboardingStep2AliasPage() {
  redirect('/onboarding?step=2');
}
