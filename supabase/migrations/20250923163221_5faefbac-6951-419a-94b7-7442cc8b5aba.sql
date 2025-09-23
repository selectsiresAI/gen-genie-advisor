-- Fix critical security vulnerability: Create security definer functions 
-- to control access to sensitive denormalized views

-- Create security definer function for bulls_denorm access
-- Bulls are generally public genetic information, so authenticated users can access
CREATE OR REPLACE FUNCTION public.get_bulls_denorm()
RETURNS SETOF public.bulls_denorm AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    RETURN QUERY SELECT * FROM public.bulls_denorm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function for females_denorm access
-- Only farm members can access female data
CREATE OR REPLACE FUNCTION public.get_females_denorm(target_farm_id uuid DEFAULT NULL)
RETURNS SETOF public.females_denorm AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- If farm_id is specified, check farm membership
    IF target_farm_id IS NOT NULL THEN
        IF NOT public.is_farm_member(target_farm_id) THEN
            RAISE EXCEPTION 'Access denied: not a member of this farm';
        END IF;
        
        RETURN QUERY SELECT * FROM public.females_denorm WHERE farm_id = target_farm_id;
    ELSE
        -- Return all females from farms the user is a member of
        RETURN QUERY 
        SELECT fd.* FROM public.females_denorm fd
        WHERE fd.farm_id IN (
            SELECT uf.farm_id FROM public.user_farms uf 
            WHERE uf.user_id = auth.uid()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function for farm_dashboard_kpis access  
-- Only farm members can access dashboard KPIs
CREATE OR REPLACE FUNCTION public.get_farm_dashboard_kpis(target_farm_id uuid DEFAULT NULL)
RETURNS SETOF public.farm_dashboard_kpis AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- If farm_id is specified, check farm membership
    IF target_farm_id IS NOT NULL THEN
        IF NOT public.is_farm_member(target_farm_id) THEN
            RAISE EXCEPTION 'Access denied: not a member of this farm';
        END IF;
        
        RETURN QUERY SELECT * FROM public.farm_dashboard_kpis WHERE farm_id = target_farm_id;
    ELSE
        -- Return KPIs for all farms the user is a member of
        RETURN QUERY 
        SELECT fdk.* FROM public.farm_dashboard_kpis fdk
        WHERE fdk.farm_id IN (
            SELECT uf.farm_id FROM public.user_farms uf 
            WHERE uf.user_id = auth.uid()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function for semen_inventory access
-- Only farm members can access semen inventory  
CREATE OR REPLACE FUNCTION public.get_semen_inventory(target_farm_id uuid DEFAULT NULL)
RETURNS SETOF public.semen_inventory AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- If farm_id is specified, check farm membership
    IF target_farm_id IS NOT NULL THEN
        IF NOT public.is_farm_member(target_farm_id) THEN
            RAISE EXCEPTION 'Access denied: not a member of this farm';
        END IF;
        
        RETURN QUERY SELECT * FROM public.semen_inventory WHERE farm_id = target_farm_id;
    ELSE
        -- Return inventory for all farms the user is a member of
        RETURN QUERY 
        SELECT si.* FROM public.semen_inventory si
        WHERE si.farm_id IN (
            SELECT uf.farm_id FROM public.user_farms uf 
            WHERE uf.user_id = auth.uid()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_bulls_denorm() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_females_denorm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_farm_dashboard_kpis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_semen_inventory(uuid) TO authenticated;