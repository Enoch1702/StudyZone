-- ==============================================================================
-- Migration: Add Flashcards & Spaced Repetition (SuperMemo SM-2) System
-- Phase 12 — StudyZone Power Tools & Final Learning System Upgrade
-- ==============================================================================

-- 1. FLASHCARD DECKS TABLE
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for flashcard_decks
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user ON public.flashcard_decks (user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_subject ON public.flashcard_decks (subject_id);

-- Enable RLS on flashcard_decks
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

-- flashcard_decks RLS policies
DROP POLICY IF EXISTS "Users can view their own flashcard decks" ON public.flashcard_decks;
CREATE POLICY "Users can view their own flashcard decks"
ON public.flashcard_decks FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flashcard decks" ON public.flashcard_decks;
CREATE POLICY "Users can insert their own flashcard decks"
ON public.flashcard_decks FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own flashcard decks" ON public.flashcard_decks;
CREATE POLICY "Users can update their own flashcard decks"
ON public.flashcard_decks FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own flashcard decks" ON public.flashcard_decks;
CREATE POLICY "Users can delete their own flashcard decks"
ON public.flashcard_decks FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on flashcard_decks
DROP TRIGGER IF EXISTS set_flashcard_decks_updated_at ON public.flashcard_decks;
CREATE TRIGGER set_flashcard_decks_updated_at
BEFORE UPDATE ON public.flashcard_decks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. FLASHCARDS TABLE (SUPERMEMO SM-2 METADATA)
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL CHECK (char_length(trim(front)) > 0),
  back TEXT NOT NULL CHECK (char_length(trim(back)) > 0),
  easiness_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 0,
  repetitions INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_deck ON public.flashcards (deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON public.flashcards (user_id, next_review_at ASC);

-- Enable RLS on flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- flashcards RLS policies
DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.flashcards;
CREATE POLICY "Users can view their own flashcards"
ON public.flashcards FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flashcards" ON public.flashcards;
CREATE POLICY "Users can insert their own flashcards"
ON public.flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.flashcards;
CREATE POLICY "Users can update their own flashcards"
ON public.flashcards FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.flashcards;
CREATE POLICY "Users can delete their own flashcards"
ON public.flashcards FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on flashcards
DROP TRIGGER IF EXISTS set_flashcards_updated_at ON public.flashcards;
CREATE TRIGGER set_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. FLASHCARD REVIEWS LOG TABLE
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  quality INT NOT NULL CHECK (quality >= 0 AND quality <= 5),
  previous_interval INT NOT NULL,
  new_interval INT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for flashcard_reviews
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_reviewed ON public.flashcard_reviews (user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_card ON public.flashcard_reviews (flashcard_id);

-- Enable RLS on flashcard_reviews
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- flashcard_reviews RLS policies
DROP POLICY IF EXISTS "Users can view their own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can view their own flashcard reviews"
ON public.flashcard_reviews FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can insert their own flashcard reviews"
ON public.flashcard_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own flashcard reviews" ON public.flashcard_reviews;
CREATE POLICY "Users can delete their own flashcard reviews"
ON public.flashcard_reviews FOR DELETE
USING (auth.uid() = user_id);

-- 4. GRANT PERMISSIONS TO AUTHENTICATED & SERVICE_ROLE
GRANT ALL ON public.flashcard_decks TO authenticated, service_role;
GRANT ALL ON public.flashcards TO authenticated, service_role;
GRANT ALL ON public.flashcard_reviews TO authenticated, service_role;
