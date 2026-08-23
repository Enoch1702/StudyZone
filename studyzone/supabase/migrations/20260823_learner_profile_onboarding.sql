-- ==============================================================================
-- Migration: 20260823_learner_profile_onboarding.sql
-- Description: Add learner profile and onboarding completion tracking to profiles table
-- ==============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learner_type TEXT,
  ADD COLUMN IF NOT EXISTS primary_goal TEXT,
  ADD COLUMN IF NOT EXISTS learning_focus TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add index on onboarding_completed for fast query filtering
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
  ON public.profiles(onboarding_completed);
