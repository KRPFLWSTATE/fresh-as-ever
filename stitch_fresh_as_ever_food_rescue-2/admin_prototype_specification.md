# Fresh As Ever — Admin Operational Prototype Specification

## Core Path: Platform Stewardship & Growth
Focuses on the administrator's workflow for maintaining platform quality and financial integrity.

### 1. Growth & Quality Control
- **Admin Dashboard ({{DATA:SCREEN:SCREEN_58}})**
    - "Pending Merchant Approvals" -> **Merchant List ({{DATA:SCREEN:SCREEN_37}})**
- **Merchant List ({{DATA:SCREEN:SCREEN_37}})**
    - Filter: "Pending" -> Select "Ceylon Brews" -> **Merchant Application Review ({{DATA:SCREEN:SCREEN_67}})**
- **Merchant Application Review ({{DATA:SCREEN:SCREEN_67}})**
    - "Approve Merchant" -> **Approval Success State (Simulated)**

### 2. Financial Integrity
- **Admin Dashboard ({{DATA:SCREEN:SCREEN_58}})**
    - "Weekly Settlements" -> **Settlements Management ({{DATA:SCREEN:SCREEN_32}})**
- **Settlements Management ({{DATA:SCREEN:SCREEN_32}})**
    - Select "The Bread Company" -> **Payout Detail ({{DATA:SCREEN:SCREEN_62}})**
- **Payout Detail ({{DATA:SCREEN:SCREEN_62}})**
    - "Confirm & Release Payout" -> **Settlement Finalized**

### 3. Issue Resolution
- **Admin Dashboard ({{DATA:SCREEN:SCREEN_58}})**
    - "Open Complaints" -> **Complaints Management ({{DATA:SCREEN:SCREEN_89}})**
- **Complaints Management ({{DATA:SCREEN:SCREEN_89}})**
    - "Resolve Dispute" -> **Audit Logs ({{DATA:SCREEN:SCREEN_42}})** (Record created)

## Governance Standards
- **Clarity:** Financial data and status changes require secondary confirmation.
- **Traceability:** Every major action (approvals, payouts, resolutions) is logged in the Audit Logs.
- **Consistency:** Uses the 'Admin Console' Navigation Drawer for high-density information architecture.
