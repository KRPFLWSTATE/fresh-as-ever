export const CELEBRATION_COPY = {
  reservation: {
    headline: "You're in.",
    subcopy: "Your rescue bag is secured. Save your pickup code — you'll need it at the counter.",
    codeLabel: 'Pickup code',
    primaryCta: 'View order & QR',
    secondaryCta: 'Keep exploring',
  },
  rescue: {
    headline: 'Rescue confirmed.',
    subcopy: 'Thank you for making a difference — your bag is waiting at pickup.',
    primaryCta: 'View order detail',
    secondaryCta: 'Back to discover',
  },
};

export function getCelebrationCopy(variant = 'reservation') {
  return CELEBRATION_COPY[variant] ?? CELEBRATION_COPY.reservation;
}
