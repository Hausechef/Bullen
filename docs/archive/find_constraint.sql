-- Run this FIRST to see the actual constraint name
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'leads'::regclass AND contype = 'c';
