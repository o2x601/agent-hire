-- ============================================================
-- Migration: jobs テーブルに duration カラムを追加
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN duration TEXT CHECK (
    duration IS NULL OR duration IN (
      '1ヶ月未満', '1〜3ヶ月', '3〜6ヶ月', '6ヶ月〜1年', '1年以上', '期間未定'
    )
  );

COMMENT ON COLUMN public.jobs.duration IS '契約期間の目安 (任意)';
