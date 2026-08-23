-- ==============================================================================
-- Migration: Persistent Learning Plans & Milestones (Phase 7)
-- ==============================================================================

-- 1. LEARNING PLANS TABLE
CREATE TABLE IF NOT EXISTS public.learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. LEARNING MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.learning_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  target_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. EXTEND TASKS TABLE WITH OPTIONAL RELATIONSHIPS
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.learning_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.learning_milestones(id) ON DELETE SET NULL;

-- 4. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS set_learning_plans_updated_at ON public.learning_plans;
CREATE TRIGGER set_learning_plans_updated_at
  BEFORE UPDATE ON public.learning_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_learning_milestones_updated_at ON public.learning_milestones;
CREATE TRIGGER set_learning_milestones_updated_at
  BEFORE UPDATE ON public.learning_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_status ON public.learning_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_milestones_user_id ON public.learning_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_milestones_plan_id ON public.learning_milestones(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_plan_id ON public.tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON public.tasks(milestone_id);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_plans
DROP POLICY IF EXISTS "Users can view their own learning plans" ON public.learning_plans;
CREATE POLICY "Users can view their own learning plans"
  ON public.learning_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own learning plans" ON public.learning_plans;
CREATE POLICY "Users can create their own learning plans"
  ON public.learning_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own learning plans" ON public.learning_plans;
CREATE POLICY "Users can update their own learning plans"
  ON public.learning_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own learning plans" ON public.learning_plans;
CREATE POLICY "Users can delete their own learning plans"
  ON public.learning_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_milestones
DROP POLICY IF EXISTS "Users can view their own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can view their own learning milestones"
  ON public.learning_milestones FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can create their own learning milestones"
  ON public.learning_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can update their own learning milestones"
  ON public.learning_milestones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can delete their own learning milestones"
  ON public.learning_milestones FOR DELETE
  USING (auth.uid() = user_id);
