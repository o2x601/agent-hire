-- ============================================================
-- Migration: カテゴリ列を jobs・ai_agents テーブルに追加
-- ============================================================

-- 共通 ENUM 型を作成
CREATE TYPE public.agent_category AS ENUM (
  'カスタマーサポート',
  'データ分析・レポート',
  'コンテンツ生成',
  'コーディング・開発支援',
  '画像・動画生成',
  '音声・翻訳',
  'マーケティング・広告',
  '業務自動化（RPA）',
  '検索・情報収集',
  'セキュリティ・監視',
  'その他'
);

-- jobs テーブルに追加（求人カテゴリ）
ALTER TABLE public.jobs
  ADD COLUMN category public.agent_category;

COMMENT ON COLUMN public.jobs.category IS '求人カテゴリ (agent_category ENUM)';

-- ai_agents テーブルに追加（エージェントカテゴリ）
ALTER TABLE public.ai_agents
  ADD COLUMN category public.agent_category;

COMMENT ON COLUMN public.ai_agents.category IS 'エージェントカテゴリ (agent_category ENUM)';
