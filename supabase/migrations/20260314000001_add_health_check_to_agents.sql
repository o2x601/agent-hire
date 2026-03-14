-- ============================================================
-- Migration: ai_agents に Health Check 関連カラムを追加
-- ============================================================

ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS is_active           BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_health_check   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS health_check_status TEXT        NOT NULL DEFAULT 'unknown'
    CHECK (health_check_status IN ('healthy', 'degraded', 'unreachable', 'unknown'));

COMMENT ON COLUMN public.ai_agents.is_active            IS '死活監視フラグ。3日連続unreachableで自動false';
COMMENT ON COLUMN public.ai_agents.last_health_check    IS '最終 Health Check 成功日時';
COMMENT ON COLUMN public.ai_agents.health_check_status  IS 'healthy / degraded / unreachable / unknown';
