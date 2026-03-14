# Agent-Hire — CLAUDE.md

## Project Overview
既存の求人サイト・LinkedInの「人」を「AIエージェント/AIサービス」に置き換えたプラットフォーム。

### 2つのユーザー
- **AIエージェント/AIサービス運営者（求職者側）**: 自分のAIのプロフィール（履歴書）を作成し、企業に応募したり、スカウトを受ける
- **企業（採用者側）**: 「こんな業務を任せたい」という求人を出したり、良いAIエージェントを見つけてスカウトする

### 既存サービスとの対応
| 既存サービス | Agent-Hireでの置き換え |
|---|---|
| 求人サイト（Indeed等）の「人材募集」 | 「AIエージェント募集」 |
| LinkedInの「人材スカウト」 | 「AIエージェントスカウト」 |
| 求職者のプロフィール | AIエージェントの履歴書（スキル、実績、API仕様） |
| 面接 | APIテスト・動作検証 |
| 採用・給与 | API契約・利用料 |

### 回り方
1. AIサービス運営者がAIの「履歴書」を登録
2. 企業が「こんなAIが欲しい」と求人を出す
3. 双方向のマッチング（AI側から応募 / 企業側からスカウト）
4. 面接（APIテスト）で相性を確認
5. 採用（API契約）

### Differentiator（差別化）
現状のAIエージェント/AIサービス市場の課題：
- SNSのフォロワー数や知名度がある開発者のサービスばかりが注目される
- Product HuntやX(Twitter)での拡散力がないと、優れたサービスでも埋もれる
- 企業側も「話題になっているから」で選び、本当に業務に合うAIを見つけられていない

Agent-Hireの解決策：
- 「誰が作ったか」ではなく「何ができるか」で評価される仕組み
- 実績データ（稼働率、処理速度、正答率）とAPIテスト（面接）による客観的な実力評価
- 知名度ゼロでも、実力があれば企業からスカウトされる構造
- 求人サイトのように「スキル要件マッチング」で検索されるため、SNSフォロワー数は無関係

キャッチコピーの方向性：
- メイン: 「実力で選ばれる、AIの求人市場。」
- サブ: 「フォロワー数じゃない。稼働率で語れ。」

---

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes + Supabase / Server Actions
- **DB**: PostgreSQL (Supabase Cloud Free Tier)
- **Auth**: Supabase Auth (GoTrue)
- **Infrastructure**: VPS (Ubuntu, XServer 8GB) + Coolify でデプロイ。Supabase は Cloud Free Tier を使用。
- **面接機能**: Next.js Server Actions で実装（FastAPI不要）

## Project Structure
```
agent-hire/
├── src/
│   ├── app/
│   │   ├── (marketing)/      # LP・公開ページ
│   │   │   └── page.tsx      # ランディングページ
│   │   └── (platform)/       # ログイン後のプラットフォーム
│   │       └── agents/       # エージェント一覧・詳細
│   └── components/
│       ├── agents/           # AgentカードUI
│       ├── shared/           # 共通コンポーネント
│       └── ui/               # shadcn/ui ベース
├── supabase/
│   └── migrations/           # DBマイグレーション
```

## Dev Commands
```bash
npm run dev    # 開発サーバー起動 (http://localhost:3000)
npm run build  # プロダクションビルド
npm run lint   # ESLint
```

---

## Data Model

### agent_category ENUM
```
'customer_support', 'data_analysis', 'content_generation', 'coding',
'image_video', 'voice_translation', 'marketing', 'rpa',
'search_intelligence', 'security_monitoring', 'other'
```

### ai_agents（主要カラム）
| カラム | 型 | 備考 |
|---|---|---|
| id | UUID | PK |
| developer_id | UUID | auth.users FK |
| name | TEXT | エージェント名 |
| category | agent_category ENUM | エージェントカテゴリ |
| skills | TEXT[] | スキルタグ |
| pricing_model | TEXT | 'subscription' / 'usage_based' |
| api_endpoint | TEXT | healthcheck対象URL |
| is_active | BOOLEAN | 死活監視フラグ。3日連続unreachableで自動false |
| last_health_check | TIMESTAMPTZ | 最終Health Check日時 |
| health_check_status | TEXT | 'healthy' / 'degraded' / 'unreachable' / 'unknown' |
| monthly_salary_jpy | INTEGER | 月給表記用（NULL可） |
| track_record | JSONB | 実績データ（稼働率・応答速度等） |

### companies（主要カラム）
| カラム | 型 | 備考 |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | auth.users FK |
| name | TEXT | 企業名 |

### jobs（主要カラム）
| カラム | 型 | 備考 |
|---|---|---|
| id | UUID | PK |
| company_id | UUID | companies FK |
| title | TEXT | 求人タイトル |
| category | agent_category ENUM | カテゴリ |
| problem_statement | TEXT | 解決したい課題 |
| budget_range | int4range | 予算範囲 |
| required_specs | JSONB | スキル要件 |

### interactions（主要カラム）
| カラム | 型 | 備考 |
|---|---|---|
| id | UUID | PK |
| agent_id | UUID | ai_agents FK |
| job_id | UUID | jobs FK |
| status | TEXT ENUM | 'pending' / 'rejected' / 'interviewing' / 'probation' / 'hired' |
| test_result | JSONB | 面接（Health Check）結果 |

---

## MVP Phases

### Phase 1（現行）
- エージェント履歴書 CRUD
- 求人票 CRUD
- 応募・スカウト（interactions）
- **面接機能**: Server Actions による Health Check（api_endpoint へ fetch → status + response_time 計測 → interactions.test_result に JSONB 保存）
- **定期 Health Check**: 1日1回 CRON → is_active 管理 → 3日連続 unreachable で自動休職
- **求人票テンプレート**: JD Templates（8〜10個のプリセット求人票）
- **probation ステータス**: 試用期間（採用後に probation → 本採用で hired）
- **月給表記への統一**: UIテキスト（料金→月給、稼働率→出勤率、エラー率→欠勤率）
- Trust & Verification Level 1（バッジ表示）

### Phase 2
- LLM 統合（履歴書自動生成、求人票自動整形）のみに FastAPI を使用
- 法人番号照合（国税庁API）
- 高度な検索・フィルタリング

### Phase 3
- 運営による手動審査バッジ
- 個人・フリーランスロール対応
- 料金モデル分離（個人: 月額制 / 企業: 従量制）

---

## HR Metaphor UI Guidelines

UIテキストは以下のHRメタファーに統一する:

| 技術用語 | HR表記 |
|---|---|
| 月額料金 | 月給 |
| API接続テスト | 面接 |
| 契約開始 | 採用 |
| エラー率 | 欠勤率 |
| 応答速度 | 反応速度 |
| 稼働率 | 出勤率 |
| is_active=false | 休職中 |
| Verified | 身元確認済み |
| probation | 試用期間 |

---

## Trust & Verification（信頼性担保）

### エージェント側 信頼性レベル
- **Level 1 - 接続確認済みバッジ**: healthcheckエンドポイントへの疎通確認が取れたエージェントに付与
- **Level 2 - 定期計測バッジ**: 定期的なAPI呼び出しで稼働率・応答時間を自動計測・更新
- **Level 3 - 手動レビュー済みバッジ**: 運営による動作確認・コードレビューを経て付与

### 企業側 信頼性レベル
- **Level 1 - ドメイン確認済みバッジ**: 登録メールアドレスのドメイン判定（独自ドメイン/フリーメール区分）
- **Level 2 - 法人確認済みバッジ**: 法人番号照合による実在企業の確認
- **Level 3 - 手動審査済みバッジ**: 運営による手動レビューを経て付与

### MVP最低限実装（現フェーズ）
- 未検証バッジ / 接続確認済みバッジの表示
- フリーメール / 独自ドメイン区分の表示
- 報告機能（エージェント・求人への通報ボタン）

### スコープ
- 現在はB2Bのみ（企業 ↔ AIエージェント開発者）
- 個人ユーザー向け機能はPost-MVP

---

## Production Environment

- **URL**: https://agent-hire.solvan.jp
- **API Proxy**: https://api.agent-hire.solvan.jp（VPS上のCaddy → supabase-kong。Supabase Cloud移行後は不要）
- **Supabase**: https://ubwlorhnsjkmypkipyka.supabase.co
- **Deploy**: Coolify (Nixpacks) → GitHub main push後に手動Deploy
- **環境変数**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- **TypeScript**: `ignoreBuildErrors=true`（MVP段階。型生成整備後に解除）
