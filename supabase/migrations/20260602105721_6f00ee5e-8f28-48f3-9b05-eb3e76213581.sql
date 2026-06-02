-- Excluir Fazenda Canadá (Fabio Guimarães Pereira) e todos os dados relacionados
DO $$
DECLARE
  v_client_id uuid := '9c39a607-56db-416a-90f8-e0a633417f8c';
BEGIN
  DELETE FROM public.female_segmentations WHERE client_id = v_client_id;
  DELETE FROM public.matings WHERE client_id = v_client_id;
  DELETE FROM public.semen_movements WHERE client_id = v_client_id;
  DELETE FROM public.farm_bull_picks WHERE client_id = v_client_id;
  DELETE FROM public.farm_index_settings WHERE client_id = v_client_id;
  DELETE FROM public.farm_tanks WHERE client_id = v_client_id;
  DELETE FROM public.farm_invites WHERE client_id = v_client_id;
  DELETE FROM public.user_farms WHERE client_id = v_client_id;
  DELETE FROM public.client_users WHERE client_id = v_client_id;
  DELETE FROM public.females WHERE client_id = v_client_id;
  DELETE FROM public.genomic_results WHERE client_id = v_client_id;
  DELETE FROM public.service_orders WHERE client_id = v_client_id;
  DELETE FROM public.clients WHERE id = v_client_id;
END $$;