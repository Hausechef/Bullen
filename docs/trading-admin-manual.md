# Trading Platform Admin Panel — User Manual

This manual describes the user-facing functionality of the Bullenhaus Trading Platform Admin Panel. Each section explains its purpose, what it shows, what it includes, and how it works.

---

## Navigation & Layout

### Purpose
Provides a persistent left sidebar so administrators can move between all admin sections from any page.

### What it shows
- Sidebar with navigation entries for every admin section.
- A header bar showing system status (e.g., "Operational") and the current platform version (e.g., "2.4.0-BETA").
- A "Switch Zone" quick-link to the user-facing Trading interface.
- A "Sign Out" button to terminate the admin session.

### What it includes
Sidebar entries:
- Overview
- User Manager
- KYC Queue
- Deposits
- Withdrawals
- Market Control
- Transactions
- System Config
- Switch Zone (Trade Platform)
- Sign Out

### How it works
Clicking any sidebar item opens the corresponding section in the main content area. The sidebar stays visible while working in any section.

---

## Overview

### Purpose
A high-level dashboard for monitoring the real-time health of the platform.

### What it shows
- **KPIs:** Total Users, Volume Today (completed transfers), Pending Deposits, Pending Withdrawals.
- **Live Transaction Feed:** Stream of the 15 most recent deposits and withdrawals with user names, amounts, and statuses.
- **Global Node Activity:** Status monitor for regional server nodes (e.g., EU_WEST_1, US_EAST_2).
- **Active Alerts:** Visual warnings for pending KYC, deposits, or withdrawals.
- **KYC Summary:** Quick counts of pending vs. total user verifications.

### What it includes
KPI tiles, live feed list, node status monitor, alert banner, KYC summary widget, and a global refresh button.

### How it works
The page loads current platform metrics automatically. Press the refresh button to re-sync all dashboard data on demand.

---

## User Manager

### Purpose
Central directory for managing user accounts, roles, and balances.

### What it shows
For each user: identity (name and email), UUID, role (Client, PRO, ADMIN), KYC status (Verified, Pending), USD balance, and registration date.

### What it includes
- Search bar (by UUID, email, or name).
- Refresh and filter controls.
- Per-user action buttons: **View Details**, **Add Assets**, **Remove Assets**, **Set Balance**.
- Side panel with full user metadata and wallet details (opened via View Details).

### How it works
Type into the search bar to narrow the list. Click **View Details** to open a side panel with full user information. Use **Add Assets**, **Remove Assets**, or **Set Balance** to adjust a user's wallet via pop-up prompts. Setting a balance overwrites the current value.

---

## KYC Queue

### Purpose
Review uploaded identity documents and decide whether to verify each user.

### What it shows
For each user in the queue: client name, email, current balance, number of uploaded files, last update timestamp, and current KYC status.

### What it includes
- Status values: **PENDING**, **VERIFIED**, **REJECTED**, **UNVERIFIED**.
- Filter toggle: **Pending** only or **All Users**.
- Per-row expandable area with a document viewer (images and PDFs).
- Document controls: **View** (opens the document) and **Download**.
- Decision buttons: **Approve** (sets status to VERIFIED) and **Reject** (sets status to REJECTED).

### How it works
Switch the filter between Pending and All Users to find the right account. Expand a row to view uploaded documents, open or download them, then click Approve or Reject to set the final status.

---

## Deposits

### Purpose
Process incoming funding requests submitted by users.

### What it shows
For each deposit: user identity, amount, currency (USD), payment method (e.g., Bank Transfer, Crypto), status, and creation date.

### What it includes
- **Send Details** button — opens a Payment Details Form to send the user instructions or addresses for completing the deposit.
- **Approve** button — marks the deposit as Completed.
- **Reject** button — marks the deposit as Rejected.
- A badge indicating whether payment instructions have already been sent.

### How it works
For new requests, click **Send Details** and fill in the payment instructions the user needs. Once the user has paid, click **Approve** to complete the deposit, or **Reject** if the payment is invalid.

---

## Withdrawals

### Purpose
Process outgoing payout requests from users.

### What it shows
The same fields as Deposits: user, amount, payment method, status, and creation date.

### What it includes
- **Send Details** button — opens a form to provide the admin's payout confirmation or details.
- **Approve** button — finalizes the withdrawal as Completed.
- **Reject** button — finalizes the withdrawal as Rejected.

### How it works
Open a request, send payout details when needed, then approve or reject to close out the withdrawal.

---

## Market Control

### Purpose
Simulate market conditions by overriding asset prices and volatility for symbols on the platform.

### What it shows
- **Global Overrides:** A form to set a fixed price for any symbol (e.g., BTCUSDT), overriding real market data.
- **Forex Volatility Engine:** Controls for specific currency pairs (e.g., EUR/USD).
- Current settings for each managed pair.

### What it includes
Per-pair settings:
- **Manual Price Override** — instantly change the current price.
- **Volatility Slider** — adjust the frequency and intensity of price movements.
- **Spread Slider** — configure the gap between buy and sell prices.
- **Market Scenarios** — one-click presets: **Bull Run**, **Bear Drop**, **Sideways**, **Flash Crash**, **News Spike**.
- **Pause / Resume** — temporarily stop or restart a market.
- **Reset** — restore default settings for the pair.

### How it works
Pick the asset or pair you want to adjust. Use the price field, sliders, or a scenario preset to change behavior. Pause and resume markets as needed, or reset a pair to return to defaults.

---

## Transactions

### Purpose
A read-only audit log of all financial events on the platform.

### What it shows
For each transaction: TXID (shortened), user name and ID, type (Deposit, Withdrawal), amount, status (Completed, Pending, Processing, Rejected), and date/time.

### What it includes
- Searchable list view.
- Search bar to filter by TXID or user.

### How it works
Browse the full log or use the search bar to find a specific TXID or user. This section does not modify data — it is for review only.

---

## CRM Sync

### Purpose
Manage the integration between the trading platform and the CRM, including outgoing webhooks and event delivery.

### What it shows
- **KPIs:** CRM Connection Uptime, Events Synced (24h), Pending Retries, Dead Letter Queue count.
- **Audit Log:** A stream of sync events showing success or failure, target user, and retry counts.
- The platform's **Data Handling Policy** for balances and personal information.

### What it includes
- **Webhook Configuration** — add, edit, delete webhook endpoints; toggle each endpoint between Active and Paused.
- **Secret Management** — configure webhook signing secrets, rotate keys, and toggle **Enable Verification** to sign outgoing payloads.
- **Force Retry** — retry a failed sync event from the audit log.

### How it works
Add or edit webhook endpoints in the configuration area and activate them when ready. Manage signing secrets to keep outgoing payloads verified. Watch the KPIs and audit log to spot failures, and click **Force Retry** on any failed event to resend it.

---

## System Config

### Purpose
Configure platform-wide defaults and security policies.

### What it shows
Current values for each platform setting.

### What it includes
- **Default Starting Balance** — the starting amount given to new accounts.
- **Maintenance Mode** — toggle to enable or disable platform access for users.
- **Require MFA for Admins** — toggle to enforce multi-factor authentication for administrators.
- **Auto-Ban Flagged IPs** — toggle to automatically block VPNs or suspicious IP addresses.

### How it works
Change a value or flip a toggle to update the corresponding policy. Settings apply platform-wide.
