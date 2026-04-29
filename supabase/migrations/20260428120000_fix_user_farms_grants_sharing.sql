-- Fix: restore grants on user_farms for authenticated users
-- The migration 20251015 did REVOKE ALL but only re-created SELECT policy.
-- INSERT and DELETE grants were lost, breaking farm sharing completely.

grant select, insert, delete on table public.user_farms to authenticated;

-- Also ensure farm_invites has proper grants
grant select, insert, update on table public.farm_invites to authenticated;
