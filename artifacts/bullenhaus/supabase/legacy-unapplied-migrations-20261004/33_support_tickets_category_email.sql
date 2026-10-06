-- Migration 33: Support tickets — category and contact email
--
-- The client support form submits a category and a reply-to email, but the
-- table only had subject/message. Adds both columns and relaxes subject
-- (the form fills subject from the category).

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE public.support_tickets ALTER COLUMN subject DROP NOT NULL;
