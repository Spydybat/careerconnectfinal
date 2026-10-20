-- ============ AI USAGE LOG ============
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  provider text,
  model text,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_logs_user_idx ON public.ai_usage_logs(user_id);
CREATE INDEX ai_usage_logs_created_idx ON public.ai_usage_logs(created_at DESC);
GRANT SELECT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai usage own read" ON public.ai_usage_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ CAREER COACH CONVERSATIONS ============
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations owner" ON public.ai_conversations FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER ai_conversations_updated BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_conversation_idx ON public.ai_messages(conversation_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_conversation(_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = _conversation_id AND c.user_id = auth.uid())
$$;

CREATE POLICY "messages owner" ON public.ai_messages FOR ALL TO authenticated
USING (public.owns_conversation(conversation_id)) WITH CHECK (public.owns_conversation(conversation_id));

-- ============ MOCK INTERVIEWS ============
CREATE TABLE public.ai_interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title text NOT NULL DEFAULT 'Software Engineer',
  difficulty text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'in_progress',
  overall_score integer,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX ai_interview_sessions_user_idx ON public.ai_interview_sessions(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interview_sessions TO authenticated;
GRANT ALL ON public.ai_interview_sessions TO service_role;
ALTER TABLE public.ai_interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview sessions owner" ON public.ai_interview_sessions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "interview sessions staff read" ON public.ai_interview_sessions FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE TABLE public.ai_interview_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_interview_sessions(id) ON DELETE CASCADE,
  seq integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'general',
  question text NOT NULL,
  answer text,
  score integer,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, seq)
);
CREATE INDEX ai_interview_turns_session_idx ON public.ai_interview_turns(session_id, seq);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interview_turns TO authenticated;
GRANT ALL ON public.ai_interview_turns TO service_role;
ALTER TABLE public.ai_interview_turns ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_interview_session(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.ai_interview_sessions s WHERE s.id = _session_id AND s.user_id = auth.uid())
$$;

CREATE POLICY "interview turns owner" ON public.ai_interview_turns FOR ALL TO authenticated
USING (public.owns_interview_session(session_id)) WITH CHECK (public.owns_interview_session(session_id));

-- ============ SKILL GAP REPORTS ============
CREATE TABLE public.ai_skill_gap_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_id uuid REFERENCES public.careers(id) ON DELETE SET NULL,
  career_title text NOT NULL DEFAULT '',
  readiness_score integer NOT NULL DEFAULT 0,
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_skill_gap_reports_user_idx ON public.ai_skill_gap_reports(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_skill_gap_reports TO authenticated;
GRANT ALL ON public.ai_skill_gap_reports TO service_role;
ALTER TABLE public.ai_skill_gap_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill gap owner" ON public.ai_skill_gap_reports FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "skill gap staff read" ON public.ai_skill_gap_reports FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));