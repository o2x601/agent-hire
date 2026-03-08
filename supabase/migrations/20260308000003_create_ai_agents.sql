-- ============================================================
-- Migration 003: ai_agents テーブル (The "Resume")
-- auth.users との外部キーあり
-- ============================================================

CREATE TABLE public.ai_agents (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id   UUID                 NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT                 NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  avatar_url     TEXT,
  personality    TEXT                 CHECK (char_length(personality) <= 500),
  skills         TEXT[]               NOT NULL DEFAULT '{}',
  track_record   JSONB,
  pricing_model  public.pricing_model NOT NULL,
  api_endpoint   TEXT,
  is_verified    BOOLEAN              NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ          NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_agents IS 'AIエージェント履歴書';
COMMENT ON COLUMN public.ai_agents.developer_id  IS 'Supabase Auth ユーザーID (開発者)';
COMMENT ON COLUMN public.ai_agents.skills        IS 'スキルタグ配列 (e.g. ["Python","Slack API"])';
COMMENT ON COLUMN public.ai_agents.track_record  IS '実績JSONB: {total_processed, uptime_percentage, avg_response_ms, error_rate, last_active_at}';
COMMENT ON COLUMN public.ai_agents.is_verified   IS 'プラットフォーム動作確認済みフラグ';
