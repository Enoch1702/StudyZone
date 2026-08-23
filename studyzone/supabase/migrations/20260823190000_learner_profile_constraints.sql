-- ==============================================================================
-- Migration: 20260823_learner_profile_constraints.sql
-- Description: Add CHECK constraints to learner_type and primary_goal in public.profiles
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_learner_type_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_learner_type_check
      CHECK (
        learner_type IS NULL OR learner_type IN (
          'college',
          'school',
          'placement',
          'competitive_exam',
          'skill_dev',
          'self_learning'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_primary_goal_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_primary_goal_check
      CHECK (
        primary_goal IS NULL OR primary_goal IN (
          'exams',
          'placements',
          'skills',
          'competitive_exam',
          'consistency',
          'course_cert',
          'learn_new'
        )
      );
  END IF;
END $$;

