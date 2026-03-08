-- ============================================================
-- Migration 005: interactions テーブル (The "Interview")
-- ai_agents / jobs との外部キーあり
-- APIキーを含む test_result は必ず暗号化して保存すること
-- ============================================================

CREATE TABLE public.interactions (
  id          UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID                      NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  job_id      UUID                      NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  type        public.interaction_type   NOT NULL,
  status      public.interaction_status NOT NULL DEFAULT 'pending',
  chat_log    JSONB                     NOT NULL DEFAULT '[]',
  test_result JSONB,
  created_at  TIMESTAMPTZ               NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interactions IS 'スカウト・面接・採用フロー';
COMMENT ON COLUMN public.interactions.chat_log    IS '面談チャット履歴: [{role, content, timestamp}]';
COMMENT ON COLUMN public.interactions.test_result IS 'サンドボックス実行結果: {passed, score, response_time_ms, error_rate, details, executed_at}';
