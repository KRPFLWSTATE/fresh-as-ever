# Fresh As Ever — Full Platform Interactive Wiring Specification

## Overview
This specification defines the interactive transitions between the three primary user portals (Customer, Merchant, Admin) to create a cohesive platform experience.

## 1. The Customer Journey (Discovery to Rescue)
- **Landing ({{DATA:SCREEN:SCREEN_19}})** -> "Join Waitlist" -> **Waitlist Success ({{DATA:SCREEN:SCREEN_55}})**
- **Landing ({{DATA:SCREEN:SCREEN_19}})** -> "Login" -> **Auth ({{DATA:SCREEN:SCREEN_64}})**
- **Auth ({{DATA:SCREEN:SCREEN_64}})** -> OTP Verify -> **Onboarding 1 ({{DATA:SCREEN:SCREEN_34}})**
- **Onboarding 1** -> **Onboarding 2 ({{DATA:SCREEN:SCREEN_91}})** -> **Onboarding 3 ({{DATA:SCREEN:SCREEN_12}})** -> "Get Started" -> **Discover ({{DATA:SCREEN:SCREEN_18}})**
- **Discover ({{DATA:SCREEN:SCREEN_18}})** -> Select "Java Lounge" -> **Bag Detail ({{DATA:SCREEN:SCREEN_8}})**
- **Bag Detail ({{DATA:SCREEN:SCREEN_8}})** -> "Reserve Now" -> **Checkout ({{DATA:SCREEN:SCREEN_28}})**
- **Checkout ({{DATA:SCREEN:SCREEN_28}})** -> "Confirm" -> **Reservation Success ({{DATA:SCREEN:SCREEN_26}})** -> **Rescue Confirmed ({{DATA:SCREEN:SCREEN_68}})**

## 2. The Merchant Journey (Listing to Handover)
- **Merchant Onboarding 1 ({{DATA:SCREEN:SCREEN_57}})** -> **Step 2 ({{DATA:SCREEN:SCREEN_66}})** -> **Step 3 ({{DATA:SCREEN:SCREEN_52}})** -> **Step 4 ({{DATA:SCREEN:SCREEN_90}})** -> **Dashboard ({{DATA:SCREEN:SCREEN_88}})**
- **Dashboard ({{DATA:SCREEN:SCREEN_88}})** -> "Live Monitor" -> **Live Monitor ({{DATA:SCREEN:SCREEN_73}})**
- **Live Monitor ({{DATA:SCREEN:SCREEN_73}})** -> "Verify Code" -> **Orders & Verification ({{DATA:SCREEN:SCREEN_44}})** -> "Complete Handover" -> **Payout Detail ({{DATA:SCREEN:SCREEN_65}})**

## 3. The Admin Journey (Governance to Growth)
- **Admin Dashboard ({{DATA:SCREEN:SCREEN_61}})** -> "Merchant Approvals" -> **Merchant Review ({{DATA:SCREEN:SCREEN_70}})**
- **Admin Dashboard ({{DATA:SCREEN:SCREEN_61}})** -> "System Logs" -> **Audit Logs ({{DATA:SCREEN:SCREEN_45}})**
- **Admin Dashboard ({{DATA:SCREEN:SCREEN_61}})** -> "Settlements" -> **Settlements Management ({{DATA:SCREEN:SCREEN_35}})**

## Interaction Standards
- **Global Transition:** 250ms Fade + Slide Up as per {{DATA:DOCUMENT:DOCUMENT_85}}.
- **Context Preservation:** Navigation drawers and bottom bars remain stable across sibling transitions.