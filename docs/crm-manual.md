# Bullenhaus CRM Manual - All Roles

This manual describes the current Bullenhaus CRM as implemented in the application. It is written for onboarding, training, support, and day-to-day operations across every CRM role.

The CRM worker roles are:

- **Agent** - works assigned leads and clients, calls clients, creates follow-ups, uses scripts, tickets, messages, and AI recommendations.
- **Manager** - supervises agents, assigns leads and clients, reviews team workload, handles KYC, tasks, tickets, scripts, and operational queues.
- **Director** - monitors the whole CRM, team activity, capital flow, VIP clients, telephony, workflows, and AI insights.
- **Admin** - manages CRM workers, AI configuration, all operational modules, and can switch to the trading platform and trading admin zone.
- **CRM Admin (`crm_admin`)** - accepted by route guards as a CRM administrator. It uses the admin-level CRM routes and database privileges where supported.

Non-CRM roles:

- **Client** - uses the trading/client zone, not the CRM zone.
- **Trade Admin (`trade_admin`)** - uses the trading admin zone, not the CRM zone. Some database policies include `trade_admin` for shared records, but the CRM route guard does not admit this role to `/crm`.

## 1. Access And Navigation

### Entry Point

CRM workers enter the CRM through `/crm`.

The redirect behavior is:

- `admin` goes to `/crm/admin`.
- Other accepted CRM workers go to `/crm/dashboard`.

The outer CRM guard allows:

- `agent`
- `manager`
- `director`
- `admin`
- `crm_admin`

If a signed-in user has no allowed CRM role, the app redirects to the unauthorized page.

### Sidebar

The sidebar adapts to the signed-in role. It is the primary navigation for the CRM.

Global sidebar/header elements:

- Bullenhaus logo.
- Command Center navigation.
- Current role badge.
- Logout button.
- Language toggle between English and German where translations exist.
- System status bar with online, latency, secure session, and trading engine indicators.
- AI Core Active indicator.
- Floating Team Chat available on CRM pages.

### Important Permission Rule

Some pages may appear in the sidebar for a role but still be blocked by a route guard or database policy. The most important cases are:

- `/crm/kyc-review` is route-allowed only for `manager`, `director`, `admin`, and `crm_admin`.
- `/crm/admin` is route-allowed only for `admin` and `crm_admin`.
- Workflow Rules appears in several sidebars, but database policies allow workflow CRUD primarily to `admin` and `crm_admin`.
- The phone dialer widget only renders for `agent`.

## 2. Role Access Matrix

| Module | Agent | Manager | Director | Admin | CRM Admin |
| --- | --- | --- | --- | --- | --- |
| Director Dashboard | Sidebar link to `/crm/dashboard` | Sidebar link to `/crm/dashboard` | Yes | Yes | Yes |
| Manager Dashboard | Via role navigation where available | Yes | Yes | Yes | Yes |
| Agent Workspace / Leads | Yes | Yes | Yes | Yes | Yes |
| Lead Kanban | Yes | Yes | Yes | Yes | Yes |
| My Clients | Yes | No sidebar item | No sidebar item | No sidebar item | No sidebar item |
| Clients | Yes | Yes | Yes | Yes | Yes |
| VIP Clients | No dedicated VIP sidebar item | No dedicated VIP sidebar item | Yes | Yes | Yes |
| Tasks | Yes | Yes | Yes | Yes | Yes |
| Support Tickets | Yes | Yes | Yes | Yes | Yes |
| Messages | Yes | Yes | Yes | Yes | Yes |
| Sales Scripts | Yes | Yes | Yes | Yes | Yes |
| KYC Review | Sidebar item, route blocked | Yes | Yes | Yes | Yes |
| Workflow Rules | Visible | Visible | Visible | Visible | Visible |
| Call History | Yes | Yes | Yes | Yes | Yes |
| Telephony | No sidebar item | No sidebar item | Yes | Yes | Yes |
| AI Core Insights | Yes | Yes | Yes | Yes | Yes |
| CRM Admin Panel | No | No | No | Yes | Yes |
| Switch Zone links | No | No | No | Admin only in current layout | CRM admin route access, but sidebar switch is coded for `admin` only |

## 3. Daily Operating Principles

### Data Handling

- Treat all client data as confidential.
- Do not expose internal AI scoring, risk labels, scripts, or operational comments to clients.
- Verify client identity before discussing account details.
- Use KYC Review only for compliance status updates.
- Use AI outputs only as internal recommendations. AI does not approve KYC, deposits, withdrawals, balances, or legal/compliance decisions.

### Status And Accountability

- Every call started through the CRM dialer creates or updates call log records.
- Lead stage changes are logged to lead stage history where the table exists.
- Tasks, tickets, messages, workflows, and scripts store the current user as creator or actor when available.
- Team online status is based on each CRM user's `last_seen_at`, which the CRM layout updates periodically.

### Recommended Workflow

1. Start with the dashboard for your role.
2. Review urgent items: pending tasks, overdue tickets, unassigned leads, KYC queue, and AI risk alerts.
3. Work from the lead/client detail views.
4. Record every follow-up as a task, ticket comment, message, call log, or stage movement.
5. Escalate compliance, finance, platform access, or suspicious behavior to Manager, Director, Admin, or CRM Admin.

## 4. Global CRM Shell

### Purpose

The CRM shell keeps every worker inside a consistent command environment.

### What You See

- Left sidebar with role-specific navigation.
- Top system status bar.
- Page title based on current route.
- AI Core Active badge.
- Language toggle.
- Main content area.
- Team Chat floating button.
- For Agents only: Phone Dialer floating control.

### Common Actions

- **Logout** - ends the current Supabase session.
- **Switch language** - toggles English/German labels where translation keys exist.
- **Open Team Chat** - opens employee-to-employee chat.
- **Open Dialer** - Agent-only; appears as a phone button or from client call actions.

## 5. Team Chat

### Who Uses It

All CRM users with an employee chat record. If no employee record exists, the chat tries to auto-provision one from the signed-in email.

### Purpose

Internal communication between CRM employees.

### What It Includes

- Floating button in the bottom-right corner.
- Conversation list.
- Direct chat creation.
- Employee search.
- Presence indicator.
- Message timeline.
- Typing indicators.
- Text composer.

### How To Use

1. Click the floating chat button.
2. Select an existing conversation or click **New Chat**.
3. Search for a team member.
4. Send messages with Enter.
5. Watch online/offline and typing indicators for availability.

### Operational Notes

- Team Chat uses backend REST plus socket.io.
- If the backend/socket service is not running or unreachable, chat may silently fail or not show.
- Use Team Chat for internal coordination only; do not paste sensitive credentials.

## 6. Phone Dialer

### Who Uses It

Only `agent` currently receives the dialer widget.

### Purpose

Call clients/leads, log outcomes, and use AI-assisted call support.

### Main Tabs

- **Dialpad** - enter or prefill a number and start a call.
- **Recent** - see recent call logs and redial.
- **Copilot** - call support and brief generation where available.
- **Scenario** - guided call scenario mode with AI/client turn simulation.

### Call States

- `idle`
- `dialing`
- `ringing`
- `active`
- final statuses such as `answered`, `completed`, `no_answer`, `busy`, or `failed`

### How To Call

1. Open a client card, lead card, or the floating dialer.
2. Use a prefilled phone number or type one manually.
3. Start the call.
4. Let the call progress through dialing/ringing/active states.
5. End the call.
6. Confirm or review the resulting log in Call History.

### Important Limitations

- The dialer records call activity in CRM data.
- Actual telephony provider integration depends on provider configuration.
- Managers/directors/admins can see call logs, but the floating dialer itself is agent-only in the current UI.

## 7. Director Dashboard

### Path

`/crm/dashboard`

### Main Audience

Director, Admin, CRM Admin. Managers and Agents can also reach this route through their role navigation.

### Purpose

High-level monitoring of CRM health, platform client count, deposits, withdrawals, net capital flow, and CRM team presence.

### What It Shows

- AI insight banner summarizing current platform/client/team state.
- KPI cards:
  - Active Clients
  - Total Deposits
  - Net Capital Flow
  - CRM Team online count
- Capital Flow chart for deposits vs. withdrawals.
- CRM Team list with role and online/last-seen status.

### How To Use

1. Review the KPI cards first.
2. Check whether capital flow is positive or negative.
3. Review the team online panel to confirm staffing coverage.
4. Use the dashboard as a management overview before drilling into Manager Dashboard, Clients, Tickets, or AI Insights.

### Notes

- Online status is based on `last_seen_at`.
- Deposits/withdrawals are calculated from transactions with completed status in the current implementation.

## 8. Manager Dashboard

### Path

`/crm/manager`

### Main Audience

Manager, Director, Admin, CRM Admin.

### Purpose

Supervise agents and assign unassigned leads or clients.

### What It Shows

- KPI strip:
  - Total Deposits
  - Active Clients
  - Team Agents
- Agent roster:
  - Agent name
  - Online status
  - Lead/client load
- Assignment panel:
  - Tabs for Leads and Clients
  - Unassigned counts
  - Per-item assignment dropdown
  - Auto-Assign button

### How To Assign A Lead Or Client

1. Open **Manager Dashboard**.
2. Select the **leads** or **clients** tab.
3. Find the unassigned item.
4. Use **Assign to...** and choose an agent.
5. Wait for the dashboard to refresh.

### How Auto-Assign Works

1. The dashboard collects unassigned items for the selected tab.
2. It sorts agents by current load.
3. It distributes items across agents.
4. It refreshes the dashboard and shows a success message.

### Manager Best Practices

- Keep agent workloads balanced.
- Prioritize new leads, no-answer leads, high-balance clients, and pending KYC.
- Check the agent online status before assigning urgent work.
- Use Tasks for follow-up accountability.

## 9. Agent Workspace / Leads

### Path

`/crm/workspace` and `/crm/leads`

### Main Audience

Agent, Manager, Director, Admin, CRM Admin.

### Purpose

The primary lead-working cockpit. It combines lead pipeline, featured lead, AI next action, task queue, CSV import for privileged roles, and bulk assignment for supervisors.

### What It Shows

- Page header with role context.
- KPI summary:
  - Leads today
  - FTD/deposited leads today
- Featured Lead panel.
- AI Next Best Action panel.
- Task Queue panel.
- Lead Pipeline grouped by stages.
- Lead details modal.
- Create Agent Task modal.

### Lead Stages

The live lead pipeline uses:

- New
- No Answer
- In Progress
- Awaiting Deposit
- Deposited
- Closed
- Lost

If the `leads` table has no records or cannot be used, the UI may derive a fallback pipeline from client KYC status:

- New Inquiries
- Pending KYC
- Approved
- Rejected

In fallback mode, stage movement is not writable.

### Lead Cards

Each lead card may show:

- Name
- Email
- Stage
- Capacity
- Country/source information
- Created date
- Notes action
- Call action
- Stage selector when stage storage is writable

### How Agents Work Leads

1. Open **Agent Workspace**.
2. Start with the Featured Lead.
3. Read the AI Next Best Action.
4. Click **Call Now** if a phone number exists.
5. Open the lead details modal for full contact and source data.
6. Move the lead through stages as the conversation progresses.
7. Create a task for any promised follow-up.

### CSV Lead Upload

Only these roles see lead upload:

- `admin`
- `crm_admin`
- `director`
- `super-admin` / `superadmin` where recognized by layout code

Upload behavior:

- Parses CSV rows.
- Maps common fields such as name, email, phone, country, capacity, notes.
- De-duplicates against existing emails.
- Inserts new leads into the `NEW` stage.
- Shows an import summary modal.

### Bulk Assignment

Bulk assignment is available to:

- `manager`
- `director`
- `admin`
- `crm_admin`
- `super-admin` / `superadmin` where recognized

How to bulk assign:

1. Select leads in the pipeline.
2. Click the assignment action.
3. Search for an agent.
4. Choose the agent.
5. Confirm assignment.
6. Review the result modal.

## 10. Lead Kanban

### Path

`/crm/kanban`

### Main Audience

All CRM worker roles with route access.

### Purpose

Drag-and-drop lead stage management.

### Columns

- New
- No Answer
- In Progress
- Awaiting Deposit
- Deposited
- Closed
- Lost

### Controls

- Search leads.
- Filter by agent.
- Refresh.
- Drag cards between columns.
- Load 30 more leads per column where available.

### How To Move A Lead

1. Find the lead card.
2. Drag it to the target stage column.
3. Release the card.
4. Confirm the success toast.

### Behind The Scenes

- The UI optimistically updates the card.
- The lead row is updated in Supabase.
- A best-effort record is inserted into `lead_stage_history`.
- If an error occurs, the card returns to the original column.

## 11. Clients

### Path

`/crm/clients`

### Main Audience

All CRM worker roles with route access.

### Purpose

Browse all registered clients, inspect balances, KYC status, transactions, and contact details.

### What It Shows

- Search field.
- Tier filters:
  - All
  - Titanium
  - Platinum
  - Silver
- Client cards with:
  - Name and initials
  - Tier
  - Registration date
  - Balance
  - KYC status
  - Phone and country when present
  - New badge for recently created clients
  - Churn Risk badge when risk score is critical

### Card Actions

- **Email** - opens a mailto link.
- **Profile** - opens the client drawer.
- **Call** - shown for agents when a phone number is available.
- More menu:
  - View Profile
  - Send Email
  - Copy Email
  - Copy Phone
  - Call Client for agents with phone number

### Client Drawer Tabs

**Overview**

- Client name, email, internal id fragment.
- Secure email display with unmask toggle.
- Account balance.
- KYC status.
- Total deposited.
- Total withdrawn.
- Start Secure Call button.
- Draft Encrypted Email button.

**Transactions**

- Balance, deposited, withdrawn summary.
- Transaction list with type, amount, status, and date.

**KYC**

- Current KYC status.
- Explanation of status.
- Account tier.
- Registration date.

### Notes

- The call action depends on agent dialer availability.
- Draft Encrypted Email opens a local email flow via `mailto:`.

## 12. VIP Clients

### Path

`/crm/vip`

### Main Audience

Director, Admin, CRM Admin.

### Purpose

Review higher-value clients. The VIP page excludes Silver-tier clients.

### How It Differs From Clients

- Uses the same client card/drawer component.
- Filters out Silver clients.
- Emphasizes Titanium and Platinum tiers.

### Recommended Use

- Review high-balance clients daily.
- Check critical churn risk indicators.
- Confirm KYC status and recent transaction patterns.
- Coordinate follow-ups with Managers and Agents.

## 13. My Clients

### Path

`/crm/my-clients`

### Main Audience

Agent.

### Purpose

Show only clients assigned to the current signed-in agent.

### What It Shows

- KPI strip:
  - Total clients
  - Total balance across assigned clients
  - Clients with phone numbers
- Search field.
- Refresh button.
- Assigned client cards.
- Realtime balance update flash indicators.
- Client drawer with Overview, Transactions, and sometimes Files.

### Client Drawer

**Overview**

- Phone number with Call action.
- Email.
- Country.
- Balance.
- KYC status.
- Registration date.

**Transactions**

- Deposit and withdrawal history.

**Files**

Visible only to:

- `admin`
- `director`
- `manager`
- `superadmin` / `super-admin` where recognized

Files support:

- Upload
- Download
- Delete
- Accepted extensions: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.txt`, `.csv`, `.doc`, `.docx`, `.xls`, `.xlsx`
- Max file size: 15 MB

### Agent Best Practices

- Start with newly assigned clients.
- Call clients with phone numbers.
- Use Messages for written follow-ups.
- Create Tasks for promised callbacks.
- Escalate missing KYC or withdrawal issues to Manager.

## 14. Tasks

### Path

`/crm/tasks`

### Main Audience

All CRM worker roles.

### Purpose

Create, track, complete, and delete follow-ups and internal actions.

### Task Types

- Call
- Email
- Deposit Check
- KYC
- Follow-up
- Manual

### Priorities

- Low
- Medium
- High

### Statuses

- Pending
- In Progress
- Completed
- Cancelled

### What It Shows

- Filters:
  - All
  - Pending
  - Completed
  - Overdue
- Refresh button.
- Task rows with:
  - Type icon
  - Title
  - Client
  - Due time
  - Assignee
  - Priority
  - Complete action
  - Delete action

### Creating A Task

1. Click **New Task**.
2. Enter Title.
3. Choose Type.
4. Choose Priority.
5. Set Due Date if needed.
6. Select Client if needed.
7. Select Assignee if needed.
8. Add Notes.
9. Click **Create Task**.

### Permissions

- Agents can see tasks assigned to them or created by them.
- Managers, Directors, Admins, and CRM Admins can see broader task queues per database policy.
- Insert is allowed for CRM workers.
- Update/delete is broader for supervisors/admin roles.

## 15. Support Tickets

### Path

`/crm/tickets`

### Main Audience

All CRM worker roles.

### Purpose

Manage client support issues with SLA tracking and threaded comments.

### Ticket Statuses

- New
- Open
- Pending
- Resolved
- Closed

### Ticket Priorities

- Low
- Medium
- High
- Critical

### SLA Behavior

When creating a ticket:

- Critical: 4 hours
- High: 24 hours
- Medium: 72 hours
- Low: 168 hours

The ticket list shows SLA status such as overdue or hours/minutes left.

### What It Shows

- Search tickets.
- Filter by status.
- Refresh button.
- Ticket list with:
  - Subject
  - Client
  - Created time
  - SLA indicator
  - Priority
  - Status

### Creating A Ticket

1. Click **New Ticket**.
2. Select Client.
3. Enter Subject.
4. Enter Message.
5. Choose Priority.
6. Click **Create Ticket**.

### Updating A Ticket

1. Open a ticket row.
2. In the drawer, change Status or Priority.
3. Add comments in the conversation box.
4. Send comments with the Send button or Enter.

### Best Practices

- Use Critical only for urgent access, withdrawal, fraud, or platform-blocking issues.
- Update status when waiting on client, compliance, finance, or platform support.
- Leave concise comments after every client contact or internal action.

## 16. Messages

### Path

`/crm/messages`

### Main Audience

All CRM worker roles.

### Purpose

Send and track outbound client communications inside the CRM.

### Channels

- Email
- SMS
- WhatsApp
- Telegram

### Template Categories

- General
- Welcome
- Follow-up
- Deposit
- KYC
- Retention
- Win-back

### What It Shows

- Client list sidebar.
- Client search.
- Message timeline.
- Channel selector.
- Template picker.
- New Template modal.
- Composer.

### Sending A Message

1. Select a client from the left sidebar.
2. Choose channel.
3. Type a message.
4. Optionally insert a template.
5. Use `{name}` to auto-fill the client's first name.
6. Click Send.

### Creating A Template

1. Click **Template**.
2. Enter template name.
3. Select channel.
4. Select category.
5. Enter body.
6. Save.

### Important Limitation

Messages are inserted into the CRM `messages` table with status `sent`. The current implementation does not prove that an external SMS, WhatsApp, Telegram, or email provider actually delivered the message.

## 17. Sales Scripts

### Path

`/crm/scripts` and `/crm/sales-scripts`

### Main Audience

All CRM worker roles can read scripts. Managers, Directors, Admins, and CRM Admins can manage scripts according to database policy.

### Purpose

Store call scripts, objection handlers, closing scripts, and KYC help prompts.

### Categories

- Cold Call
- Follow-up
- Objection Handling
- Closing
- KYC Help
- General

### What It Shows

- Category filters.
- Search scripts.
- Refresh button.
- Script cards with:
  - Title
  - Category
  - Stage
  - Body preview
  - Trigger objections

### Opening A Script

1. Click a script card.
2. Review the full body.
3. Review trigger phrases.
4. Review tags.
5. Click **Copy Script** to copy text.

### Creating A Script

1. Click **New Script**.
2. Enter title.
3. Select category.
4. Write script body.
5. Add trigger phrases separated by commas.
6. Click Create.

### Deleting A Script

1. Open the script drawer.
2. Click Delete.
3. Confirm operationally that the script is no longer needed.

## 18. KYC Review

### Path

`/crm/kyc-review`

### Allowed Roles

- Manager
- Director
- Admin
- CRM Admin

Agents see a sidebar link in current navigation but are blocked by the route guard.

### Purpose

Review client KYC status and approve or reject verification.

### Filters

- Pending
- Verified
- Rejected
- Unverified
- All

### What It Shows

- Search clients.
- Status filter.
- Refresh button.
- Client table:
  - Client name/email
  - KYC status
  - Created date
  - Approve action
  - Reject action

### Approving KYC

1. Filter to Pending or search for a client.
2. Verify the client's documents and compliance evidence outside or inside the applicable compliance process.
3. Click **Approve**.
4. Confirm the success toast.

### Rejecting KYC

1. Locate the client.
2. Confirm that rejection is justified.
3. Click **Reject**.
4. Record follow-up instructions through Messages, Tickets, or Tasks.

### Compliance Warning

The UI changes `users.kyc_status`. It does not itself perform legal/compliance review. Human review remains required.

## 19. Workflow Rules

### Path

`/crm/workflows`

### Main Audience

Visible broadly; effective database CRUD is admin/CRM-admin oriented in the workflow table policies.

### Purpose

Create automation rules that can be enabled, disabled, manually run, and reviewed through an execution log.

### Triggers

- Lead Created
- Lead Stage Changed
- KYC Status Changed
- Ticket Created
- Task Overdue
- Deposit Received

### What It Shows

- Rule count.
- Active/disabled count.
- Execution Log toggle.
- Rule list.
- Expandable rule details.
- Actions:
  - Run now
  - Enable/disable
  - Delete
  - Expand/collapse

### Creating A Workflow

1. Click **New Rule**.
2. Enter rule name.
3. Enter optional description.
4. Choose trigger.
5. Set priority from 1 to 100.
6. Click Create.

The current create modal inserts a default action:

- `create_task`
- task type `follow_up`
- title `Auto: [rule name]`

### Manual Run

1. The workflow must be active.
2. Click the play icon.
3. A workflow execution record is inserted with status `succeeded` and result `Manual trigger from CRM UI`.

### Operational Notes

- Workflows are powerful. Keep rule names clear.
- Use priority to order operational importance.
- Disable a rule before deleting if you want a reversible pause.
- Confirm database policy access if non-admin users cannot load or edit rules.

## 20. Call History

### Path

`/crm/calls`

### Main Audience

All CRM worker roles with route access.

### Purpose

Audit call activity across clients and agents.

### Statuses

- Completed
- Answered
- No Answer
- Busy
- Failed
- Initiated
- Ringing

### What It Shows

- Total calls.
- Completed calls and answer rate.
- Total talk time.
- Search by phone, client, or agent.
- Refresh button.
- Call log table:
  - Phone
  - Client
  - Agent
  - Status
  - Duration
  - Date/time

### How To Use

- Managers review call productivity and follow-up quality.
- Agents confirm their own recent call activity.
- Directors/Admins can audit phone usage and client contact patterns.

## 21. Telephony

### Path

`/crm/telephony`

### Main Audience

Director, Admin, CRM Admin from sidebar. Database policy for full management is admin/director in the reviewed migration.

### Purpose

Manage phone numbers and assign them to agents.

### Provider Cards

The page shows configuration cards for:

- Twilio
- Telnyx
- Vonage

Current cards show provider status as not connected until configured.

### Phone Number Fields

- Phone number
- Label
- Provider
- Assigned agent
- Active/inactive status

### Adding A Number

1. Click **Add Number**.
2. Enter phone number.
3. Add optional label.
4. Choose provider:
   - Manual
   - Twilio
   - Telnyx
   - Vonage
5. Assign to an agent or leave unassigned.
6. Save.

### Managing Numbers

- Reassign with the agent dropdown.
- Toggle active/inactive.
- Unassign with unlink action.
- Delete with trash action.
- Refresh to reload table.

### Agent Visibility

Agents can select their own assigned telephony number per database policy, but they do not have the Telephony page in their sidebar.

## 22. AI Core Insights

### Path

`/crm/ai-insights`

### Main Audience

All CRM worker roles.

### Purpose

Provide internal AI-assisted CRM analysis. AI output is advisory only and requires human review.

### Tabs

- Client Summary
- Lead Scoring
- Next Best Action
- Communication
- Risk Alerts
- Productivity
- Team Insights
- CRM Search

### AI Status

The header shows:

- API Connected
- No API Key

The page can open a Configure API panel. Admin Panel also includes AI API settings with model and OpenRouter key storage.

### Client Summary

Generates:

- Profile overview
- Financial summary
- KYC status
- Risk level
- Key observations
- Data gaps

### Lead Scoring

Scores clients as:

- Hot
- Warm
- Cold
- Risky
- Needs Attention

It includes key signals, reasoning, and confidence.

### Next Best Action

Suggests one CRM-operational action, such as:

- Call the client
- Send a follow-up
- Request KYC completion
- Escalate for manager review
- Create a task

### Communication Analysis

Analyses call transcripts, chat messages, emails, agent notes, or other communication text.

### Risk Alerts

Highlights suspicious patterns, KYC gaps, withdrawal/deposit concerns, or client accounts needing attention.

### Productivity

Helps with templates, scripts, reminders, and operational recommendations.

### Team Insights

Summarizes team-level operational data for managers and directors.

### CRM Search

Lets operators ask natural-language questions about CRM data, for example:

- Which clients have not completed KYC?
- Who has zero balance?
- Which clients have the highest balances?
- What happened this week?

### AI Guardrails

AI must not:

- Make KYC decisions.
- Make deposit/withdrawal decisions.
- Change balances.
- Give financial advice.
- Expose internal scoring or model/provider details to clients.
- Replace human review.

## 23. CRM Admin Panel

### Path

`/crm/admin`

### Allowed Roles

- Admin
- CRM Admin

### Purpose

Manage CRM worker accounts and AI provider settings.

### Worker Management

The worker table includes:

- Name / Email
- Role
- Date added
- Actions

Worker roles selectable in the panel:

- Agent
- Manager
- Director
- Admin

### Stats

- Total Workers
- Admins / Directors
- Managers
- Agents

### Filters

- Search by name or email.
- Filter by role.
- Refresh worker list.

### Creating A Worker

1. Click **Add Worker**.
2. Enter Full Name.
3. Enter Email.
4. Enter Password with at least 8 characters.
5. Select Role.
6. Click **Create Worker**.

Creation uses the `crm-workers` Supabase Edge Function, which performs privileged account creation and enforces admin role server-side.

### Editing A Worker

1. Hover the worker row.
2. Click edit.
3. Change full name or role.
4. Save changes.

### Resetting A Password

1. Hover the worker row.
2. Click reset password.
3. Enter new password.
4. Confirm password.
5. Submit.

### Deleting A Worker

1. Hover the worker row.
2. Click delete.
3. Confirm permanent deletion.

### AI API Settings

The Admin Panel includes **AI Core Insights - API Settings**.

It controls:

- OpenRouter API key.
- AI model.
- AI configuration status.

Operational notes:

- The key is stored server-side through the configured AI settings path.
- The browser never displays the saved key back.
- AI features depend on this configuration.

## 24. Admin Switch Zone

### Visible To

`admin` in the current CRM layout.

### Links

- **Trade Platform** - `/trade/dashboard`
- **Admin Panel** - `/admin`

### Purpose

Move between CRM operations, the client trading platform, and the trading admin zone.

## 25. Role Playbooks

### Agent Playbook

Start of shift:

1. Open `/crm/workspace`.
2. Review Featured Lead and Task Queue.
3. Open `/crm/my-clients`.
4. Check new assigned clients and clients with phone numbers.
5. Open `/crm/tasks` and filter overdue items.
6. Use `/crm/scripts` for call guidance.

During calls:

1. Use the dialer from lead/client cards.
2. Follow scripts and AI next actions.
3. Move lead stage after the call.
4. Create a task for the next promised step.
5. Use Messages for written follow-up.

Escalate to Manager when:

- Client asks for financial, legal, compliance, or withdrawal decisions.
- KYC is unclear.
- A critical ticket exists.
- A client becomes high-value or high-risk.
- A lead needs reassignment.

### Manager Playbook

Start of shift:

1. Open `/crm/manager`.
2. Review agent online status and load.
3. Auto-assign or manually assign unassigned leads/clients.
4. Review `/crm/tasks` overdue items.
5. Review `/crm/tickets` critical/high tickets.
6. Review `/crm/kyc-review`.

During shift:

- Balance team workload.
- Ensure follow-ups are recorded as tasks.
- Approve/reject KYC only after proper review.
- Maintain scripts and message templates if authorized.
- Monitor call history for coverage.

Escalate to Director/Admin when:

- Team capacity is insufficient.
- Workflow or permission issues block operations.
- AI or telephony configuration is broken.
- Compliance issues require senior review.

### Director Playbook

Start of shift:

1. Open `/crm/dashboard`.
2. Check client count, deposits, withdrawals, net flow, and online staff.
3. Open `/crm/vip`.
4. Review high-value clients and churn indicators.
5. Open `/crm/manager` to check workload.
6. Review `/crm/ai-insights` for risk and team insights.

During shift:

- Monitor capital flow and team activity.
- Coordinate manager priorities.
- Review telephony number coverage.
- Review workflow strategy.
- Ensure high-value client coverage.

Escalate to Admin/CRM Admin when:

- Worker accounts need changes.
- AI provider settings need update.
- CRM functions, edge functions, or database policies block operations.

### Admin / CRM Admin Playbook

Start of shift:

1. Open `/crm/admin`.
2. Check worker accounts and counts.
3. Confirm AI provider status.
4. Review `/crm/dashboard` and `/crm/manager`.
5. Check `/crm/tickets`, `/crm/kyc-review`, `/crm/workflows`, and `/crm/telephony`.

Administrative tasks:

- Create workers.
- Edit worker roles/names.
- Reset passwords.
- Remove workers when required.
- Configure AI model/API key.
- Validate workflow access.
- Coordinate trading admin zone work via switch links when available.

High-risk admin rules:

- Do not share service-role keys.
- Do not expose AI provider secrets in browser code.
- Confirm production project/ref before deploying CRM Edge Functions.
- Validate route permissions and database RLS when changing roles.

## 26. Known Limitations And Operator Notes

- The CRM contains both UI route guards and database RLS policies. A page may be visible while a database operation still fails due to RLS.
- Agent sees KYC Review in the sidebar but is route-blocked.
- Workflow Rules may be visible to several roles, but database CRUD is admin/CRM-admin oriented.
- Messages are stored internally and marked `sent`; external delivery is not guaranteed by this UI alone.
- Telephony provider cards are present, but provider connection must be configured separately.
- Phone Dialer is currently rendered only for agents.
- Team Chat depends on backend REST/socket services.
- AI outputs are recommendations only.
- Some older CRM manual topics such as Reports, Advertisers, Trading Intelligence, and Data Management are not part of the current CRM sidebar/routes reviewed here. They may exist elsewhere in older artifacts or trading admin areas, but they should not be treated as current CRM navigation unless reintroduced in code.

## 27. Quick Troubleshooting

### I see 403 / Unauthorized

- Confirm the user's role in `public.users.role`.
- Confirm route guard allows the role.
- For CRM Admin, confirm role is exactly `crm_admin`.
- For Trade Admin, use trading admin routes, not CRM routes.

### A page loads but data is empty

- Check RLS policies for the table.
- Confirm the user has a row in `public.users`.
- Confirm the expected table exists and migrations have run.
- Check whether the page falls back to derived data mode.

### KYC Review is inaccessible

- Agent is not allowed.
- Use Manager, Director, Admin, or CRM Admin.

### Workflow Rules fails to load or save

- Confirm workflow table exists.
- Confirm workflow policy includes the signed-in role.
- Admin/CRM Admin are the expected management roles.

### Calls are not visible

- Check whether the Agent used the CRM dialer.
- Check `call_logs`.
- Confirm call status and agent/client ids were written.

### AI is unavailable

- Open Admin Panel AI settings or AI Insights Configure API.
- Confirm OpenRouter API key is configured server-side.
- Confirm the AI Edge Function or backend endpoint is reachable.

### Team Chat is missing

- Confirm user has CRM access.
- Confirm employee auto-provision succeeded.
- Confirm backend REST and socket.io services are running.

