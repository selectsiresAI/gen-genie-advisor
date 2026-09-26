-- Backfills supabase_migrations.schema_migrations with 70 migrations that were
-- already applied to production (via Lovable's own deploy path, which bypasses
-- this ledger) but never recorded here. Each was individually verified against
-- live schema (function defs, columns, tables/views, indexes, extensions,
-- policies, or row presence for data-only migrations) before this backfill.
-- No DDL runs here — this only reconciles the migration history bookkeeping so
-- `supabase db push` never tries to replay already-applied changes.
--
-- Excluded from this backfill (left as genuinely unresolved, not marked applied):
--   20251101120000_update_bull_pedigree_columns.sql — sire_name/mgs_name/mmgs_name
--     columns do not exist live on bulls or bulls_denorm. Abandoned in favor of
--     the NAAB-code based fields (sire_naab/mgs_naab/mmgs_naab) that are live today.
--   20251102123000_update_bull_search_functions.sql — depended on the columns above,
--     equally abandoned; current search_bulls/get_bull_by_naab don't reference them.
--   20251119195624 (UPDATE profiles.default_farm_id for one user) — live value does
--     not match the migration's target, but this is a mutable user setting that may
--     have legitimately changed since via normal app use. Left unresolved rather than
--     guessed.
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
('20251026221236', '26ec2d37-c044-4fe8-971f-c4c963ab5be7'),
('20251026221748', '5fc54ed4-abc9-480c-a8e3-46eb14c532a5'),
('20251026223917', '4f70d8da-907c-489e-b513-2dfca5c99d49'),
('20251026225616', 'fe79abb1-7a88-4fcf-9d83-0493b786d61f'),
('20251026231424', '69d318ef-e7c4-4492-9382-e1112b99d53a'),
('20251030120000', 'fix_is_member_of_farm_security'),
('20251031103000', 'fix_females_permissions'),
('20251031121500', 'regrant_females_permissions'),
('20251104120000', 'lock_down_bulls_denorm'),
('20251118035310', '1f601f3d-01cf-48bb-962c-c5db2d3e92be'),
('20251118040615', '8dd427b3-0acc-445d-90b9-62a161557e6c'),
('20251119143544', '3936b3c5-92ce-46c4-a06c-07b3271079fc'),
('20251119144001', 'b87ee86b-6965-4849-9386-7e84d6f52fe3'),
('20251119144236', '928b5586-6366-4055-9c49-228ec572ae48'),
('20251119193539', '4c028948-e7dd-446d-bd3a-108ce014c189'),
('20251119193854', '9df524aa-ed11-4a70-9db7-cad23621b9c2'),
('20251123135126', 'a79c0175-1ff9-4d21-ad77-f5abc2c794d9'),
('20260313114324', 'e5ee8e29-09f6-4000-92eb-09345a30f84b'),
('20260313114342', 'fe5f1f4b-a3ec-48b0-a895-580034d55543'),
('20260313114405', 'f0cc309a-e54b-4417-8da2-ad8354967ab4'),
('20260316000001', 'add_hhp_dollar_auto_calculation'),
('20260316203246', 'e9df0c45-e27c-4972-be52-9464c032feeb'),
('20260428120000', 'fix_user_farms_grants_sharing'),
('20260429021618', '416baa04-e4ca-4004-a49a-37a3dfe8d87f'),
('20260505120000', 'fix_bull_search_functions'),
('20260511231931', 'f6110ba7-fe03-4894-accd-3c02b473211a'),
('20260513161536', '93eaee42-4804-47c2-bfc4-94f3fc218b99'),
('20260513162211', '0cc9d597-10ec-4f0f-b26d-373e3483adcc'),
('20260513164037', '3184a44a-a707-4c40-94dc-58d871bd31f6'),
('20260514112218', '3449d902-c5ee-40d3-84d6-fe98cb278be0'),
('20260514113648', '48b7e8f0-c05d-4b8b-a2d2-fdf568b14a8d'),
('20260514114133', '6ae2a737-d8ff-4649-8009-9570b1ccabcc'),
('20260514130026', 'c9c2e7c5-a8e9-402e-92a2-dc7f9664a598'),
('20260602105721', '6f00ee5e-8f28-48f3-9b05-eb3e76213581'),
('20260602115655', '5e9f64d5-062d-4fcf-ba98-1450f5577235'),
('20260602120000', 'fix_naab_ho_h_bidirectional_matching'),
('20260602130000', 'bull_naab_aliases_and_indexes'),
('20260602140000', 'fix_security_and_hhp_trigger'),
('20260603002813', 'ca917062-02d4-4c08-ac1f-8897c8088de2'),
('20260603003633', 'e89d0b18-9e6f-40b8-aa11-fe67e4187617'),
('20260603004318', '93bd156a-2368-45e8-b303-e3ae3f119ab0'),
('20260603164130', '12b50d3a-805a-4229-9df2-42f45250e95a'),
('20260603184359', 'd60c8341-9a47-4e2b-a375-b455302f4412'),
('20260605143554', '1e4f7bec-8fb2-4f51-9e5a-aad3292f9abc'),
('20260608172030', '2235d02a-7afe-4350-bcb8-f522273a0683'),
('20260608173404', '3ec1d3be-95a9-4153-a901-74a03c2d5135'),
('20260608174344', 'de887643-d5b7-4fd5-8c39-7506f48fc269'),
('20260608175251', '958d75c8-f833-44bb-a4da-cc550b2ecd46'),
('20260617132653', '5345e4f6-db37-45d5-859b-92719ffbaf32'),
('20260623005054', '731422ce-9a62-4d21-af96-24147bd71183'),
('20260623005713', '4ab73e39-77a2-48e5-a5b5-9c2d991f8441'),
('20260623010317', 'f0ed1d7b-b780-4bc2-a64b-0d036c95c000'),
('20260625193600', 'aeae497c-daeb-49b8-aa86-9155be457a72'),
('20260625194017', 'a8378815-83a8-4630-a1dd-17f8a61f4e8f'),
('20260630222331', '4acadf36-7026-4f0b-a860-712179ffaeb7'),
('20260702125614', 'cf0a1a56-2b37-4247-8cbd-211eb15d541e'),
('20260715202130', 'ffd063c7-ec7f-4546-9d49-66ad16643d92'),
('20260718000000', 'breed_index_params'),
('20260718000001', 'jersey_index_columns'),
('20260718000002', 'recompute_hhp_breed'),
('20260821000000', 'nx3_bulls_lookup_index_fix'),
('20260903120000', 'hhp_2026_ho_je_reweight'),
('20260903130000', 'fix_recompute_hhp_batch_early_stop'),
('20260903150000', 'technician_share_permissions'),
('20260909120000', 'find_bull_smart'),
('20260909120100', 'find_bulls_smart_batch'),
('20260909130000', 'find_bull_smart_sentinel_guard'),
('20260909140000', 'find_bull_exact_no_fuzzy_batch'),
('20260909140100', 'bulls_registration_index'),
('20260910150000', 'recalc_placeholder_bulls_global_fallback')
ON CONFLICT (version) DO NOTHING;
