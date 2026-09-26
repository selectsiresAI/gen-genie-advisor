-- Cleanup of the smoke test for the updated create_farm_basic (verified p_city/p_state
-- write correctly end-to-end via REST with a real user JWT). Removes the QA farm and its
-- user_farms link (default_farm_id was not touched — that user already had one).
DELETE FROM public.user_farms WHERE client_id = '2e6664bf-f729-4c30-a1f4-ac88c0017c32';
DELETE FROM public.clients WHERE id = '2e6664bf-f729-4c30-a1f4-ac88c0017c32';
