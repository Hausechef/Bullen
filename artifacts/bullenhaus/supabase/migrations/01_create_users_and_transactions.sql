-- Create users table linked to Supabase Auth
create table if not exists public.users (
  id uuid not null references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  balance numeric(16, 2) default 0,
  realized_pnl numeric(16, 2) default 0,
  margin_used numeric(16, 2) default 0,
  kyc_status text check (kyc_status in ('PENDING', 'VERIFIED', 'REJECTED')) default 'PENDING',
  unified_role text check (unified_role in ('client', 'agent', 'manager', 'director', 'admin')) default 'client',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (id)
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('DEPOSIT', 'WITHDRAWAL', 'TRADE')),
  status text not null check (status in ('PENDING', 'COMPLETED', 'FAILED')) default 'PENDING',
  amount numeric(16, 2) not null,
  instructions text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.transactions enable row level security;

-- RLS Policies for users table
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select
  using (
    (select unified_role from public.users where id = auth.uid()) = 'admin'
  );

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any user"
  on public.users for update
  using (
    (select unified_role from public.users where id = auth.uid()) = 'admin'
  );

-- RLS Policies for transactions table
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Admins can view all transactions"
  on public.transactions for select
  using (
    (select unified_role from public.users where id = auth.uid()) = 'admin'
  );

create policy "Users can create own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Admins can create transactions"
  on public.transactions for insert
  using (
    (select unified_role from public.users where id = auth.uid()) = 'admin'
  );

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can update any transaction"
  on public.transactions for update
  using (
    (select unified_role from public.users where id = auth.uid()) = 'admin'
  );
