-- Create ideas table to store startup idea submissions and AI results
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_audience TEXT,
  budget TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | complete | error
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_ideas" ON public.ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_ideas" ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_ideas" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ideas_updated_at ON public.ideas;
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
