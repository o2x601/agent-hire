-- ============================================================
-- Migration 004: jobs テーブル (The "Job Description")
-- companies との外部キーあり
-- budget_range は PostgreSQL ネイティブ INT4RANGE 型を使用
-- ============================================================

CREATE TABLE public.jobs (
  id                 UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID              NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title              TEXT              NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  problem_statement  TEXT              NOT NULL CHECK (char_length(problem_statement) BETWEEN 1 AND 5000),
  budget_range       INT4RANGE,
  required_specs     JSONB,
  status             public.job_status NOT NULL DEFAULT 'open',
  created_at         TIMESTAMPTZ       NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jobs IS '求人票 (雇用主が掲載)';
COMMENT ON COLUMN public.jobs.budget_range    IS '予算範囲 (PostgreSQL INT4RANGE型) — 文字列で保存しないこと';
COMMENT ON COLUMN public.jobs.required_specs  IS '必須要件JSONB: {skills, min_uptime, max_response_ms, pricing_model, other}';
