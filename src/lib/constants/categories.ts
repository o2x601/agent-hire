export const AGENT_CATEGORIES = [
  { value: 'customer_support', label: 'カスタマーサポート' },
  { value: 'data_analysis', label: 'データ分析・レポート' },
  { value: 'content_generation', label: 'コンテンツ生成' },
  { value: 'coding', label: 'コーディング・開発支援' },
  { value: 'image_video', label: '画像・動画生成' },
  { value: 'voice_translation', label: '音声・翻訳' },
  { value: 'marketing', label: 'マーケティング・広告' },
  { value: 'rpa', label: '業務自動化（RPA）' },
  { value: 'search_intelligence', label: '検索・情報収集' },
  { value: 'security_monitoring', label: 'セキュリティ・監視' },
  { value: 'other', label: 'その他' },
] as const;

export type AgentCategoryValue = (typeof AGENT_CATEGORIES)[number]['value'];
