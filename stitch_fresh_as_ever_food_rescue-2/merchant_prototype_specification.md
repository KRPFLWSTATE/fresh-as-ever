# Fresh As Ever — Merchant Rush-Hour Prototype Specification

## Core Path: The "Rush Hour" Handover
Focuses on the merchant's staff experience during the peak pickup window.

### 1. Monitoring & Preparation
- **Merchant Dashboard ({{DATA:SCREEN:SCREEN_83}})**
    - "Active Pickups" alert -> **Live Merchant Monitor ({{DATA:SCREEN:SCREEN_70}})**
- **Live Merchant Monitor ({{DATA:SCREEN:SCREEN_70}})**
    - Real-time updates as customers approach or arrive.
    - Card: "Sarah Jenkins" (Customer Arrived) -> **Order Verification ({{DATA:SCREEN:SCREEN_41}})**

### 2. Verification & Handover
- **Order Verification ({{DATA:SCREEN:SCREEN_41}})**
    - "Enter 4-Digit Code" -> **Verification Success (Simulated)**
    - "Verify & Handover" -> **Rescue Confirmed! ({{DATA:SCREEN:SCREEN_65}})** (Merchant View)

### 3. Inventory & Post-Handover
- **Bags Inventory ({{DATA:SCREEN:SCREEN_64}})**
    - Shows updated quantity after successful handover.
- **Merchant Orders ({{DATA:SCREEN:SCREEN_41}})**
    - Filter "Collected" -> Shows the completed rescue.

## Operational Standards
- **Urgency Signals:** Countdown timers and arrival status use accent amber (`#da7101`).
- **Feedback:** Immediate visual confirmation on code entry.
- **Efficiency:** Minimal clicks from monitor to verification.