# Customer shelf E2E — Appium verification (2026-05-30)

Device: iPhone 17 Pro simulator (377DAC99-B79C-4B05-BB34-DBA1D160038D)  
Session: customer logged in  
Demo shelf: `freshasever://shelves/00000000-0000-0000-0000-000000000201` (Bakehouse Kollupitiya)

## Result: PASS

| Step | Screen | Evidence | Key assertions |
|------|--------|----------|----------------|
| 1 | Clearance shelf (deep link) | `01-shelf-deep-link.png` | Header, pickup countdown, shelf notes, item savings/retail |
| 2 | ShelfReview | `02-shelf-review.png` | Not blank; 2 line items; subtotal + savings |
| 3 | Checkout | `03-checkout.png` | Order Summary, You Save Rs. 240, Reserve Now |

## Page source highlights

- Shelf: `Pickup by 00:40`, `[Demo] Today's clearance shelf`, `Save 44%` on rows
- Review: `Review shelf`, `Subtotal LKR 300 · You save LKR 240`, `Continue to checkout`
- Checkout: `Original Value Rs. 540`, `You Save − Rs. 240`, `Reserve Now`

## Not observed this run

- Halal banner (Bakehouse demo outlet may not be halal-certified)
- Sold-out row styling (no sold_out items in visible viewport; yogurt row has qty controls disabled pattern available in schema)
