# Fresh As Ever — Final Development Handoff Specification

## 1. Design System Summary
- **Primary Font:** Plus Jakarta Sans (400, 500, 600, 700)
- **Core Palette:** 
    - Background: `#f7f6f2` (Warm Off-White)
    - Primary: `#01696f` (Deep Teal)
    - Accent: `#da7101` (Burnt Amber)
- **Radius Strategy:** 10px (md) for buttons/inputs, 16px (lg) for cards.
- **Icons:** Phosphor Icons only. **NO EMOJIS.**

## 2. Component Standards
- **Buttons:** 48px height, 10px radius, 14px 500w text.
- **Cards:** White surfaces, elevation.md shadows, 16px internal padding.
- **Inputs:** Labels above, 1.5px border, teal focus ring.

## 3. Localization Defaults
- **Currency:** Rs. (e.g., Rs. 850)
- **Location:** Colombo, Sri Lanka (Hubs: Colombo 03, 07, etc.)
- **Merchants:** The Bread Company, Java Lounge, Butter Boutique, Green Garden Cafe.

## 4. Interaction & Motion
- **Transitions:** 250ms Fade + Slide Up.
- **Press States:** Scale(0.97).
- **Loading:** Warm-tinted skeleton shimmer.

## 5. Development Notes for Antigravity
- All CSS variables are defined in the root of the exported code.
- Screen names in the ZIP file match the functional roles (e.g., `customer-discover.html`, `merchant-dashboard.html`).
- Ensure `Plus Jakarta Sans` is linked in the `<head>` of your main layout.
