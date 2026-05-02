# Fresh As Ever — Interactive Prototype Specification (Customer Journey)

## Core Path: The "Rescue" Loop
This prototype focuses on the primary value proposition: discovery to collection.

### 1. Entry & Onboarding
- **Landing Page ({{DATA:SCREEN:SCREEN_19}})** 
    - CTA: "Join Waitlist" -> **Waitlist Success ({{DATA:SCREEN:SCREEN_51}})**
    - Secondary: "Login" -> **Login & Auth ({{DATA:SCREEN:SCREEN_60}})**
- **Onboarding Carousel**
    - Step 1 ({{DATA:SCREEN:SCREEN_31}}) -> Step 2 ({{DATA:SCREEN:SCREEN_85}}) -> Step 3 ({{DATA:SCREEN:SCREEN_12}})
    - "Get Started" -> **Discover ({{DATA:SCREEN:SCREEN_18}})**

### 2. Discovery & Selection
- **Discover ({{DATA:SCREEN:SCREEN_18}})**
    - Search Bar Focus -> **Search Empty ({{DATA:SCREEN:SCREEN_49}})**
    - Bag Card Click -> **Bag Detail ({{DATA:SCREEN:SCREEN_8}})**
    - Filter "Bakery" -> **No Results ({{DATA:SCREEN:SCREEN_14}})** (Simulated)
- **Bag Detail ({{DATA:SCREEN:SCREEN_8}})**
    - "Allergen Info" -> **Allergen Modal ({{DATA:SCREEN:SCREEN_68}})**
    - "Reserve Now" -> **Checkout ({{DATA:SCREEN:SCREEN_26}})**

### 3. Transaction & Collection
- **Checkout ({{DATA:SCREEN:SCREEN_26}})**
    - "Confirm Reservation" -> **Reservation Success ({{DATA:SCREEN:SCREEN_24}})** -> **Rescue Confirmed! ({{DATA:SCREEN:SCREEN_64}})**
- **Orders ({{DATA:SCREEN:SCREEN_29}})**
    - Active Order Click -> **Order Detail ({{DATA:SCREEN:SCREEN_58}})**
- **Order Detail ({{DATA:SCREEN:SCREEN_58}})**
    - Shows QR code for Merchant handover.

### 4. Impact & Engagement
- **Profile ({{DATA:SCREEN:SCREEN_16}})**
    - "View Impact" -> **Environmental Impact ({{DATA:SCREEN:SCREEN_4}})**
    - "Leave Review" -> **Review ({{DATA:SCREEN:SCREEN_40}})**

## Interaction Standards
- **Transitions:** Soft Fade + Slide Up (250ms) as per {{DATA:DOCUMENT:DOCUMENT_79}}.
- **Loading:** Skeleton screens ({{DATA:SCREEN:SCREEN_52}}) shown during data-heavy transitions.