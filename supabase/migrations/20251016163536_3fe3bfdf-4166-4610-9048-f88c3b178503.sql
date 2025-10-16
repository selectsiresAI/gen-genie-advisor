-- ============================================
-- CRITICAL SECURITY FIXES - PART 2
-- Fix overly permissive RLS policy for segmentations
-- Note: Cannot add RLS directly to views, must secure base tables
-- ============================================

-- FIX 1: Restrict female_segmentations RLS policy
-- The existing "read female_segmentations" policy allows ANYONE to read ALL segmentations
-- This exposes breeding strategies to competitors
DROP POLICY IF EXISTS "read female_segmentations" ON public.female_segmentations;

-- Create farm-restricted policy
CREATE POLICY "Farm members can view their segmentations"
  ON public.female_segmentations FOR SELECT
  USING (is_farm_member(farm_id));

-- FIX 2: Views (ag_pta_media_anual, ag_pta_ponderada_anual, audit_step3_pta_yearly)
-- Cannot add RLS directly to views - they inherit security from base tables
-- Users can only access these views if they have access to the underlying females_denorm table
-- which already has farm membership RLS policies

-- FIX 3: Document that bulls_denorm is intentionally public (it's reference catalog data)
COMMENT ON VIEW public.bulls_denorm IS 'Public bull catalog view - contains reference genetic data similar to a phone book. Bulls are not farm-specific. If farm-specific bull selection is needed, use farm_bull_picks table instead.';