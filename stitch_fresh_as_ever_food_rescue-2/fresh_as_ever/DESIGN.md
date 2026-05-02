---
name: Fresh As Ever
colors:
  surface: '#ffffff'
  surface-dim: '#d7dbda'
  surface-bright: '#f7fafa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f4'
  surface-container: '#ebeeee'
  surface-container-high: '#e6e9e9'
  surface-container-highest: '#e0e3e3'
  on-surface: '#181c1d'
  on-surface-variant: '#3f4949'
  inverse-surface: '#2d3131'
  inverse-on-surface: '#eef1f1'
  outline: '#6f797a'
  outline-variant: '#bec8c9'
  surface-tint: '#01696f'
  primary: '#004f54'
  on-primary: '#ffffff'
  primary-container: '#01696f'
  on-primary-container: '#97e6ec'
  inverse-primary: '#85d3da'
  secondary: '#944b00'
  on-secondary: '#ffffff'
  secondary-container: '#fc8b27'
  on-secondary-container: '#633000'
  tertiary: '#6e3815'
  on-tertiary: '#ffffff'
  tertiary-container: '#8b4f2a'
  on-tertiary-container: '#ffceb5'
  error: '#c0392b'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f0f6'
  primary-fixed-dim: '#85d3da'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#ffb783'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#703700'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68d'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#6e3815'
  background: '#f7f6f2'
  on-background: '#181c1d'
  surface-variant: '#e0e3e3'
  primary-hover: '#0c4e54'
  primary-active: '#0f3638'
  primary-highlight: '#d0e8e6'
  accent: '#da7101'
  accent-hover: '#c55700'
  accent-highlight: '#fde8cc'
  surface-2: '#f3f0ec'
  divider: '#e2dfd9'
  text: '#1a1a1a'
  text-muted: '#6b6762'
  text-faint: '#b5b2ad'
  success: '#437a22'
  dark-background: '#141412'
  dark-surface: '#1c1b18'
  dark-surface-2: '#252420'
  dark-primary: '#4f98a3'
  dark-accent: '#fdab43'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: '1.2'
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: '1.35'
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  price:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '700'
    lineHeight: '1.2'
  price-original:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  page-margin-mobile: 16px
  page-margin-desktop: 32px
---

## Overview

Fresh As Ever is a premium Sri Lankan surplus food rescue marketplace. It connects bakeries, cafés, restaurants, and hotels with urban consumers who want same-day unsold food at a meaningful discount before it is thrown away.

The visual identity must feel like the best café in Colombo on a Saturday morning — warm, a little exciting, and like you have found something worth telling someone about. It earns trust through restraint, not decoration. It earns delight through precision, not animation overload.

The closest emotional reference points are Airbnb (warmth, photography, belonging), Zomato at its best (food-forward card energy), Stripe (typographic discipline, nothing wasted), and Linear (restraint that communicates quality). Fresh As Ever should be able to sit next to any of these and hold its own.

This is a Sri Lankan product targeting urban professionals aged 22–38 in Colombo. They are aspirational, price-conscious but not cheap, and they decide in under 4 seconds while scrolling on an Android mid-range device. The design must respect that reality.

## Colors

The palette is anchored in two non-negotiable values.

**Primary — Deep Teal (`#01696f`):** Not green. Not mint. A serious, rich teal that reads like the Indian Ocean on a clear day. Used for all primary actions: buttons, active navigation states, focus rings, selected chips. It communicates trust, freshness, and local pride without the cliché of generic sustainability green.

**Accent — Burnt Amber (`#da7101`):** The color of warm food, a Sri Lankan sunset, something that smells incredible. Reserved for rescue prices, urgency signals, quantity warnings, and countdown timers. It must never dominate — it appears in precise moments to create a flash of excitement.

**Background — Warm Off-White (`#f7f6f2`):** Never pure white. This subtle warmth is the difference between a sterile hospital and a premium café. All content floats on this.

**Surface — White (`#ffffff`):** Cards sit on the background with a whisper of shadow. The contrast between background and surface is the breathing room that makes the layout feel spacious and premium.

**Dark mode is mandatory from day one.** The dark background (`#141412`) is a warm near-black, not a cold developer terminal grey. Everything in dark mode should feel like a candlelit restaurant — deep, warm, deliberate.

Never use color for decoration. Every color token must serve a function. The primary teal should appear exactly once per screen as the dominant action. Amber appears exactly where urgency or price is the message.

## Typography

**Plus Jakarta Sans exclusively.** This is a modern geometric sans-serif with character — it feels premium but approachable, which is exactly the tension this brand lives in. No other fonts. Not Inter. Not Roboto. Not system fonts unless as CSS stack fallback.

The rescue price is the most important typographic element in the product. It is set in `price` style — 1.375rem, 700 weight, accent amber — large enough to be the first thing the eye finds on a card. The original retail value is crossed out in `price-original` style directly above it in text-muted. This pair is the economic argument for the product, made visible.

All body content is left-aligned. Centered text is reserved for empty states, splash screens, and single-message confirmation screens only.

Nothing is ever smaller than 12px. Every typographic decision should look like it was made by someone who cares.

## Layout

The page background is always `#f7f6f2`. White (`#ffffff`) cards float on it with `elevation.md`. The contrast between background and surface creates natural visual grouping without borders or dividers.

Page outer padding: 16px on mobile, 24px on tablet, 32px on desktop. This is the minimum — never go tighter. Section gaps are a minimum of 24px. Card internal padding is 16px minimum.

The rescue bag card list uses a single-column layout on mobile. Each card occupies full width. On tablet and desktop, a 2-column grid is acceptable. Cards must never feel cramped.

The bottom navigation bar is fixed at the bottom on mobile (64px height) with a soft upward shadow. The sidebar is 240px wide on merchant and admin dashboards, collapsing to a bottom bar on mobile.

## Elevation & Depth

Depth is communicated entirely through shadow, not through borders. The three elevation levels (`sm`, `md`, `lg`) handle all layering needs. Cards use `md`. Modals and bottom sheets use `lg`. Subtle dividers use `sm` only when shadow alone is insufficient.

Never stack shadows. Never add borders to elements that already have shadow. The hierarchy must be clean: background → surface (card) → overlay (modal).

## Shapes

All interactive elements use rounded corners. The system is consistent:
- Small elements (chips, badges, tags): `full` (pill shape)
- Inputs, buttons, card image thumbnails: `md` (10px)
- Cards, modals, bottom sheets: `lg` (16px)
- Large hero sections or full-bleed cards: `xl` (20px)

Never use sharp corners. Never mix radius sizes within the same component family.

## Components

**Rescue Bag Card:** The core product unit. A warm food photograph (or illustrated category placeholder — never a grey box) at 16/9 ratio with `rounded.md`. Below: category chip in teal, merchant name in `body-sm` + `text-muted`, bag title in `h3` + `text`, pickup window in `body-sm` + `text-muted` with a Phosphor clock icon, quantity badge in amber when 3 or fewer remaining, original price struck through, rescue price large in amber. The card as a whole answers: what is it, where, when, how many left, how much.

**Buttons:** Solid teal primary, full-width on mobile. Ghost variant for secondary actions. Danger variant for destructive flows only. One primary button per screen. Press state scales to 0.97 with shadow collapse in 120ms. No gradients ever.

**Inputs:** Label above input, always. No floating labels. Clean bordered input with teal focus ring (`primary-highlight` halo). Error state adds red border and error message below — no red backgrounds or full-screen errors.

**Status Badges:** Pill shape, uppercase tracked label-caps text, 12px. Four semantic states: live (teal), pending (amber), approved (green), suspended (red). Used in admin and merchant dashboards.

**Navigation:** Customer PWA uses 4-tab bottom bar. Merchant and admin use left sidebar on desktop, bottom bar on mobile. Icons are Phosphor Icons exclusively at consistent stroke weight. No emoji anywhere in the navigation.

**Skeletons:** Warm-tinted shimmer on `surface-2` background. Never cold grey pulse animations. Skeletons must match the shape of the content they are replacing exactly.

## Motion

Motion is like breathing — noticed only when it is absent.

- Button press: scale to 0.97, shadow collapse, 120ms
- Page transitions: soft fade-slide, 200ms
- Card entry on scroll: stagger upward 20px with fade, 180ms per card, 30ms delay between cards
- Success confirmation: single clean checkmark draw animation, no confetti
- Error state: gentle red highlight on field, 150ms shake, no full-screen error overlays
- All timings use `cubic-bezier(0.25, 0.1, 0.25, 1)`

Never add motion that does not serve a purpose. Never animate more than 3 elements simultaneously.

## Do's and Don'ts

**Do:**
- Use the warm off-white background on every screen — never pure white as the page background
- Show food photography that is warm, natural light, Sri Lankan context — not studio-white stock photos
- Use Phosphor Icons at consistent stroke weight throughout the entire product
- Show the rescue price large and in amber — it is the primary value proposition
- Give every card image a warm illustrated fallback if no photo exists — never a grey placeholder box
- Support dark mode on every screen from day one
- Breathe — use generous spacing, let elements have room

**Don't:**
- Use emoji anywhere in the product interface — not as icons, not in headings, not in buttons, not anywhere
- Use gradient backgrounds or gradient buttons — ever
- Use pure white (`#ffffff`) as a page background
- Add colored left-border accents to cards
- Center-align body text on content screens
- Use more than one primary button per screen
- Add motion that is decorative rather than functional
- Use any font other than Plus Jakarta Sans
- Create designs that could be described as "clean but boring" — restraint is not the same as emptiness
- Apply any external design theme (Zenith, Aurora, Spatial, Material You defaults) without overriding every token to match this system