
-- Migration 1: Adicionar role de técnico ao enum
ALTER TYPE farm_role ADD VALUE IF NOT EXISTS 'technician';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_females_farm_id ON public.females(farm_id);
CREATE INDEX IF NOT EXISTS idx_user_farms_user_id ON public.user_farms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_farms_farm_id ON public.user_farms(farm_id);
CREATE INDEX IF NOT EXISTS idx_user_farms_role ON public.user_farms(role);
