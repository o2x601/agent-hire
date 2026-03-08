-- ============================================================
-- Migration 002: companies テーブル
-- auth.users との外部キーあり
-- ============================================================

CREATE TABLE public.companies (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  logo_url    TEXT,
  industry    TEXT         CHECK (char_length(industry) <= 100),
  size        public.company_size,
  description TEXT         CHECK (char_length(description) <= 2000),
  website_url TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.companies IS '企業プロファイル (雇用主)';
COMMENT ON COLUMN public.companies.user_id IS 'Supabase Auth ユーザーID';
