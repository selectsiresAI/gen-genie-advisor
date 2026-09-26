-- Cleanup of the live end-to-end UI test of CreateFarmModal (verified city/state
-- persist correctly through a real click-through, not just the RPC call directly).
DELETE FROM public.user_farms WHERE client_id = 'a76893f6-cc08-4c0b-bcd3-d54ad11e8288';
DELETE FROM public.clients WHERE id = 'a76893f6-cc08-4c0b-bcd3-d54ad11e8288';
