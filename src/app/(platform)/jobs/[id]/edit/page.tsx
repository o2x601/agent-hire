"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UpdateJobSchema, BudgetRangeSchema, RequiredSpecsSchema } from "@/schemas/job";
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
  sectionLabel: {
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
  fieldError: {
    fontSize: 12,
    color: "var(--destructive)",
    marginTop: 4,
  } as React.CSSProperties,
  textareaWrapper: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    overflow: "hidden",
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    minHeight: 140,
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
  numberInput: {
    flex: 1,
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
};

/* ─── タグ入力コンポーネント ─────────────────────────────────── */
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  color = "var(--primary)",
  colorDim = "color-mix(in srgb, var(--primary) 10%, transparent)",
  colorBorder = "color-mix(in srgb, var(--primary) 28%, transparent)",
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
  color?: string;
  colorDim?: string;
  colorBorder?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const s = input.trim();
    if (s && !tags.includes(s) && tags.length < 20) {
      onAdd(s);
    }
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: colorDim,
                border: `1px solid ${colorBorder}`,
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 500,
                color,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                style={{
                  background: "none",
                  border: "none",
                  color,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                  fontSize: 14,
                  opacity: 0.7,
                }}
                aria-label={`${tag}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!input.trim()}
        >
          追加
        </Button>
      </div>
      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>
        {tags.length} / 20 スキル
      </p>
    </div>
  );
}

/* ─── 数値フォーマット ───────────────────────────────────────── */
function formatNumber(raw: string): string {
  const n = parseInt(raw.replace(/,/g, ""), 10);
  return isNaN(n) ? raw : n.toLocaleString("ja-JP");
}

function parseNumber(formatted: string): string {
  return formatted.replace(/[^0-9]/g, "");
}

/* ─── メインコンポーネント ───────────────────────────────────── */
export default function EditJobPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  // ロード状態
  const [loading, setLoading] = useState(true);

  // フォーム状態
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("open");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ─── 初期データ取得 ─────────────────────────────────────── */
  useEffect(() => {
    async function loadJob() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const role = user.user_metadata?.role as string | undefined;
      if (role !== "company") {
        router.push("/jobs");
        return;
      }

      // 自社の求人かチェック
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: job, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error || !job) {
        router.push("/jobs");
        return;
      }

      if (!company || company.id !== job.company_id) {
        router.push("/jobs");
        return;
      }

      // フォームに初期値をセット
      setTitle(job.title ?? "");
      setProblemStatement(job.problem_statement ?? "");
      setDuration(job.duration ?? "");
      setCategory(job.category ?? "");
      setStatus(job.status ?? "open");

      const budget = BudgetRangeSchema.safeParse(job.budget_range);
      if (budget.success) {
        setBudgetMin(String(budget.data.min));
        setBudgetMax(String(budget.data.max));
      }

      const specs = RequiredSpecsSchema.safeParse(job.required_specs);
      if (specs.success) {
        setRequiredSkills(specs.data.skills ?? []);
        setPreferredSkills(specs.data.preferred_skills ?? []);
      }

      setLoading(false);
    }

    loadJob();
  }, [jobId, router]);

  /* ─── 保存 ─────────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    const hasBudget = budgetMin !== "" || budgetMax !== "";
    const budget_range = hasBudget
      ? {
          min: parseInt(budgetMin, 10) || 0,
          max: parseInt(budgetMax, 10) || 0,
        }
      : null;

    const hasSpecs = requiredSkills.length > 0 || preferredSkills.length > 0;
    const required_specs = hasSpecs
      ? {
          skills: requiredSkills.length > 0 ? requiredSkills : undefined,
          preferred_skills: preferredSkills.length > 0 ? preferredSkills : undefined,
        }
      : null;

    const payload = {
      title: title.trim(),
      problem_statement: problemStatement.trim(),
      budget_range,
      required_specs,
      status,
    };

    // Zodバリデーション
    const result = UpdateJobSchema.safeParse(payload);
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

    const { error: dbError } = await supabase
      .from("jobs")
      .update({
        ...result.data,
        budget_range: result.data.budget_range
          ? `[${result.data.budget_range.min},${result.data.budget_range.max}]`
          : null,
        duration: duration || null,
        category: category || null,
      })
      .eq("id", jobId);

    if (dbError) {
      setGlobalError(dbError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/jobs/${jobId}`);
  }

  /* ─── ローディング ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>読み込み中...</p>
      </div>
    );
  }

  /* ─── レンダリング ─────────────────────────────────────────── */
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
          href={`/jobs/${jobId}`}
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 20,
          }}
        >
          ← 求人詳細に戻る
        </Link>
        <p style={S.sectionLabel}>求人票</p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}
        >
          求人を編集する
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
          内容を更新して保存してください。
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── ポジション概要 ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>ポジション概要</CardTitle>
            <CardDescription>求人の基本情報です</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 募集タイトル */}
            <div>
              <label htmlFor="title" style={S.label}>
                募集タイトル
                <span style={{ color: "var(--destructive)", marginLeft: 4 }}>*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: カスタマーサポート自動化エージェント募集"
                required
                maxLength={200}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {fieldErrors["title"] ? (
                  <p style={S.fieldError}>{fieldErrors["title"]}</p>
                ) : (
                  <span />
                )}
                <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{title.length} / 200</p>
              </div>
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
                  width: "100%",
                  height: 40,
                  background: "var(--card)",
                  border: `1px solid ${fieldErrors["category"] ? "var(--destructive)" : "var(--border)"}`,
                  borderRadius: 8,
                  padding: "0 12px",
                  fontSize: 14,
                  color: category ? "var(--foreground)" : "var(--muted-foreground)",
                  outline: "none",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  appearance: "auto",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = fieldErrors["category"]
                    ? "var(--destructive)"
                    : "var(--border)")
                }
              >
                <option value="">選択してください</option>
                {AGENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {fieldErrors["category"] && (
                <p style={S.fieldError}>{fieldErrors["category"]}</p>
              )}
            </div>

            {/* 解決したい課題 */}
            <div>
              <label htmlFor="problem" style={S.label}>
                解決したい課題
                <span style={{ color: "var(--destructive)", marginLeft: 4 }}>*</span>
              </label>
              <div
                style={S.textareaWrapper}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <textarea
                  id="problem"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  maxLength={5000}
                  placeholder="解決したい課題を具体的に記述してください"
                  style={S.textarea}
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {fieldErrors["problem_statement"] ? (
                  <p style={S.fieldError}>{fieldErrors["problem_statement"]}</p>
                ) : (
                  <span />
                )}
                <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  {problemStatement.length} / 5000
                </p>
              </div>
            </div>

            {/* ステータス */}
            <div>
              <label htmlFor="status" style={S.label}>
                ステータス
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0 12px",
                  fontSize: 14,
                  color: "var(--foreground)",
                  outline: "none",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  appearance: "auto",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <option value="open">募集中</option>
                <option value="closed">募集終了</option>
                <option value="filled">採用済み</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ── 予算範囲 ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>予算範囲</CardTitle>
            <CardDescription>
              月額または年額の目安を入力してください
              <span style={{ ...S.hint, marginLeft: 0 }}>任意</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...S.label, marginBottom: 4 }}>下限</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 13,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    ¥
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budgetMin ? formatNumber(budgetMin) : ""}
                    onChange={(e) => setBudgetMin(parseNumber(e.target.value))}
                    placeholder="50,000"
                    style={{ ...S.numberInput, paddingLeft: 28 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              <span style={{ color: "var(--muted-foreground)", fontSize: 18, marginTop: 20, flexShrink: 0 }}>〜</span>

              <div style={{ flex: 1 }}>
                <label style={{ ...S.label, marginBottom: 4 }}>上限</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 13,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    ¥
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budgetMax ? formatNumber(budgetMax) : ""}
                    onChange={(e) => setBudgetMax(parseNumber(e.target.value))}
                    placeholder="200,000"
                    style={{ ...S.numberInput, paddingLeft: 28 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>
            </div>

            {fieldErrors["budget_range"] && (
              <p style={{ ...S.fieldError, marginTop: 8 }}>
                {fieldErrors["budget_range"]}
              </p>
            )}
            {budgetMin && budgetMax && parseInt(budgetMin) > parseInt(budgetMax) && (
              <p style={{ ...S.fieldError, marginTop: 8 }}>
                下限は上限以下にしてください
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── 契約期間 ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>契約期間</CardTitle>
            <CardDescription>
              契約期間の目安を選択してください
              <span style={{ ...S.hint, marginLeft: 0 }}>任意</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 14,
                color: duration ? "var(--foreground)" : "var(--muted-foreground)",
                outline: "none",
                fontFamily: "inherit",
                cursor: "pointer",
                appearance: "auto",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <option value="">選択してください</option>
              <option value="1ヶ月未満">1ヶ月未満</option>
              <option value="1〜3ヶ月">1〜3ヶ月</option>
              <option value="3〜6ヶ月">3〜6ヶ月</option>
              <option value="6ヶ月〜1年">6ヶ月〜1年</option>
              <option value="1年以上">1年以上</option>
              <option value="期間未定">期間未定</option>
            </select>
          </CardContent>
        </Card>

        {/* ── スキル要件 ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>スキル要件</CardTitle>
            <CardDescription>
              スキルは求人検索のフィルタリングに使われます。Enter または「,」で追加
            </CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 必須スキル */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    padding: "2px 10px",
                    background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--destructive)",
                  }}
                >
                  必須
                </span>
                <label style={{ ...S.label, marginBottom: 0 }}>必須スキル</label>
              </div>
              <TagInput
                tags={requiredSkills}
                onAdd={(s) => setRequiredSkills((p) => [...p, s])}
                onRemove={(s) => setRequiredSkills((p) => p.filter((x) => x !== s))}
                placeholder="例: 自然言語処理, REST API, 日本語対応..."
                color="var(--destructive)"
                colorDim="color-mix(in srgb, var(--destructive) 8%, transparent)"
                colorBorder="color-mix(in srgb, var(--destructive) 25%, transparent)"
              />
            </div>

            {/* 区切り線 */}
            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* あると嬉しいスキル */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    padding: "2px 10px",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#10B981",
                  }}
                >
                  あると嬉しい
                </span>
                <label style={{ ...S.label, marginBottom: 0 }}>歓迎スキル</label>
              </div>
              <TagInput
                tags={preferredSkills}
                onAdd={(s) => setPreferredSkills((p) => [...p, s])}
                onRemove={(s) => setPreferredSkills((p) => p.filter((x) => x !== s))}
                placeholder="例: Webhook対応, 多言語, Slack連携..."
                color="#10B981"
                colorDim="rgba(16,185,129,0.08)"
                colorBorder="rgba(16,185,129,0.2)"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── グローバルエラー ──────────────────────────────────── */}
        {globalError && <div style={S.error}>{globalError}</div>}

        {/* ── 保存ボタン ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
          <Link href={`/jobs/${jobId}`}>
            <Button type="button" variant="ghost">
              キャンセル
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              submitting ||
              !title.trim() ||
              !problemStatement.trim() ||
              !category ||
              (!!budgetMin && !!budgetMax && parseInt(budgetMin) > parseInt(budgetMax))
            }
          >
            {submitting ? "保存中..." : "変更を保存する →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
