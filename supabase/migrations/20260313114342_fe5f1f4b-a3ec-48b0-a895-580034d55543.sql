
-- Fix security definer views by setting security_invoker
ALTER VIEW public.bulls_denorm SET (security_invoker = true);
ALTER VIEW public.females_denorm SET (security_invoker = true);
