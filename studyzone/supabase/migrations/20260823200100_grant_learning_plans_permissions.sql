-- ==============================================================================
-- Migration: Grant Table Access to Authenticated Users for Learning Plans & Milestones
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.learning_plans
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.learning_milestones
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.learning_plans
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.learning_milestones
TO service_role;
