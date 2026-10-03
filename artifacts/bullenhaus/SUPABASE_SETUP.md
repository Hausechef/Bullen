# Supabase Database Setup

This document describes the database schema required for the Bullenhaus project.

## Overview

The project uses Supabase Auth for authentication and Postgres tables for user and transaction data:

- **`public.users`** — Extended user profile linked to Supabase Auth (auth.users)
- **`public.transactions`** — Trading/deposit/withdrawal transactions

## Schema

### users table

Links to `auth.users` via FK constraint. Auto-created on first Supabase signup.

```sql
id              uuid PRIMARY KEY (references auth.users)
email           text NOT NULL UNIQUE
full_name       text
balance         numeric(16,2) default 0     -- trading account balance
realized_pnl    numeric(16,2) default 0     -- realized profit/loss
margin_used     numeric(16,2) default 0     -- margin in use
kyc_status      text enum(PENDING|VERIFIED|REJECTED)
unified_role    text enum(client|agent|manager|director|admin)
created_at      timestamp with tz default now()
updated_at      timestamp with tz default now()
```

### transactions table

Tracks deposits, withdrawals, and trades.

```sql
id              uuid PRIMARY KEY
user_id         uuid FK → users
type            text enum(DEPOSIT|WITHDRAWAL|TRADE)
status          text enum(PENDING|COMPLETED|FAILED)
amount          numeric(16,2) NOT NULL
instructions    text nullable (for bank transfer instructions)
created_at      timestamp with tz default now()
updated_at      timestamp with tz default now()
```

## Row Level Security (RLS)

Both tables have RLS enabled with these policies:

### users
- `SELECT`: Users can view their own profile; admins can view all
- `UPDATE`: Users can update their own profile; admins can update any

### transactions
- `SELECT`: Users can view their own; admins can view all
- `INSERT`: Users can insert their own; admins can insert any
- `UPDATE`: Users can update their own; admins can update any

## How to Apply

### Option 1: Supabase Dashboard (Recommended for first setup)

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/01_create_users_and_transactions.sql`
4. Paste and run the query
5. Verify tables appear in the **Table Editor** sidebar

### Option 2: Supabase CLI (for future migrations)

```bash
# Install CLI if not already done
npm install -g supabase

# Link your project
supabase link --project-ref jwdnjrysxrzgtqbvpuxq

# Run pending migrations
supabase db push
```

## Testing the Schema

Once applied, you can verify:

```sql
-- List tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check users table
\d public.users

-- Check transactions table
\d public.transactions

-- List RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('users', 'transactions');
```

## Troubleshooting

- **"permission denied for schema public"** → Check that RLS policies are correctly applied; the `public` role should have no direct access (all access via RLS policies)
- **"new row violates row-level security policy"** → The user's `auth.uid()` must exist in the `users` table; the app's login flow should auto-insert on first sign-in
- **FK constraint error on `auth.users`** → Ensure Supabase Auth is enabled and at least one user exists

## Integration with Frontend

The frontend code in `src/app/**` assumes these tables exist and makes direct Supabase queries:

- `supabase.from('users').select(...)` → user profile, KYC status, balance
- `supabase.from('transactions').select(...)` → user transactions, deposits, withdrawals

See `src/app/crm/lib/auth.ts` for the role-based auth flow that queries the `users` table after login.
