-- ============================================================
-- Migration: interactions.status に 'probation' を追加
-- ============================================================

-- 既存の CHECK 制約を削除して再作成
ALTER TABLE public.interactions
  DROP CONSTRAINT IF EXISTS interactions_status_check;

ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_status_check
    CHECK (status IN ('pending', 'rejected', 'interviewing', 'probation', 'hired'));
