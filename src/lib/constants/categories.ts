export const AGENT_CATEGORIES = [
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
  'その他',
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];
