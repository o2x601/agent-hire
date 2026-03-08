-- ============================================================
-- Migration 007: Row Level Security (RLS) & Policies
-- ============================================================

-- ── RLS 有効化 ─────────────────────────────────────────────
ALTER TABLE public.companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- companies
-- ============================================================

-- 全ユーザーが企業プロファイルを閲覧可能
CREATE POLICY "companies_public_read"
  ON public.companies FOR SELECT
  USING (true);

-- 本人のみ作成・更新・削除
CREATE POLICY "companies_owner_insert"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companies_owner_update"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "companies_owner_delete"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ai_agents
-- ============================================================

-- 全ユーザーが履歴書を閲覧可能
CREATE POLICY "agents_public_read"
  ON public.ai_agents FOR SELECT
  USING (true);

-- 開発者本人のみ作成・更新・削除
CREATE POLICY "agents_developer_insert"
  ON public.ai_agents FOR INSERT
  WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "agents_developer_update"
  ON public.ai_agents FOR UPDATE
  USING (auth.uid() = developer_id);

CREATE POLICY "agents_developer_delete"
  ON public.ai_agents FOR DELETE
  USING (auth.uid() = developer_id);

-- ============================================================
-- jobs
-- ============================================================

-- open/filled の求人票は全ユーザーが閲覧可能 (closed は非公開)
CREATE POLICY "jobs_public_read"
  ON public.jobs FOR SELECT
  USING (status <> 'closed');

-- 自社の求人票のみ作成
CREATE POLICY "jobs_company_insert"
  ON public.jobs FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.companies WHERE id = company_id
    )
  );

-- 自社の求人票のみ更新
CREATE POLICY "jobs_company_update"
  ON public.jobs FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.companies WHERE id = company_id
    )
  );

-- 自社の求人票のみ削除
CREATE POLICY "jobs_company_delete"
  ON public.jobs FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.companies WHERE id = company_id
    )
  );

-- ============================================================
-- interactions
-- 参加者 (agent の developer OR job の company owner) のみアクセス可
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_interaction_participant(
  p_agent_id UUID,
  p_job_id   UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ai_agents
    WHERE id = p_agent_id AND developer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.companies c ON c.id = j.company_id
    WHERE j.id = p_job_id AND c.user_id = auth.uid()
  );
$$;

CREATE POLICY "interactions_participant_read"
  ON public.interactions FOR SELECT
  USING (public.is_interaction_participant(agent_id, job_id));

CREATE POLICY "interactions_participant_insert"
  ON public.interactions FOR INSERT
  WITH CHECK (public.is_interaction_participant(agent_id, job_id));

CREATE POLICY "interactions_participant_update"
  ON public.interactions FOR UPDATE
  USING (public.is_interaction_participant(agent_id, job_id));
