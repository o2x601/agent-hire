type AgentCategory =
  | "customer_support"
  | "data_analysis"
  | "content_generation"
  | "coding"
  | "image_video"
  | "voice_translation"
  | "marketing"
  | "rpa"
  | "search_intelligence"
  | "security_monitoring"
  | "other";

export type JobTemplate = {
  title: string;
  problem_statement: string;
  required_specs: {
    skills: string[];
    preferred_skills: string[];
  };
  category: AgentCategory;
  budget_range_min: number;
  budget_range_max: number;
};

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    title: "受信メールの自動分類・振り分け担当",
    problem_statement:
      "毎日大量に届く問い合わせメールを手動で分類し、担当部署へ転送する作業に時間がかかっています。メールの内容を読み取り、カテゴリ別（請求・技術・クレーム・一般問い合わせ）に自動分類してラベル付けし、適切な担当者にルーティングできるAIエージェントを求めています。",
    required_specs: {
      skills: ["メール解析", "自然言語処理", "分類・タグ付け", "Gmail API"],
      preferred_skills: ["日本語対応", "Slack連携", "優先度判定"],
    },
    category: "rpa",
    budget_range_min: 30000,
    budget_range_max: 80000,
  },
  {
    title: "請求書OCR処理・経理アシスタント",
    problem_statement:
      "紙やPDFで届く請求書をExcelに手入力する作業が月次で20〜30時間発生しています。請求書の画像・PDFから取引先名、金額、支払期日などを自動抽出し、経理システムに登録できるエージェントが必要です。誤差±1%以内の精度を求めます。",
    required_specs: {
      skills: ["OCR", "PDF解析", "データ抽出", "構造化データ出力"],
      preferred_skills: ["freee連携", "マネーフォワード対応", "インボイス対応"],
    },
    category: "rpa",
    budget_range_min: 50000,
    budget_range_max: 120000,
  },
  {
    title: "競合サイトの価格監視担当",
    problem_statement:
      "主要競合5〜10サイトの商品価格を毎日確認し、自社との差異をレポートする作業を自動化したいです。価格変動があった際にアラートを送信し、週次レポートをSlackに投稿できるエージェントを求めています。",
    required_specs: {
      skills: ["Webスクレイピング", "価格比較", "データ集計", "定期実行"],
      preferred_skills: ["Slack通知", "Googleスプレッドシート連携", "グラフ生成"],
    },
    category: "search_intelligence",
    budget_range_min: 20000,
    budget_range_max: 60000,
  },
  {
    title: "カスタマーサポート一次対応",
    problem_statement:
      "ECサイトへの問い合わせ（注文状況・返品・配送）の一次対応を自動化したいです。FAQに基づいて回答し、解決できない場合は有人サポートへエスカレーションする仕組みを求めています。日本語での自然な対話が必須です。",
    required_specs: {
      skills: ["カスタマーサポート", "日本語対話", "FAQ対応", "エスカレーション"],
      preferred_skills: ["Zendesk連携", "チャットボット", "感情分析"],
    },
    category: "customer_support",
    budget_range_min: 80000,
    budget_range_max: 200000,
  },
  {
    title: "社内ドキュメント検索アシスタント",
    problem_statement:
      "社内に蓄積された規定・マニュアル・過去議事録などのドキュメントから、従業員が必要な情報を素早く検索できる仕組みが欲しいです。自然文での質問に答え、出典ドキュメントも提示できるエージェントを求めています。",
    required_specs: {
      skills: ["RAG", "ドキュメント検索", "自然言語処理", "ベクトル検索"],
      preferred_skills: ["Notion連携", "Confluence対応", "社内Wiki統合"],
    },
    category: "search_intelligence",
    budget_range_min: 60000,
    budget_range_max: 150000,
  },
  {
    title: "SNS投稿の自動生成・スケジューリング",
    problem_statement:
      "X（Twitter）・Instagram・LinkedInへの投稿コンテンツを週5〜10本生成し、最適な時間帯にスケジュール投稿したいです。ブランドトーンを維持しながら、各プラットフォームに最適化した文章と画像キャプションを作成できるエージェントを求めています。",
    required_specs: {
      skills: ["コンテンツ生成", "SNSマーケティング", "スケジューリング", "文章生成"],
      preferred_skills: ["画像生成", "ハッシュタグ最適化", "エンゲージメント分析"],
    },
    category: "marketing",
    budget_range_min: 30000,
    budget_range_max: 80000,
  },
  {
    title: "議事録の自動作成・要約",
    problem_statement:
      "オンライン会議（Zoom・Teams・Meet）の録音・録画から自動で議事録を作成し、決定事項・アクションアイテムを抽出してNotionやSlackに投稿できるエージェントが必要です。日本語対応必須。",
    required_specs: {
      skills: ["音声文字起こし", "要約生成", "アクションアイテム抽出", "日本語対応"],
      preferred_skills: ["Zoom連携", "Notion投稿", "多言語対応"],
    },
    category: "voice_translation",
    budget_range_min: 40000,
    budget_range_max: 100000,
  },
  {
    title: "データ入力・クレンジング担当",
    problem_statement:
      "複数ソース（CSV・Excel・Web）からデータを収集し、重複除去・フォーマット統一・欠損値補完を行って、クリーンなデータセットとして出力できるエージェントを求めています。月次で約10万件のレコードを処理できる処理速度が必要です。",
    required_specs: {
      skills: ["データクレンジング", "CSV処理", "重複除去", "データ変換"],
      preferred_skills: ["Googleスプレッドシート連携", "データベース出力", "バリデーション"],
    },
    category: "data_analysis",
    budget_range_min: 30000,
    budget_range_max: 70000,
  },
];
