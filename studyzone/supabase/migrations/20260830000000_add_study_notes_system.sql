-- ==============================================================================
-- Migration: Add Study Notes & Knowledge Management System
-- Phase 17 — StudyZone Learning OS Evolution
-- ==============================================================================

-- 1. STUDY NOTES TABLE
CREATE TABLE IF NOT EXISTS public.study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  content TEXT NOT NULL DEFAULT '',
  summary TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for study_notes
CREATE INDEX IF NOT EXISTS idx_study_notes_user ON public.study_notes (user_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_subject ON public.study_notes (subject_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_user_updated ON public.study_notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_notes_user_pinned ON public.study_notes (user_id, is_pinned) WHERE is_pinned = true;

-- Enable RLS on study_notes
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

-- study_notes RLS policies
DROP POLICY IF EXISTS "Users can view their own study notes" ON public.study_notes;
CREATE POLICY "Users can view their own study notes"
ON public.study_notes FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own study notes" ON public.study_notes;
CREATE POLICY "Users can insert their own study notes"
ON public.study_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study notes" ON public.study_notes;
CREATE POLICY "Users can update their own study notes"
ON public.study_notes FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own study notes" ON public.study_notes;
CREATE POLICY "Users can delete their own study notes"
ON public.study_notes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to automatically maintain updated_at timestamp on study_notes
DROP TRIGGER IF EXISTS set_study_notes_updated_at ON public.study_notes;
CREATE TRIGGER set_study_notes_updated_at
BEFORE UPDATE ON public.study_notes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
