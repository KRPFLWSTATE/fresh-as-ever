import { redirect } from 'next/navigation';

export default function OnboardingStep1AliasPage() {
  redirect('/onboarding?step=1');
}
