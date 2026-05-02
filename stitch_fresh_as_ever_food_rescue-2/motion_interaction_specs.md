# Fresh As Ever — Motion & Interaction Specifications

## Core Principles
Motion in Fresh As Ever is purposeful, organic, and restrained. It should feel like a physical interaction in a premium environment — smooth, predictable, and high-quality.

## Easing and Timing
- **Standard Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` (The "Breathable" Curve)
- **Fast:** 120ms — Micro-interactions (button presses, toggles, icon shifts).
- **Base:** 180ms — Small component transitions (chip selection, dropdowns).
- **Slow:** 250ms — Page transitions, modal slide-ins, card entries.

## Interactions
### 1. Button Press
- **Scale:** Down to 97% (`scale(0.97)`)
- **Shadow:** Collapse from `md` to `sm`
- **Duration:** 120ms
- **Return:** Standard easing, 150ms

### 2. Page Transitions
- **Effect:** Soft Fade + Slide Up (20px)
- **Duration:** 250ms
- **Stagger:** Child elements (cards) stagger by 30ms each.

### 3. Card Entrance
- **Effect:** Staggered slide up from bottom.
- **Opacity:** 0 to 1
- **Duration:** 200ms per card
- **Delay:** 30ms stagger between adjacent items.

### 4. Success State (Checkmark)
- **Effect:** Single clean path draw animation.
- **Duration:** 300ms
- **Feedback:** Gentle scale pop at 100%.

### 5. Skeleton Shimmer
- **Background:** `--color-surface-2`
- **Shimmer:** Linear gradient at 45deg, moving left to right.
- **Duration:** 1.5s loop, infinite.

## Forbidden
- No bounce/elastic effects (too playful/immature).
- No rotation (feels busy).
- No full-screen flashes or abrupt cuts.
- No confetti or celebratory particle effects.
