"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CreateJobSchema } from "@/schemas/job";
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
    color: "#7A8FA8",
    marginBottom: 6,
  } as React.CSSProperties,
  hint: {
    fontSize: 11,
    color: "#3A4D62",
    marginLeft: 6,
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#3B82F6",
    marginBottom: 4,
  } as React.CSSProperties,
  error: {
    padding: "10px 14px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 8,
    fontSize: 13,
    color: "#EF4444",
  } as React.CSSProperties,
  fieldError: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  } as React.CSSProperties,
  textareaWrapper: {
    background: "#131A25",
    border: "1px solid #1E2A3A",
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
    color: "#E2EAF4",
    lineHeight: 1.6,
    padding: "10px 12px",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as React.CSSProperties,
  numberInput: {
    flex: 1,
    height: 40,
    background: "#131A25",
    border: "1px solid #1E2A3A",
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 14,
    color: "#E2EAF4",
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
  color = "#3B82F6",
  colorDim = "rgba(59,130,246,0.1)",
  colorBorder = "rgba(59,130,246,0.28)",
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
      <p style={{ fontSize: 11, color: "#3A4D62", marginTop: 6 }}>
        {tags.length} / 20 スキル
      </p>
    </div>
  );
}

/* ─── メインコンポーネント ───────────────────────────────────── */
export default function NewJobPage() {
  const router = useRouter();

  // フォーム状態
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ─── 送信 ─────────────────────────────────────────────────── */
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
    };

    // Zodバリデーション
    const result = CreateJobSchema.safeParse(payload);
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

    // 企業プロフィールを取得 or 作成
    let companyId: string;
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (company) {
      companyId = company.id;
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert({ user_id: user.id, name: user.email ?? "未設定" })
        .select("id")
        .single();

      if (companyError || !newCompany) {
        setGlobalError("企業プロフィールの作成に失敗しました: " + companyError?.message);
        setSubmitting(false);
        return;
      }
      companyId = newCompany.id;
    }

    // 求人票を保存
    const { error: dbError } = await supabase.from("jobs").insert({
      ...result.data,
      company_id: companyId,
    });

    if (dbError) {
      setGlobalError(dbError.message);
      setSubmitting(false);
      return;
    }

    router.push("/agents");
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
          href="/agents"
          style={{
            fontSize: 13,
            color: "#7A8FA8",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 20,
          }}
        >
          ← エージェント一覧に戻る
        </Link>
        <p style={S.sectionLabel}>求人票</p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#E2EAF4",
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}
        >
          求人票を投稿する
        </h1>
        <p style={{ fontSize: 14, color: "#7A8FA8" }}>
          「何ができるAIが欲しいか」を具体的に書くほど、最適なエージェントとマッチしやすくなります。
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
                <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>
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
                <p style={{ fontSize: 11, color: "#3A4D62" }}>{title.length} / 200</p>
              </div>
            </div>

            {/* 解決したい課題 */}
            <div>
              <label htmlFor="problem" style={S.label}>
                解決したい課題
                <span style={{ color: "#EF4444", marginLeft: 4 }}>*</span>
              </label>
              <div
                style={S.textareaWrapper}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2A3A")}
              >
                <textarea
                  id="problem"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  maxLength={5000}
                  placeholder={`例:\n月次の売上レポートを自動で集計し、Slackに投稿するAIが欲しい。\n現在は担当者が毎月手動でExcelを集計しており、3〜4時間かかっている。\n精度よりもスピードを優先し、誤差±5%以内であれば許容する。`}
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
                <p style={{ fontSize: 11, color: "#3A4D62" }}>
                  {problemStatement.length} / 5000
                </p>
              </div>
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
                      color: "#7A8FA8",
                    }}
                  >
                    ¥
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="50,000"
                    style={{ ...S.numberInput, paddingLeft: 28 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2A3A")}
                  />
                </div>
              </div>

              <span style={{ color: "#3A4D62", fontSize: 18, marginTop: 20, flexShrink: 0 }}>〜</span>

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
                      color: "#7A8FA8",
                    }}
                  >
                    ¥
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="200,000"
                    style={{ ...S.numberInput, paddingLeft: 28 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2A3A")}
                  />
                </div>
              </div>
            </div>

            {fieldErrors["budget_range"] && (
              <p style={{ ...S.fieldError, marginTop: 8 }}>
                {fieldErrors["budget_range"]}
              </p>
            )}
            {/* min > max クライアント側警告 */}
            {budgetMin && budgetMax && parseInt(budgetMin) > parseInt(budgetMax) && (
              <p style={{ ...S.fieldError, marginTop: 8 }}>
                下限は上限以下にしてください
              </p>
            )}
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
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#EF4444",
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
                color="#EF4444"
                colorDim="rgba(239,68,68,0.08)"
                colorBorder="rgba(239,68,68,0.25)"
              />
            </div>

            {/* 区切り線 */}
            <div style={{ borderTop: "1px solid #1E2A3A" }} />

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

        {/* ── 送信ボタン ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
          <Link href="/agents">
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
              (!!budgetMin && !!budgetMax && parseInt(budgetMin) > parseInt(budgetMax))
            }
          >
            {submitting ? "投稿中..." : "求人票を投稿する →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
