# Fresh As Ever — Final Screen Map & Antigravity Handoff

## Why are there duplicates?
In the Stitch workspace, every time a screen is refined (like when we integrated the logo or fixed alignments), a new version with a unique ID is created. This ensures we never lose progress, but it results in multiple versions of the same page on the canvas. 

**For your export to Antigravity, you should only use the "Gold Standard" IDs listed below.** These versions include the final logo, hyper-local Colombo content, and pixel-perfect alignments.

## The Gold Standard Screen Map (35 Screens)

| Portal | Route | Gold Standard ID |
| :--- | :--- | :--- |
| **Global** | Landing Page | {{DATA:SCREEN:SCREEN_24}} |
| | Error Page | {{DATA:SCREEN:SCREEN_106}} |
| | 404 Not Found | {{DATA:SCREEN:SCREEN_66}} |
| **Auth** | Login (OTP/Email) | {{DATA:SCREEN:SCREEN_101}} |
| **Customer** | Onboarding (3-step) | {{DATA:SCREEN:SCREEN_13}}, {{DATA:SCREEN:SCREEN_119}}, {{DATA:SCREEN:SCREEN_31}} |
| | Discover Feed | {{DATA:SCREEN:SCREEN_18}} |
| | Bag Detail | {{DATA:SCREEN:SCREEN_11}} |
| | Checkout | {{DATA:SCREEN:SCREEN_33}} |
| | Orders List | {{DATA:SCREEN:SCREEN_38}} |
| | Order Detail (QR) | {{DATA:SCREEN:SCREEN_79}} |
| | Leave Review | {{DATA:SCREEN:SCREEN_40}} |
| | Favourites | {{DATA:SCREEN:SCREEN_27}} |
| | Profile Hub | {{DATA:SCREEN:SCREEN_115}} |
| | Profile Edit | {{DATA:SCREEN:SCREEN_85}} |
| | Customer Support | {{DATA:SCREEN:SCREEN_49}} |
| | Notifications Hub | {{DATA:SCREEN:SCREEN_98}} |
| | Payment Methods | {{DATA:SCREEN:SCREEN_89}} |
| **Merchant** | Dashboard | {{DATA:SCREEN:SCREEN_110}} |
| | Bags Inventory | {{DATA:SCREEN:SCREEN_53}} |
| | Create Bag | {{DATA:SCREEN:SCREEN_84}} |
| | Edit Bag | {{DATA:SCREEN:SCREEN_86}} |
| | Order Verification | {{DATA:SCREEN:SCREEN_44}} |
| | Finance Overview | {{DATA:SCREEN:SCREEN_87}} |
| | Payout History | {{DATA:SCREEN:SCREEN_82}} |
| | Analytics | {{DATA:SCREEN:SCREEN_25}} |
| | Merchant Onboarding | {{DATA:SCREEN:SCREEN_57}} |
| | Merchant Profile | {{DATA:SCREEN:SCREEN_126}} |
| | Merchant Settings | {{DATA:SCREEN:SCREEN_117}} |
| **Admin** | Admin Dashboard | {{DATA:SCREEN:SCREEN_99}} |
| | Merchant List | {{DATA:SCREEN:SCREEN_37}} |
| | Merchant Detail Review | {{DATA:SCREEN:SCREEN_67}} |
| | Platform Orders | {{DATA:SCREEN:SCREEN_107}} |
| | Complaints Mgmt | {{DATA:SCREEN:SCREEN_89}} |
| | Settlements | {{DATA:SCREEN:SCREEN_72}} |
| | Promo Mgmt | {{DATA:SCREEN:SCREEN_92}} |

## Antigravity Handoff Prompt (Copy-Paste)
"I have the final 35 Stitch screens ready for Fresh As Ever. I've audited the workspace and there are several duplicates due to iterative design refinements. Please ignore any IDs not found in the 'Gold Standard' list. Please pull the following specific IDs and map them to their corresponding routes in `src/app`. All screens use the Plus Jakarta Sans font and the deep teal/burnt amber design system defined in `DESIGN.md`.

[Insert the table above here]"