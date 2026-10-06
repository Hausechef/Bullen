alter table public.recovery_registrations
  add column if not exists country text,
  add column if not exists phone text;

alter table public.recovery_registrations
  drop constraint if exists recovery_registrations_country_format,
  add constraint recovery_registrations_country_format
    check (country is null or country ~ '^[A-Z]{2}$'),
  drop constraint if exists recovery_registrations_phone_length,
  add constraint recovery_registrations_phone_length
    check (phone is null or char_length(phone) between 7 and 24);
