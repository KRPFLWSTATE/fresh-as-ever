---
name: Fresh As Ever
description: >
  Premium Sri Lankan surplus food rescue marketplace. Warm, trustworthy,
  local, modern. Pickup-first. Savings-first. Never preachy.

colors:
  primary:
    value: "#01696f"
    description: Deep teal — primary actions, active states, links, focus rings
  primary-hover:
    value: "#0c4e54"
    description: Hover state for primary interactive elements
  primary-active:
    value: "#0f3638"
    description: Pressed/active state for primary buttons
  primary-highlight:
    value: "#d0e8e6"
    description: Teal tint — used for selected chips, active nav backgrounds, focus halos
  accent:
    value: "#da7101"
    description: Burnt amber — rescue prices, urgency badges, countdown timers, savings callouts
  accent-hover:
    value: "#c55700"
    description: Hover state for accent-colored interactive elements
  accent-highlight:
    value: "#fde8cc"
    description: Amber tint — used for price pill backgrounds and soft urgency surfaces
  background:
    value: "#f7f6f2"
    description: Warm off-white page background — never pure white
  surface:
    value: "#ffffff"
    description: Card and modal surfaces — floats on background with shadow
  surface-2:
    value: "#f3f0ec"
    description: Secondary surface — input backgrounds, skeleton loaders, section dividers
  divider:
    value: "#e2dfd9"
    description: Borders, separators, table rules
  text:
    value: "#1a1a1a"
    description: Primary text — headings and body
  text-muted:
    value: "#6b6762"
    description: Secondary text — metadata, captions, merchant names, helper text
  text-faint:
    value: "#b5b2ad"
    description: Placeholder text, disabled labels, timestamps
  success:
    value: "#437a22"
    description: Confirmed, collected, approved states
  error:
    value: "#c0392b"
    description: Errors, rejections, destructive actions
  warning:
    value: "#da7101"
    description: Warnings share the accent amber — consistent association

  dark:
    background:
      value: "#141412"
      description: Dark mode page background — warm near-black, not cold grey
    surface:
      value: "#1c1b18"
      description: Dark mode cards and modals
    surface-2:
      value: "#252420"
      description: Dark mode secondary surface
    divider:
      value: "#2e2c28"
      description: Dark mode borders and separators
    text:
      value: "#e8e5df"
      description: Dark mode primary text
    text-muted:
      value: "#8a8680"
      description: Dark mode secondary text
    text-faint:
      value: "#5a5753"
      description: Dark mode placeholder and disabled text
    primary:
      value: "#4f98a3"
      description: Dark mode teal — lighter for readability on dark surfaces
    primary-highlight:
      value: "#1e3335"
      description: Dark mode teal tint surface
    accent:
      value: "#fdab43"
      description: Dark mode amber — brighter for visibility on dark backgrounds
    accent-highlight:
      value: "#3a2a10"
      description: Dark mode amber tint surface

typography:
  display:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "2rem"
    fontWeight: "700"
    lineHeight: "1.2"
    description: App logo, splash screens only
  h1:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "1.5rem"
    fontWeight: "700"
    lineHeight: "1.3"
    description: Page titles
  h2:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "1.25rem"
    fontWeight: "600"
    lineHeight: "1.35"
    description: Section headings
  h3:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "1.125rem"
    fontWeight: "600"
    lineHeight: "1.4"
    description: Card titles, modal headings
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "1rem"
    fontWeight: "400"
    lineHeight: "1.6"
    description: Primary body text
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "0.9375rem"
    fontWeight: "400"
    lineHeight: "1.6"
    description: Secondary body, descriptions
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "0.875rem"
    fontWeight: "400"
    lineHeight: "1.5"
    description: Helper text, captions
  label:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "0.875rem"
    fontWeight: "500"
    lineHeight: "1.4"
    description: Form labels, button text, nav labels
  label-caps:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "0.75rem"
    fontWeight: "600"
    lineHeight: "1.4"
    letterSpacing: "0.05em"
    textTransform: "uppercase"
    description: Status badges, category chips, section meta labels
  price:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "1.375rem"
    fontWeight: "700"
    lineHeight: "1.2"
    description: Rescue price displayed in accent amber — the hero number on a card
  price-original:
    fontFamily: "Plus Jakarta Sans"
    fontSize: "0.9375rem"
    fontWeight: "400"
    lineHeight: "1.4"
    textDecoration: "line-through"
    description: Original retail value shown crossed out in text-muted above rescue price

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  page-x: "16px"
  page-x-md: "24px"
  page-x-lg: "32px"

rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  full: "9999px"

elevation:
  sm: "0 1px 3px rgba(30, 27, 20, 0.07)"
  md: "0 4px 14px rgba(30, 27, 20, 0.09)"
  lg: "0 12px 36px rgba(30, 27, 20, 0.13)"

motion:
  duration-fast: "120ms"
  duration-base: "180ms"
  duration-slow: "250ms"
  easing: "cubic-bezier(0.25, 0.1, 0.25, 1)"
  button-press-scale: "0.97"

components:
  button-primary:
    background: "{colors.primary}"
    color: "#ffffff"
    borderRadius: "{rounded.md}"
    fontFamily: "{typography.label.fontFamily}"
    fontSize: "{typography.label.fontSize}"
    fontWeight: "{typography.label.fontWeight}"
    height: "48px"
    paddingX: "20px"
    hoverBackground: "{colors.primary-hover}"
    activeBackground: "{colors.primary-active}"
    activeTransform: "scale(0.97)"
    description: Full-width on mobile. No gradients ever. Single primary action per screen.
  button-ghost:
    background: "transparent"
    border: "1.5px solid {colors.primary}"
    color: "{colors.primary}"
    borderRadius: "{rounded.md}"
    height: "48px"
    paddingX: "20px"
    description: Used for secondary actions alongside a primary button.
  button-danger:
    background: "{colors.error}"
    color: "#ffffff"
    borderRadius: "{rounded.md}"
    height: "48px"
    description: Destructive actions only — cancel, delete, suspend.
  card-bag:
    background: "{colors.surface}"
    borderRadius: "{rounded.lg}"
    shadow: "{elevation.md}"
    padding: "16px"
    imageAspectRatio: "16/9"
    imageRadius: "{rounded.md}"
    description: >
      Core product unit. Must answer at a glance: what, where, when, how many left, how much.
      Food photo or warm illustrated category placeholder — never a grey box.
      Merchant name in text-muted above the bag title. Rescue price large in accent.
      Original price struck through in text-muted. Quantity badge in accent-highlight
      when 3 or fewer remaining.
  input:
    background: "{colors.surface}"
    border: "1.5px solid {colors.divider}"
    borderRadius: "{rounded.md}"
    height: "48px"
    paddingX: "14px"
    focusBorder: "{colors.primary}"
    focusRing: "0 0 0 3px {colors.primary-highlight}"
    errorBorder: "{colors.error}"
    description: Label always above input. No floating labels. Placeholder in text-faint.
  badge-status:
    borderRadius: "{rounded.full}"
    paddingX: "10px"
    paddingY: "4px"
    fontSize: "{typography.label-caps.fontSize}"
    fontWeight: "{typography.label-caps.fontWeight}"
    letterSpacing: "{typography.label-caps.letterSpacing}"
    textTransform: "uppercase"
    description: >
      approved = success green background + white text.
      pending = accent-highlight background + accent text.
      suspended = error red background + white text.
      live = primary-highlight + primary text.
  chip-category:
    background: "{colors.primary-highlight}"
    color: "{colors.primary}"
    borderRadius: "{rounded.full}"
    paddingX: "10px"
    paddingY: "4px"
    fontSize: "{typography.label-caps.fontSize}"
    fontWeight: "{typography.label-caps.fontWeight}"
    description: Category hint on bag cards — bakery, café, mixed meals, groceries, other.
  nav-bottom:
    height: "64px"
    background: "{colors.surface}"
    borderTop: "1px solid {colors.divider}"
    activeColor: "{colors.primary}"
    inactiveColor: "{colors.text-faint}"
    shadow: "0 -2px 12px rgba(30,27,20,0.06)"
    description: >
      4 tabs — Discover, Orders, Favourites, Profile. Icons from Phosphor Icons only.
      No emoji. Active tab: teal icon + teal label. Inactive: text-faint.
  nav-sidebar:
    width: "240px"
    background: "{colors.surface}"
    borderRight: "1px solid {colors.divider}"
    activeBackground: "{colors.primary-highlight}"
    activeColor: "{colors.primary}"
    activeAccent: "3px solid {colors.primary}"
    description: >
      Merchant and admin dashboards. Active nav item has left teal accent bar,
      teal text, and light teal background. Section category labels in label-caps + text-faint.
  skeleton:
    background: "{colors.surface-2}"
    shimmerColor: "rgba(255,255,255,0.5)"
    borderRadius: "{rounded.md}"
    description: Warm-tinted shimmer. Never cold grey pulse.
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
