/** Web mirror of mobile onboarding moments — keep step copy aligned. */

export const ONBOARDING_TOTAL_STEPS = 4;

const HERO_STEP_1_REMOTE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCOWYCZvQLKy8whSUNsd2rPYN-YUVUTaEMqTXRlvNs03BZIwIVhhWNIQkaXhBWqQJZnmRIong6XtgmExK9wpLEnayX1W9EHcnH4ezmrawTU5CLdVDGxSCsSe2-rsu66FW8UMdzIObGxE7xjomkI_KF57Mh8ryB-bBKW5ynlstnPN25oPG-xsQnP3dCYr_eew0REjmDrM4S_AwIG5EEo_epdyMgtvCYCvaSTjW69fylpxG50Ztr0ynmHvb1zL-z-cVcOBAcKnwqGdC0';
const HERO_STEP_2_REMOTE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDg_c5734kppJSZ4skic_mS08X57Jt-1DCYQL8dkXmyWn7IiHvIrccvnhR1pgnTabJi5EjN_qR4kZBJIjsdKY2nnuuJYzFAQAatVRdxSTch9tMqsiWNm1RNKaRXjp2ilIYM0o0a4La6peq1VvGJ4Q0ETvfXiHfdNUHsf4pDXN0KG80tHyeG6HoAPs-JrGYYqIjSDCIMTghPpyYNxTT8W83HVnjk4ktb8qziccxBzS0kIgRwz69umTD_rNe9DrXL2PIBrHc2i4MYikg';
const HERO_STEP_3_REMOTE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMP2akqcAJvi1CRyxawUxd_O9TRrqrY3UC9ECKCgl6Oyyv6pfv2foEw63lGyxBej9cRQ2LHC3Mb3ZRFp5dKLds43IQzOfL0IG3pcJCbBZYoN4cQmsL0coakp-dbxA-MMX7x13hM7IQa4UZIazu2ti4HKQZuJ4pHSYGHpiEOizfzl48VvsK0CM-9cTZB0H5qe0d9dgbDb5YpN0p8s767te5R8-LhcjkPUvWphByIvcEbCW9iGIAUkQ-YeKF1Ndxc6keaS2ou1UVG38';

/** Public paths under `/illustrations/onboarding/` (see `public/illustrations/onboarding/`). */
export const ONBOARDING_HERO_PATHS = {
  1: '/illustrations/onboarding/hero-1.jpg',
  2: '/illustrations/onboarding/hero-2.jpg',
  3: '/illustrations/onboarding/hero-3.jpg',
};

export const ONBOARDING_STEPS = [
  {
    step: 1,
    title: 'Discover Nearby Deals',
    body: 'Find high-quality surplus food from premium bakeries and cafes in your neighborhood before they close.',
    layout: 'hero-copy-dots',
    heroSrc: ONBOARDING_HERO_PATHS[1],
    heroSrcRemote: HERO_STEP_1_REMOTE,
    heroAlt: 'Customer rescuing food illustration',
    heroAspect: '4 / 5',
    heroBorderRadius: 24,
  },
  {
    step: 2,
    title: 'Reserve with Ease',
    body: "Secure a delicious rescue bag with a single tap before they vanish. It's fast, rewarding, and saves perfect food.",
    layout: 'hero-dots-copy',
    heroSrc: ONBOARDING_HERO_PATHS[2],
    heroSrcRemote: HERO_STEP_2_REMOTE,
    heroAlt: 'Browsing nearby rescue bags illustration',
    heroAspect: '4 / 5',
    heroBorderRadius: 12,
  },
  {
    step: 3,
    title: 'Quick Pickup',
    body: 'Show your 6-digit code at the counter to collect your Rescue Bag — no queue required.',
    layout: 'dots-hero-copy',
    heroSrc: ONBOARDING_HERO_PATHS[3],
    heroSrcRemote: HERO_STEP_3_REMOTE,
    heroAlt: 'Pickup and impact illustration',
    heroAspect: '1',
    heroBorderRadius: 12,
  },
  {
    step: 4,
    title: "You're set to rescue.",
    body: "Turn on notifications and we'll tell you when fresh bags drop near you.",
    layout: 'hero-dots-copy',
    heroSrc: ONBOARDING_HERO_PATHS[2],
    heroSrcRemote: HERO_STEP_2_REMOTE,
    heroAlt: 'Get started with Fresh As Ever',
    heroAspect: '4 / 5',
    heroBorderRadius: 12,
  },
];

export function getOnboardingStep(step) {
  return ONBOARDING_STEPS.find((s) => s.step === step) ?? ONBOARDING_STEPS[0];
}

export function getOnboardingHeroSrc(step) {
  const meta = getOnboardingStep(step);
  return meta.heroSrc ?? meta.heroSrcRemote;
}
