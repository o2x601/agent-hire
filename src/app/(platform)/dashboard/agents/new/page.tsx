"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CreateAgentSchema } from "@/schemas/agent";
import { AGENT_CATEGORIES } from "@/lib/constants/categories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─── 定数 ──────────────────────────────────────────────────── */
const PRICING_OPTIONS = [
  {
    value: "subscription" as const,
    label: "サブスクリプション",
    sub: "月額固定料金で利用できる",
    icon: "📅",
  },
  {
    value: "usage_based" as const,
    label: "従量課金",
    sub: "リクエスト数・処理量に応じて課金",
    icon: "⚡",
  },
];

/* ─── スタイル定数 ───────────────────────────────────────────── */
const S = {
  label: {
    display: "block" as const,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--muted-foreground)",
    marginBottom: 6,
  } as React.CSSProperties,
  hint: {
    fontSize: 11,
    color: "var(--muted-foreground)",
    opacity: 0.7,
    marginLeft: 6,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "var(--primary)",
    marginBottom: 4,
  } as React.CSSProperties,
  error: {
    padding: "10px 14px",
    background: "color-mix(in srgb, var(--destructive) 8%, transparent)",
    border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
    borderRadius: 8,
    fontSize: 13,
    color: "var(--destructive)",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    minHeight: 96,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "vertical" as const,
    fontSize: 14,
    color: "var(--foreground)",
    lineHeight: 1.6,
    padding: "10px 12px",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as React.CSSProperties,
  textareaWrapper: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    overflow: "hidden",
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  numberInput: {
    width: "100%",
    height: 40,
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 14,
    color: "var(--foreground)",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as React.CSSProperties,
  unit: {
    fontSize: 11,
    color: "var(--muted-foreground)",
    marginTop: 4,
    textAlign: "right" as const,
  } as React.CSSProperties,
};

/* ─── メインコンポーネント ───────────────────────────────────── */
export default function NewAgentPage() {
  const router = useRouter();

  // フォーム状態
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [personality, setPersonality] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [pricingModel, setPricingModel] = useState<"subscription" | "usage_based">("subscription");
  const [category, setCategory] = useState<string>("");
  const [apiEndpoint, setApiEndpoint] = useState("");

  // 実績データ
  const [uptime, setUptime] = useState("");
  const [totalProcessed, setTotalProcessed] = useState("");
  const [avgResponseMs, setAvgResponseMs] = useState("");
  const [errorRate, setErrorRate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ─── スキルタグ操作 ─────────────────────────────────────── */
  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills((prev) => [...prev, s]);
    }
    setSkillInput("");
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && skillInput === "" && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  }

  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s));
  }

  /* ─── 送信 ───────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    // 実績データ（いずれか入力あれば全フィールド必須）
    const hasTrack = uptime || totalProcessed || avgResponseMs || errorRate;
    const trackRecord = hasTrack
      ? {
          uptime_percentage: parseFloat(uptime) || 0,
          total_processed: parseInt(totalProcessed, 10) || 0,
          avg_response_ms: parseFloat(avgResponseMs) || 0,
          error_rate: parseFloat(errorRate) || 0,
          last_active_at: null,
        }
      : null;

    const payload = {
      name: name.trim(),
      avatar_url: avatarUrl.trim() || null,
      personality: personality.trim() || null,
      skills,
      track_record: trackRecord,
      pricing_model: pricingModel,
      api_endpoint: apiEndpoint.trim() || null,
    };

    if (!category) {
      setFieldErrors({ category: "カテゴリを選択してください" });
      setGlobalError("入力内容を確認してください。");
      return;
    }

    // Zodバリデーション
    const result = CreateAgentSchema.safeParse(payload);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        errs[path] = issue.message;
      }
      setFieldErrors(errs);
      setGlobalError("入力内容を確認してください。");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: dbError } = await supabase.from("ai_agents").insert({
      ...result.data,
      developer_id: user.id,
      category: category || null,
    });

    if (dbError) {
      setGlobalError(dbError.message);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  /* ─── レンダリング ───────────────────────────────────────── */
  return (
    <div
      style={{
        padding: "48px 24px 96px",
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ページヘッダー */}
      <div style={{ marginBottom: 40 }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 13, color: "var(--muted-foreground)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}
        >
          ← ダッシュボードに戻る
        </Link>
        <p style={S.sectionTitle}>AI履歴書</p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}
        >
          履歴書を作成する
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
          「誰が作ったか」ではなく「何ができるか」で評価される。実力を正直に書こう。
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── 基本情報 ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>企業が最初に目にするプロフィールです</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* エージェント名 */}
            <div>
              <label htmlFor="name" style={S.label}>
                エージェント名
                <span style={{ color: "var(--destructive)", marginLeft: 4 }}>*</span>
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: DataAnalyst Pro, SupportBot v2"
                required
              />
              {fieldErrors["name"] && (
                <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 4 }}>
                  {fieldErrors["name"]}
                </p>
              )}
            </div>

            {/* アバター画像URL */}
            <div>
              <label htmlFor="avatar" style={S.label}>
                アバター画像URL
                <span style={S.hint}>任意</span>
              </label>
              <Input
                id="avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
              {fieldErrors["avatar_url"] && (
                <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 4 }}>
                  {fieldErrors["avatar_url"]}
                </p>
              )}
            </div>

            {/* カテゴリ */}
            <div>
              <label htmlFor="category" style={S.label}>
                カテゴリ
                <span style={{ color: "var(--destructive)", marginLeft: 4 }}>*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{
                  ...S.numberInput,
                  cursor: "pointer",
                  appearance: "none" as const,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 32,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <option value="" disabled>カテゴリを選択してください</option>
                {AGENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {fieldErrors["category"] && (
                <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 4 }}>
                  {fieldErrors["category"]}
                </p>
              )}
            </div>

            {/* 性格・振る舞い */}
            <div>
              <label htmlFor="personality" style={S.label}>
                性格・振る舞い
                <span style={S.hint}>任意 · 500文字以内</span>
              </label>
              <div
                style={S.textareaWrapper}
                onFocus={(e) => ((e.currentTarget.style.borderColor = "var(--primary)"))}
                onBlur={(e) => ((e.currentTarget.style.borderColor = "var(--border)"))}
              >
                <textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  maxLength={500}
                  placeholder="例: 丁寧で簡潔な返答を心がけます。技術用語は平易な言葉に言い換え、ユーザーが迷わないよう段階的にガイドします。"
                  style={S.textarea}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, textAlign: "right" }}>
                {personality.length} / 500
              </p>
              {fieldErrors["personality"] && (
                <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 4 }}>
                  {fieldErrors["personality"]}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── スキル・得意領域 ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>スキル・得意領域</CardTitle>
            <CardDescription>
              企業が検索するキーワードになります。Enter または「,」で追加
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* タグ表示 */}
            {skills.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--primary) 28%, transparent)",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--primary)",
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                        fontSize: 14,
                        opacity: 0.7,
                      }}
                      aria-label={`${skill}を削除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* タグ入力 */}
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="例: 自然言語処理, データ分析, Python API..."
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkill}
                disabled={!skillInput.trim()}
              >
                追加
              </Button>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>
              {skills.length} / 20 スキル
            </p>
          </CardContent>
        </Card>

        {/* ── 実績データ ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>実績データ</CardTitle>
            <CardDescription>
              履歴書の核心部分です。稼働率や処理速度が企業の判断基準になります
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 16,
              }}
            >
              {/* 稼働率 */}
              <div>
                <label style={S.label}>
                  稼働率
                  <span style={S.hint}>0〜100</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={uptime}
                    onChange={(e) => setUptime(e.target.value)}
                    placeholder="99.9"
                    style={S.numberInput}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <p style={S.unit}>%</p>
                {fieldErrors["track_record.uptime_percentage"] && (
                  <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 2 }}>
                    {fieldErrors["track_record.uptime_percentage"]}
                  </p>
                )}
              </div>

              {/* 累計処理数 */}
              <div>
                <label style={S.label}>
                  累計処理数
                  <span style={S.hint}>リクエスト数など</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={totalProcessed}
                  onChange={(e) => setTotalProcessed(e.target.value)}
                  placeholder="1000000"
                  style={S.numberInput}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <p style={S.unit}>件</p>
                {fieldErrors["track_record.total_processed"] && (
                  <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 2 }}>
                    {fieldErrors["track_record.total_processed"]}
                  </p>
                )}
              </div>

              {/* 平均応答速度 */}
              <div>
                <label style={S.label}>
                  平均応答速度
                  <span style={S.hint}>小さいほど高速</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={avgResponseMs}
                  onChange={(e) => setAvgResponseMs(e.target.value)}
                  placeholder="320"
                  style={S.numberInput}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <p style={S.unit}>ms</p>
                {fieldErrors["track_record.avg_response_ms"] && (
                  <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 2 }}>
                    {fieldErrors["track_record.avg_response_ms"]}
                  </p>
                )}
              </div>

              {/* エラー率 */}
              <div>
                <label style={S.label}>
                  エラー率
                  <span style={S.hint}>0〜100</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={errorRate}
                  onChange={(e) => setErrorRate(e.target.value)}
                  placeholder="0.1"
                  style={S.numberInput}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <p style={S.unit}>%</p>
                {fieldErrors["track_record.error_rate"] && (
                  <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 2 }}>
                    {fieldErrors["track_record.error_rate"]}
                  </p>
                )}
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 16 }}>
              ※ 実績データはすべて任意です。いずれかを入力した場合、全フィールドが検証されます。
            </p>
          </CardContent>
        </Card>

        {/* ── 料金モデル ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>料金モデル</CardTitle>
            <CardDescription>企業側が契約形態を選ぶ際の判断材料になります</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", gap: 12 }}>
              {PRICING_OPTIONS.map((opt) => {
                const selected = pricingModel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPricingModel(opt.value)}
                    style={{
                      flex: 1,
                      padding: "16px 20px",
                      background: selected
                        ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                        : "var(--card)",
                      border: selected
                        ? "1px solid color-mix(in srgb, var(--primary) 50%, transparent)"
                        : "1px solid var(--border)",
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: selected ? "var(--primary)" : "var(--foreground)",
                        marginBottom: 4,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── APIエンドポイント ─────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>APIエンドポイント</CardTitle>
            <CardDescription>
              企業が「面接（APIテスト）」を行う際に接続するURLです
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.your-agent.com/v1"
            />
            {fieldErrors["api_endpoint"] && (
              <p style={{ fontSize: 12, color: "var(--destructive)", marginTop: 6 }}>
                {fieldErrors["api_endpoint"]}
              </p>
            )}
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>
              ※ 後から追加・変更できます
            </p>
          </CardContent>
        </Card>

        {/* ── グローバルエラー ──────────────────────────────── */}
        {globalError && <div style={S.error}>{globalError}</div>}

        {/* ── 送信ボタン ────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 8,
          }}
        >
          <Link href="/dashboard">
            <Button type="button" variant="ghost">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={submitting || !name.trim() || !category}>
            {submitting ? "提出中..." : "履歴書を提出する →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
