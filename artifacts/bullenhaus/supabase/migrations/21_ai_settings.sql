-- Migration 21: AI provider settings (OpenRouter) — admin-configurable
create table if not exists public.ai_settings (
  id                 int primary key default 1,
  openrouter_api_key text,
  model              text not null default 'openai/gpt-4o-mini',
  updated_at         timestamptz not null default now(),
  constraint ai_settings_singleton check (id = 1)
);
insert into public.ai_settings (id, model) values (1, 'openai/gpt-4o-mini')
  on conflict (id) do nothing;

alter table public.ai_settings enable row level security;

-- Only admin-tier may read/write the full row (incl. the key).
drop policy if exists "ai_settings_admin_all" on public.ai_settings;
create policy "ai_settings_admin_all" on public.ai_settings for all
  using (public.get_my_role() in ('admin','crm_admin','super-admin','superadmin'))
  with check (public.get_my_role() in ('admin','crm_admin','super-admin','superadmin'));

-- Status (no key leak): any authenticated CRM user can check config + model.
create or replace function public.ai_settings_status()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'configured', coalesce((select openrouter_api_key is not null and length(openrouter_api_key) > 0 from public.ai_settings where id = 1), false),
    'model', (select model from public.ai_settings where id = 1)
  );
$$;
grant execute on function public.ai_settings_status() to authenticated;
