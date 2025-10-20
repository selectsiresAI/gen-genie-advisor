-- Add missing gl column to bulls table
ALTER TABLE public.bulls ADD COLUMN IF NOT EXISTS gl numeric;