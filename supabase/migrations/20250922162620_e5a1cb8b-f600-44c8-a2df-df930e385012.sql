-- Limpar dados template/seed existentes
DELETE FROM farm_bull_picks;
DELETE FROM farm_index_settings;
DELETE FROM female_segmentations;
DELETE FROM genetic_predictions;
DELETE FROM matings;
DELETE FROM semen_movements;
DELETE FROM females;
DELETE FROM user_farms;
DELETE FROM farms;
DELETE FROM bulls;

-- Reiniciar sequências se necessário
-- (As tabelas usam UUID então não há sequências para reiniciar)