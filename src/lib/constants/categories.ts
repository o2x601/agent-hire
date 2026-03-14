export const AGENT_CATEGORIES = [
  { value: 'customer_support', label: 'カスタマーサポート' },
  { value: 'data_analysis', label: 'データ分析' },
  { value: 'content_generation', label: 'コンテンツ生成' },
  { value: 'image_video', label: '画像・動画生成' },
  { value: 'coding', label: 'コーディング・開発支援' },
  { value: 'sales', label: '営業・セールス' },
  { value: 'marketing', label: 'マーケティング' },
  { value: 'accounting', label: '経理・会計' },
  { value: 'hr', label: '人事・採用' },
  { value: 'other', label: 'その他' },
] as const;

export type AgentCategoryValue = (typeof AGENT_CATEGORIES)[number]['value'];
