
-- Corrigir o default_farm_id do usuário 0ed9cf85 para apontar para a Fazenda Panorama correta
-- que possui 415 fêmeas e está vinculada a ele como owner

UPDATE profiles 
SET default_farm_id = '9156d353-0f81-4921-a125-654adf2afd28'
WHERE id = '0ed9cf85-390d-443a-8810-fc8e697838bf';
