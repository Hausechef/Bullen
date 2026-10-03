# Bullenhaus Trading Platform User Manual

Version: 1.0
Audience: Public visitors, clients, trade administrators, platform administrators, CRM-facing staff, compliance reviewers, finance operators, support operators, and technical administrators.
Scope: This manual explains how every role should use the Bullenhaus Trading Platform and its trading administration tools. It covers login, trading workflows, account operations, risk controls, admin approvals, support workflows, and operational responsibilities.

---

## 1. Platform Overview

The Bullenhaus Trading Platform is a web-based trading and investment environment for crypto, forex, metals, and pre-market investment products. It includes a public landing and authentication area, a client trading area, and a protected administrative area for operational staff.

The platform is divided into three main zones:

- Public access zone: marketing page, registration, login, password recovery, and legal pages.
- Client trading zone: dashboard, markets, trading terminal, portfolio, transactions, referrals, KYC, notifications, support, tools, documentation, rewards, and settings.
- Trading administration zone: admin overview, user management, KYC review, deposit review, withdrawal review, market control, pre-market control, transactions, CRM sync, support inbox, and system settings.

The main system objective is to let clients manage their trading account while giving operations staff strict control over identity verification, money movement, platform configuration, and market simulation or override tools.

---

## 2. Role Model and Access Rules

The platform uses role-based access control. A user account has one primary role, and that role determines which pages and actions are available.

### 2.1 Roles

| Role | Primary Purpose | Main Access |
|---|---|---|
| Public Visitor | Explore the platform before creating an account. | Public login page, registration, password recovery, legal pages. |
| Client | Trade, invest, deposit, withdraw, complete KYC, request support, and manage account settings. | `/trade/*` client trading zone. |
| Trade Admin | Operate trading administration workflows without full CRM administration authority. | `/trade/*` and `/admin/*`. |
| Admin | Full platform administrator with access to trading admin and selected cross-zone controls. | `/trade/*`, `/admin/*`, and admin-only switching where enabled. |
| CRM Agent | Work with CRM leads and client communication in the CRM zone. | CRM zone only; no trading/admin access unless the user also has a trading role. |
| Manager | Supervise CRM pipeline and team work. | CRM zone only; no trading/admin access unless explicitly assigned. |
| Director | View broader CRM and management reporting. | CRM zone only; no trading/admin access unless explicitly assigned. |
| CRM Admin | Configure CRM-specific workflows. | CRM admin zone; no trading admin access unless also assigned admin/trade_admin permissions. |
| Compliance Reviewer | Review KYC and account status when assigned through admin permissions. | Usually `/admin/kyc`, user profiles, support evidence, and transaction history. |
| Finance Operator | Review and process deposits and withdrawals when assigned through admin permissions. | Usually `/admin/deposits`, `/admin/withdrawals`, and `/admin/transactions`. |
| Support Operator | Handle support tickets and client assistance when assigned through admin permissions. | Usually `/admin/support`, client context, and support history. |
| Technical Administrator | Maintain configuration, feeds, CRM sync, and system settings. | Usually `/admin/settings`, `/admin/market-control`, `/admin/crm-sync`, and deployment tools outside the UI. |

### 2.2 Practical Access Matrix

| Area | Public | Client | Trade Admin | Admin | CRM Roles |
|---|---:|---:|---:|---:|---:|
| Login and registration | Yes | Yes | Yes | Yes | Yes |
| Legal pages | Yes | Yes | Yes | Yes | Yes |
| Trading dashboard | No | Yes | Yes | Yes | No |
| Markets | No | Yes | Yes | Yes | No |
| Trading terminal | No | Yes | Yes | Yes | No |
| Pre-market client purchase | No | Yes | Yes | Yes | No |
| Portfolio | No | Yes | Yes | Yes | No |
| Deposits and withdrawals as a client | No | Yes | Yes | Yes | No |
| Referrals, rewards, notifications, tools, docs | No | Yes | Yes | Yes | No |
| Admin overview | No | No | Yes | Yes | No |
| User management | No | No | Yes | Yes | No |
| KYC queue | No | No | Yes | Yes | No |
| Deposit approval | No | No | Yes | Yes | No |
| Withdrawal approval | No | No | Yes | Yes | No |
| Market control | No | No | Yes | Yes | No |
| Pre-market control | No | No | Yes | Yes | No |
| CRM sync panel | No | No | Yes | Yes | CRM admin may have separate CRM tools |
| CRM admin switch | No | No | No | Yes | CRM admin in CRM zone |

Important rule: client-facing trading pages are available to `client`, `trade_admin`, and `admin`. Trading administration pages are available to `trade_admin` and `admin`.

---

## 3. Public Visitor Manual

Public visitors can access the platform without a session. They can read the landing page, view selected market preview content, create an account, sign in, reset a password, and review legal information.

### 3.1 Open the Platform

1. Go to the platform URL.
2. The platform opens on the public login and marketing page.
3. Review the market preview, available product categories, and platform information.
4. Use the top navigation to reach public sections such as Markets, Premarket, iTools, and Platform.

### 3.2 Register a New Account

1. Open the registration page from the public entry flow.
2. Enter a valid email address.
3. Choose a strong password with at least eight characters.
4. Submit the registration form.
5. If email confirmation is enabled, open the confirmation link sent to the registered email.
6. After confirmation, sign in and complete the client onboarding steps.

Operational note: newly registered users normally receive the client role unless staff manually assigns a different role.

### 3.3 Sign In

1. Open the login panel.
2. Enter the account email or login.
3. Enter the password.
4. Select the sign-in action.
5. The platform redirects according to the account role.

Expected redirect behavior:

- Client accounts go to the trading dashboard.
- Admin or trade admin accounts go to the trading administration dashboard.
- CRM staff accounts go to the CRM zone when using the shared login entry.

### 3.4 Recover a Password

1. Open Forgot password.
2. Enter the account email address.
3. Submit the request.
4. Check the email inbox for the reset link.
5. Open the reset link and choose a new password.
6. Return to login and sign in with the new password.

### 3.5 Review Legal Pages

Public legal pages include contact, terms, privacy, anti-money-laundering information, and corporate information. Users should review these pages before trading or submitting personal documents.

---

## 4. Client Role Manual

The client role is for end users who trade, invest, deposit, withdraw, complete KYC, ask for help, and manage account settings.

### 4.1 Client Navigation

The client sidebar contains the main trading modules:

- Dashboard
- Markets
- Trade
- Pre-Market
- Portfolio
- Transactions
- Rewards
- Referrals
- Notifications
- KYC
- Settings
- Help

Admin and trade admin users can also see a switch to the admin area when using the trading zone.

### 4.2 Trading Dashboard

The dashboard is the main client workspace. It summarizes the account and provides quick access to market activity.

Dashboard widgets can include:

- Total Balance
- Equity
- Unrealized P&L
- Realized P&L
- Margin Available
- Market chart
- Account performance panels
- Gamification or rewards widgets
- Live chat entry
- Current market or product highlights

Recommended daily workflow:

1. Review total balance and equity.
2. Check unrealized P&L before opening new trades.
3. Verify available margin.
4. Review the chart and market movement.
5. Open the trading terminal only after confirming account status and market conditions.

### 4.3 Markets Page

The Markets page helps clients review available instruments before trading.

Typical market categories:

- Crypto pairs
- Forex pairs
- Metals
- Other configured market instruments

For each instrument, review:

- Current or simulated price
- Directional change
- Spread or pricing behavior where shown
- Market status
- Available trading actions

Best practice:

- Do not open a trade from a price movement alone.
- Review account margin, stop-loss plan, and trade size first.
- Confirm whether the instrument feed is live, demo, fixed, or admin-controlled.

### 4.4 Trading Terminal

The Trade page is the active order-entry workspace. It combines market selection, chart analysis, and order placement.

Core terminal areas:

- Symbol or market selector
- Price chart
- Chart drawing toolbar
- Indicator controls
- Order entry panel
- Open positions or order status
- Risk and margin indicators

Chart tools may include:

- Select
- Trend Line
- Freehand
- Pan Chart
- Rectangle
- Add Text
- Zoom In
- Clear all drawings

Indicators may include:

- EMA
- SMA
- Bollinger Bands
- RSI
- MACD

### 4.5 Placing a Trade

Before placing a trade:

1. Confirm the selected instrument.
2. Review the current bid/ask or execution price.
3. Choose buy or sell.
4. Enter trade size.
5. Review leverage or margin effect where applicable.
6. Set stop-loss and take-profit if available.
7. Confirm the estimated cost, exposure, and margin impact.
8. Submit the order.
9. Verify that the order or position appears in the portfolio or order list.

Important risk controls:

- Trade only with funds you can afford to risk.
- Use stop-loss levels for volatile markets.
- Avoid increasing position size after a loss without a written plan.
- Confirm margin availability before opening leveraged exposure.
- Close or reduce positions if margin becomes unsafe.

### 4.6 Order Types

The platform may support different order modes depending on configuration.

Common order concepts:

- Market order: executes at the current available price.
- Limit order: waits for a specified price or better.
- Stop order: triggers after the market reaches a stop price.
- Stop-loss: closes or reduces a position to limit loss.
- Take-profit: closes or reduces a position when the target is reached.

If an order remains pending, review:

- Whether the target price has been reached.
- Whether the market is active.
- Whether the account has sufficient balance or margin.
- Whether the instrument has admin overrides or paused feed status.

### 4.7 Portfolio

The Portfolio page shows the client's trading inventory and performance.

Typical portfolio sections:

- Open positions
- Closed positions
- Spot holdings
- Pending orders
- Filled or canceled orders
- Profit and loss
- Margin or exposure summary

Client workflow:

1. Open Portfolio after placing a trade.
2. Confirm the position size, direction, entry price, and current P&L.
3. Review any pending orders.
4. Close positions from the available close action when needed.
5. Check realized P&L after a position is closed.

### 4.8 Transactions

The Transactions page is where clients request deposits, withdrawals, and review money movement status.

Common transaction types:

- Deposit
- Withdrawal

Common payment methods:

- Credit Card
- IBAN Transfer
- Payment Link
- Crypto, where configured
- Other, where enabled by staff

Common transaction statuses:

- Pending
- Waiting for Payment Details
- Processing
- Completed
- Rejected
- Failed

Client deposit workflow:

1. Open Transactions.
2. Choose Deposit.
3. Enter the deposit amount.
4. Select the payment method.
5. Submit the request.
6. Wait for staff payment instructions when the method requires manual details.
7. Complete the payment using only the details shown in the platform or confirmed by authorized support.
8. Monitor the transaction status until Completed.

Client withdrawal workflow:

1. Open Transactions.
2. Choose Withdrawal.
3. Enter the withdrawal amount.
4. Select or provide the required payout details.
5. Submit the request.
6. Wait for finance review.
7. Monitor status updates.

Important finance rule: a withdrawal request is not final until approved by authorized operations staff. Additional identity or payment checks may be requested.

### 4.9 Crypto Deposit Safety

When crypto deposit is enabled:

1. Confirm the network before sending funds.
2. Send only the supported asset and network.
3. Copy the destination address carefully.
4. Never type a wallet address manually if copy is available.
5. Save the transaction hash.
6. Submit proof only through the platform or authorized support channel.

Warning: sending unsupported tokens or using the wrong network can permanently lose funds.

### 4.10 Pre-Market

The Pre-Market page lets eligible clients purchase shares or units in configured pre-market assets.

Client workflow:

1. Open Pre-Market.
2. Review available assets.
3. Select an asset.
4. Review fixed or live price information.
5. Enter the desired number of shares or units.
6. Review total cost.
7. Confirm that KYC status and balance requirements are satisfied.
8. Open and review the contract modal.
9. Accept the electronic contract only if all terms are understood.
10. Submit the purchase.

The contract flow may include:

- Investment terms
- Risk disclosure
- Non-transferability terms
- Price fixation or pricing rules
- Platform terms
- Electronic signature confirmation

Clients should not purchase pre-market assets without reviewing liquidity limits, risk disclosures, and contract restrictions.

### 4.11 KYC

KYC is the identity verification process. Some features may be limited until KYC is approved.

Client workflow:

1. Open KYC.
2. Enter or confirm personal details.
3. Upload requested identity documents.
4. Submit the KYC request.
5. Wait for review.
6. Respond to support if additional documents are requested.

KYC statuses may include:

- Not Submitted
- Pending
- Approved
- Rejected

If KYC is rejected:

1. Review the rejection reason if provided.
2. Correct the issue.
3. Upload new or clearer documents.
4. Resubmit.

### 4.12 Referrals

The Referrals page helps clients invite other users when referral features are enabled.

Client workflow:

1. Open Referrals.
2. Copy the personal referral link or code.
3. Share it only through compliant channels.
4. Track referred users and reward status where shown.

Compliance rule: do not promise guaranteed profit, guaranteed returns, or risk-free trading when sharing a referral.

### 4.13 Rewards and Gamification

The Rewards page may show achievements, progress, levels, milestones, or incentives.

Use this page to:

- Track platform activity rewards.
- Review unlocked milestones.
- Monitor progress toward future rewards.
- Understand reward conditions.

Rewards do not reduce trading risk and should not be treated as investment advice.

### 4.14 Notifications

The Notifications page shows account and platform messages.

Notification types may include:

- KYC updates
- Deposit updates
- Withdrawal updates
- Trade or portfolio notices
- Support replies
- Security or account notices
- Platform announcements

Client workflow:

1. Open Notifications regularly.
2. Filter unread messages where available.
3. Open any message requiring action.
4. Mark messages as read after review.

### 4.15 Support

The Support page is the approved channel for assistance.

Client workflow:

1. Open Help or Support.
2. Enter a valid reply email if requested.
3. Choose a subject or category.
4. Describe the issue clearly.
5. Include transaction IDs, trade IDs, screenshots, or wallet hashes when relevant.
6. Submit the ticket.
7. Watch Notifications or email for replies.

Support request quality checklist:

- State what happened.
- State what was expected.
- Include exact date and time.
- Include the page name.
- Include transaction or order ID.
- Include screenshots when possible.

### 4.16 Institutional Tools

The Tools page provides platform utilities for more advanced users. Available tools depend on configuration.

Possible use cases:

- Research support
- Market utilities
- Operational calculators
- Account-related analysis
- Trading preparation

Tools are informational unless explicitly marked as order-entry controls.

### 4.17 Documentation

The Docs page provides platform instructions and educational guidance.

Clients should use it to review:

- Account creation steps
- Trading basics
- Transaction rules
- Safety guidance
- Platform limitations

### 4.18 Settings

The Settings page manages profile and account preferences.

Common settings:

- Display name
- Avatar
- Contact information
- Country or profile details
- Language preference
- Security-related account details where available

Clients should keep contact information current so support and compliance teams can reach them.

---

## 5. Trade Admin Role Manual

The trade admin role is for staff who operate trading administration without necessarily owning the broader CRM or company administration scope.

Trade admins can access:

- Trading client pages for operational review.
- Admin dashboard.
- User management.
- KYC queue.
- Deposits.
- Withdrawals.
- Market control.
- Pre-market control.
- Transactions.
- CRM sync panel.
- Support inbox.
- System settings where permitted.

Trade admins should not use client-facing trading access to impersonate clients unless the company has an approved procedure for support investigation.

---

## 6. Admin Role Manual

The admin role has the broadest platform access in the trading system.

Admin responsibilities:

- Maintain role assignments.
- Review and correct user account data.
- Approve or reject KYC.
- Approve or reject deposits.
- Approve or reject withdrawals.
- Review transactions.
- Control market overrides.
- Manage pre-market offerings.
- Monitor support tickets.
- Configure system settings.
- Review CRM sync status.
- Coordinate with technical administrators.

Admin users must treat all financial and identity actions as auditable operational decisions.

---

## 7. Admin Navigation

The admin sidebar contains:

- Overview
- User Manager
- KYC Queue
- Deposits
- Withdrawals
- Market Control
- Pre-Market Control
- Transactions
- Support Inbox
- System Config

Some builds also expose:

- CRM Sync
- Switch Zone to Trade Platform
- Admin-only switch to CRM Admin

---

## 8. Admin Overview

The Overview page is the operational command center.

It may show:

- Total users
- Pending deposits
- Pending withdrawals
- Trading volume
- Pending KYC
- System status indicators
- Recent events
- Alerts

Daily admin checklist:

1. Check pending KYC count.
2. Check pending deposits.
3. Check pending withdrawals.
4. Review critical support tickets.
5. Review system alerts.
6. Check market-control status.
7. Confirm no unexpected CRM sync failures.

---

## 9. User Manager

The User Manager page controls account data and role assignment.

Admin can typically:

- Search users by UUID, email, name, phone, country, role, or KYC status.
- Open a user detail view.
- Edit name, phone, country, role, and KYC status.
- Add balance.
- Remove balance.
- Set balance.
- Review account metadata.

### 9.1 Change a User Role

1. Open User Manager.
2. Search for the user.
3. Open the edit panel.
4. Select the new role.
5. Confirm the change.
6. Verify the user has only the access intended.

Role change safety:

- Do not assign admin or trade_admin unless approved.
- Do not use CRM roles as a substitute for trading admin roles.
- Document why privileged access was granted.
- Remove elevated access after temporary work is complete.

### 9.2 Adjust User Balance

Balance operations are sensitive.

Use cases:

- Correcting an operational error.
- Applying an approved manual adjustment.
- Reversing an incorrect transaction.
- Adding approved promotional credit if company policy allows it.

Balance adjustment workflow:

1. Confirm the user's identity.
2. Confirm the operational reason.
3. Review transaction history.
4. Choose add, remove, or set balance.
5. Enter the exact amount.
6. Save the change.
7. Record the reason in the internal operating log if the UI does not require it.

Never adjust balance as a substitute for completing deposit or withdrawal approval unless the finance procedure explicitly allows it.

---

## 10. KYC Queue

The KYC Queue is used to review identity verification submissions.

Admin workflow:

1. Open KYC Queue.
2. Review pending submissions.
3. Open the client record.
4. Check submitted identity details.
5. Review uploaded documents.
6. Compare data consistency.
7. Approve if the submission satisfies policy.
8. Reject if the submission is incomplete, invalid, fraudulent, or unreadable.

Approval checklist:

- Name matches documents.
- Document appears valid and readable.
- Country and profile information are consistent.
- The account is not duplicated or suspicious.
- Any required proof of address is acceptable.
- The user is not on an internal restriction list.

Rejection checklist:

- Give a clear reason where the workflow supports it.
- Do not disclose sensitive fraud-detection details.
- Ask for a better document if image quality is the issue.
- Escalate suspicious submissions to compliance.

---

## 11. Deposit Review

The Deposits page is used to review client deposit requests and payment evidence.

Admin can typically:

- View pending deposit requests.
- Send payment details to the client.
- Approve a deposit.
- Reject a deposit.
- Review payment method and client information.

### 11.1 Send Payment Details

1. Open Deposits.
2. Select a pending deposit.
3. Choose Send Payment Details if the method requires instructions.
4. Select the payment method tab, such as Credit Card, IBAN, or Link.
5. Enter only approved payment details.
6. Send the details.
7. Confirm the transaction status updates as expected.

### 11.2 Approve a Deposit

1. Confirm the payment was actually received.
2. Match amount, currency, user, and payment reference.
3. Open the deposit request.
4. Select Approve.
5. Confirm the action.
6. Verify the transaction moves to Completed.
7. Verify the client balance is credited once.

Important control: deposit approval should be atomic. A completed deposit must not be credited twice.

### 11.3 Reject a Deposit

Reject a deposit when:

- No payment was received.
- The payment evidence is invalid.
- The amount does not match and cannot be resolved.
- The sender is suspicious or unauthorized.
- Compliance requires rejection.

Workflow:

1. Open the deposit request.
2. Review evidence.
3. Select Reject.
4. Confirm rejection.
5. Notify the client through support or platform notification if required.

---

## 12. Withdrawal Review

The Withdrawals page is used to process client withdrawal requests.

Admin workflow:

1. Open Withdrawals.
2. Review pending requests.
3. Confirm the user's identity and KYC status.
4. Confirm available balance and open exposure.
5. Review payout details.
6. Run fraud and compliance checks.
7. Approve or reject the request.

Approval checklist:

- KYC approved.
- Withdrawal amount is valid.
- User has sufficient available balance.
- Payout details match the account or approved beneficiary.
- No active restriction, support hold, or compliance flag applies.
- Finance team can execute payment.

Rejection checklist:

- State the operational reason internally.
- Use client-safe wording in client-facing messages.
- Do not expose security logic.
- Ask for corrected details when the issue is fixable.

---

## 13. Transaction Review

The Transactions admin page provides a broader list of client financial activity.

Use it to:

- Search deposit and withdrawal history.
- Review status changes.
- Trace client balance movements.
- Investigate support tickets.
- Confirm audit details.
- Reconcile operations with finance records.

Admin review workflow:

1. Search by user, transaction ID, method, or status.
2. Open the relevant item.
3. Compare transaction state with payment evidence.
4. Check related user account details.
5. Escalate inconsistencies to finance or technical support.

---

## 14. Market Control

Market Control is a sensitive admin tool used to configure pricing behavior for available instruments.

Controls may include:

- Fix or unfix a symbol price.
- Pause or resume feed behavior.
- Adjust volatility.
- Adjust spread.
- Apply market scenarios such as bull, bear, sideways, crash, or news.
- Reset symbol state.

### 14.1 Use Market Control Safely

1. Open Market Control.
2. Select the instrument.
3. Review current live, demo, fixed, or overridden state.
4. Choose the required action.
5. Enter the exact value if fixing price.
6. Save or apply the control.
7. Verify the client-facing market display.
8. Record why the control was used.

Risk warning:

- Price controls affect client perception and possibly order behavior.
- Do not use market overrides without authorization.
- Reset overrides after test windows or incident response actions.
- Always communicate operational incidents to the correct internal channel.

---

## 15. Pre-Market Control

Pre-Market Control is used to manage assets offered through the client Pre-Market page.

Admin tasks may include:

- Create or update pre-market assets.
- Configure asset name, symbol, description, and pricing.
- Set availability.
- Control display order.
- Review purchase activity.
- Update offering status.

Admin workflow:

1. Open Pre-Market Control.
2. Review the current list of assets.
3. Add or edit the asset.
4. Confirm pricing and terms.
5. Verify visibility and availability.
6. Save changes.
7. Open the client Pre-Market page to confirm display.

Pre-market safety:

- Do not publish an offering without legal and compliance review.
- Ensure price, contract terms, and risk disclosures match the approved offer.
- Disable an asset immediately if pricing or legal details are wrong.

---

## 16. CRM Sync Panel

The CRM Sync panel monitors and controls data movement between trading and CRM workflows.

It may show:

- Connection status
- Synced records
- Pending records
- Dead-letter records
- API key or shared secret status
- Endpoint configuration
- Data policy
- Audit log

Admin workflow:

1. Open CRM Sync.
2. Check connection status.
3. Review pending and failed sync counts.
4. Inspect dead-letter entries.
5. Verify endpoint configuration.
6. Rotate or hide secrets according to policy.
7. Escalate repeated sync failures to technical administrators.

Security rule: never paste CRM sync secrets into chat, support tickets, screenshots, or public documentation.

---

## 17. Support Inbox

The Support Inbox is where staff review tickets submitted from the client support page.

Support workflow:

1. Open Support Inbox.
2. Filter or sort tickets by status and priority.
3. Open the ticket.
4. Review client email, message, and context.
5. Check related account, transaction, or trade records.
6. Respond or escalate.
7. Update ticket status.

Escalation paths:

- Deposit or withdrawal issue: finance operator.
- KYC document issue: compliance reviewer.
- Login or account access issue: technical administrator.
- Market pricing issue: trade admin or technical administrator.
- Suspicious behavior: compliance and security owner.

Support response rules:

- Be clear and concise.
- Do not promise guaranteed outcomes.
- Do not disclose internal fraud logic.
- Do not request passwords or private keys.
- Use only approved payment and identity channels.

---

## 18. System Config

System Config contains administrative configuration.

Possible configuration areas:

- Platform settings
- Feature toggles
- Payment settings
- Admin preferences
- Localization behavior
- Operational thresholds
- Integration settings

Configuration workflow:

1. Open System Config.
2. Identify the setting to change.
3. Review the impact.
4. Save the change.
5. Test the affected user workflow.
6. Record the change when required.

Configuration safety:

- Avoid changing multiple unrelated settings at once.
- Test client and admin behavior after a sensitive setting changes.
- Coordinate changes that affect payments, KYC, pricing, or access control.

---

## 19. CRM-Facing Staff Guidance

CRM roles such as agent, manager, director, and CRM admin do not automatically receive trading platform access. Their responsibilities are usually separate from client trading operations.

CRM staff should:

- Use CRM pages for lead and communication workflows.
- Avoid requesting trading admin privileges unless required.
- Escalate trading, deposit, withdrawal, or KYC operations to authorized trading admins.
- Avoid giving clients financial, legal, or tax advice.
- Never ask a client for passwords, private keys, seed phrases, or remote wallet access.

When a CRM conversation requires trading platform action:

1. Capture the client request in CRM.
2. Verify the client identity according to CRM procedure.
3. Escalate to support, finance, compliance, or trade admin.
4. Document the handoff.
5. Do not independently change trading account state unless explicitly authorized.

---

## 20. Compliance Reviewer Guidance

Compliance reviewers are responsible for identity, risk, and policy checks when using admin access.

Main tasks:

- Review KYC submissions.
- Investigate suspicious account patterns.
- Review transaction concerns.
- Escalate high-risk cases.
- Maintain a clear audit trail.

Compliance checklist:

- Verify documents and profile consistency.
- Check account behavior and duplicate indicators.
- Review unusual deposit or withdrawal patterns.
- Check support history for risk signals.
- Apply company policy consistently.
- Keep sensitive evidence inside approved systems.

---

## 21. Finance Operator Guidance

Finance operators handle money movement workflows when assigned admin permissions.

Main tasks:

- Review deposits.
- Send approved payment instructions.
- Confirm received funds.
- Approve or reject deposits.
- Review withdrawal requests.
- Confirm payout details.
- Coordinate off-platform payment execution where required.
- Reconcile platform records with finance records.

Finance controls:

- Four-eyes review may be required for large transactions.
- Do not approve a deposit before funds are confirmed.
- Do not approve a withdrawal if KYC or compliance checks are incomplete.
- Do not send payment details through unauthorized channels.
- Record exceptions.

---

## 22. Technical Administrator Guidance

Technical administrators support deployment, integrations, market data, incident response, and system health.

Main tasks:

- Monitor environment configuration.
- Maintain Supabase or backend integrations.
- Verify CRM sync behavior.
- Investigate feed or market-control incidents.
- Validate authentication and role behavior.
- Support audit logging and recovery.
- Coordinate deployments.

Technical safety:

- Do not expose service keys to the browser.
- Do not store secrets in source control.
- Rotate credentials after suspected exposure.
- Verify migrations and schema drift before deployment.
- Test critical flows after a deployment.

---

## 23. Common End-to-End Workflows

### 23.1 New Client Onboarding

1. Public visitor registers.
2. Client confirms email if required.
3. Client signs in.
4. Client completes KYC.
5. Compliance or admin reviews KYC.
6. Client requests deposit.
7. Finance confirms and approves deposit.
8. Client starts trading or pre-market purchase.

### 23.2 Deposit to Trading

1. Client submits deposit request.
2. Admin sends payment details if needed.
3. Client completes payment.
4. Finance confirms receipt.
5. Admin approves deposit.
6. Platform credits balance.
7. Client verifies balance in dashboard or transactions.
8. Client places trade.

### 23.3 Withdrawal

1. Client submits withdrawal request.
2. Finance verifies available balance.
3. Compliance verifies account status.
4. Admin approves or rejects request.
5. Finance executes payment if approved.
6. Client receives status update.

### 23.4 KYC Rejection and Resubmission

1. Client submits documents.
2. Compliance rejects due to missing or invalid evidence.
3. Client receives status update.
4. Client uploads corrected documents.
5. Compliance reviews again.
6. Account restrictions are lifted only after approval.

### 23.5 Market Incident

1. Client or staff reports unusual pricing.
2. Trade admin checks Market Control.
3. Technical admin checks feed status.
4. Admin pauses or fixes price only if approved.
5. Support communicates approved guidance.
6. Technical admin restores normal feed.
7. Admin records the incident.

---

## 24. Security Rules for All Roles

All users:

- Use a strong password.
- Never share passwords.
- Never share private keys or seed phrases.
- Use only official platform URLs.
- Check payment details carefully.
- Report suspicious messages.
- Keep email access secure.

Clients:

- Do not send funds to addresses outside the platform instructions.
- Do not trade based on support chat pressure.
- Do not accept guaranteed-return claims.
- Review every transaction before submission.

Staff:

- Do not use personal channels for payment instructions.
- Do not screenshot secrets or identity documents into public tools.
- Do not change balances without authorization.
- Do not elevate roles without approval.
- Do not disclose internal security logic.

Administrators:

- Review privileged access regularly.
- Remove unnecessary admin roles.
- Monitor failed syncs and system alerts.
- Validate deployment changes.
- Keep audit records for sensitive actions.

---

## 25. Troubleshooting

### 25.1 Cannot Sign In

Client actions:

1. Check email spelling.
2. Confirm password.
3. Use Forgot password.
4. Check whether email confirmation is required.
5. Contact support if the account is locked or pending activation.

Staff actions:

1. Verify the user exists.
2. Check role and status.
3. Check whether the email is confirmed.
4. Escalate authentication errors to technical administration.

### 25.2 Trading Page Does Not Load

1. Refresh the browser.
2. Confirm the user is logged in.
3. Confirm the role has access.
4. Check whether the platform is under maintenance.
5. Staff should check browser console, backend status, and market feed status.

### 25.3 Deposit Not Credited

Client actions:

1. Confirm transaction status in Transactions.
2. Check whether payment details were followed exactly.
3. Provide payment reference or transaction hash.
4. Open a support ticket.

Staff actions:

1. Confirm funds were received.
2. Check duplicate or mismatched payment.
3. Review deposit request status.
4. Approve only after confirmation.

### 25.4 Withdrawal Delayed

Client actions:

1. Check withdrawal status.
2. Confirm KYC approval.
3. Confirm payout details are correct.
4. Watch notifications for requests.

Staff actions:

1. Check KYC and compliance status.
2. Check available balance.
3. Verify payout details.
4. Escalate blocked or suspicious requests.

### 25.5 Pre-Market Purchase Blocked

Possible causes:

- KYC is not approved.
- Balance is insufficient.
- Asset is inactive.
- Quantity is invalid.
- Contract was not accepted.
- Admin pricing or availability changed.

### 25.6 Notifications Missing

1. Refresh the page.
2. Check unread and all filters.
3. Confirm account session.
4. Staff should verify notification records and backend connectivity.

---

## 26. Role-Based Checklists

### 26.1 Client Checklist

- Review dashboard balance and equity.
- Complete KYC before requesting restricted features.
- Use Transactions for deposits and withdrawals.
- Review portfolio after each trade.
- Read notifications.
- Use Support for issues.
- Keep settings up to date.

### 26.2 Trade Admin Checklist

- Review pending operational queues daily.
- Verify market-control status.
- Review KYC, deposits, withdrawals, and support.
- Confirm admin actions are authorized.
- Avoid unnecessary balance edits.
- Escalate technical or compliance anomalies.

### 26.3 Admin Checklist

- Review privileged users.
- Monitor overview metrics.
- Review pending financial actions.
- Verify KYC queue.
- Check support inbox.
- Check CRM sync.
- Review system settings after any change.

### 26.4 Finance Checklist

- Match every deposit to real received funds.
- Verify withdrawal eligibility.
- Confirm payout details.
- Maintain reconciliation records.
- Escalate suspicious activity.

### 26.5 Compliance Checklist

- Review KYC evidence carefully.
- Watch duplicate or suspicious patterns.
- Document decisions.
- Escalate high-risk users.
- Avoid exposing detection methods.

### 26.6 Support Checklist

- Confirm the user's request.
- Collect exact IDs and timestamps.
- Check account and transaction context.
- Escalate to the right team.
- Avoid asking for passwords or private keys.

### 26.7 Technical Admin Checklist

- Monitor integration health.
- Protect secrets.
- Verify migrations before deploy.
- Test critical user flows.
- Investigate feed and sync failures.

---

## 27. Audit and Recordkeeping

Sensitive actions should be traceable.

Actions that should have an audit trail:

- Role changes.
- KYC approvals and rejections.
- Balance adjustments.
- Deposit approvals and rejections.
- Withdrawal approvals and rejections.
- Market-control overrides.
- Pre-market asset changes.
- CRM sync secret changes.
- System configuration changes.

Audit record should include:

- Who performed the action.
- What changed.
- When it changed.
- Why it changed.
- Which client or transaction was affected.

---

## 28. Operating Principles

For clients:

- Understand risk before trading.
- Keep account details current.
- Use official workflows.
- Ask support when unsure.

For staff:

- Use the least privilege necessary.
- Verify before approving.
- Keep evidence inside approved systems.
- Escalate unclear cases.
- Treat every financial and identity action as auditable.

For administrators:

- Protect privileged access.
- Keep integrations stable.
- Monitor queues and alerts.
- Test after changes.
- Preserve the integrity of client balances, identity records, and transaction history.

---

## 29. Glossary

Admin: A privileged user with broad trading platform administration access.

Balance: The account funds available or recorded for the client.

Client: A trading platform user who can trade, deposit, withdraw, and manage account settings.

CRM Sync: Data synchronization between trading workflows and CRM workflows.

Deposit: A client request to add funds to the platform account.

Equity: Account value after considering current positions and P&L.

KYC: Know Your Customer identity verification process.

Market Control: Admin tool for changing feed, pricing, or simulation behavior.

P&L: Profit and loss.

Pre-Market: Investment area for configured pre-market assets.

Role: Permission category that controls access to pages and actions.

Trade Admin: Operational administrator for trading platform workflows.

Withdrawal: A client request to remove funds from the platform account.
