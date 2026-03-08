-- ============================================================
-- Migration 006: Indexes & updated_at Triggers
-- 命名規則: idx_{table}_{column}
-- ============================================================

-- ── companies ──────────────────────────────────────────────
CREATE INDEX idx_companies_user_id ON public.companies(user_id);

-- ── ai_agents ──────────────────────────────────────────────
CREATE INDEX idx_agents_developer_id   ON public.ai_agents(developer_id);
CREATE INDEX idx_agents_pricing_model  ON public.ai_agents(pricing_model);
CREATE INDEX idx_agents_is_verified    ON public.ai_agents(is_verified);
-- GIN index for skills array (containment @>, overlap &&)
CREATE INDEX idx_agents_skills         ON public.ai_agents USING GIN (skills);
-- GIN index for track_record JSONB queries
CREATE INDEX idx_agents_track_record   ON public.ai_agents USING GIN (track_record);

-- ── jobs ───────────────────────────────────────────────────
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_status     ON public.jobs(status);
-- GiST index for INT4RANGE overlap/containment queries
CREATE INDEX idx_jobs_budget_range ON public.jobs USING GIST (budget_range);

-- ── interactions ───────────────────────────────────────────
CREATE INDEX idx_interactions_agent_id ON public.interactions(agent_id);
CREATE INDEX idx_interactions_job_id   ON public.interactions(job_id);
CREATE INDEX idx_interactions_status   ON public.interactions(status);
CREATE INDEX idx_interactions_type     ON public.interactions(type);

-- ============================================================
-- updated_at auto-update trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_companies_updated
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_agents_updated
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
