import { notFound } from "next/navigation";
import Link from "next/link";
import { ScoutButton } from "@/components/agents/ScoutButton";
import { InterviewButton } from "@/components/agents/InterviewButton";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/schemas/agent";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CompanyInteraction = {
  id: string;
  job_id: string;
  status: string;
  type: string;
};

const STATUS_PRIORITY: Record<string, number> = {
  hired: 5,
  probation: 4,
  interviewing: 3,
  pending: 2,
  rejected: 1,
};

const CATEGORY_LABELS: Record<string, string> = {
  customer_support: "カスタマーサポート",
  data_analysis: "データ分析",
  content_generation: "コンテンツ生成",
  coding: "コーディング",
  image_video: "画像・動画",
  voice_translation: "音声・翻訳",
  marketing: "マーケティング",
  rpa: "RPA",
  search_intelligence: "検索・インテリジェンス",
  security_monitoring: "セキュリティ監視",
  other: "その他",
};

export default async function AgentResumePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data, error }, { data: { user } }] = await Promise.all([
    supabase.from("ai_agents").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (error || !data) notFound();

  const agent = data as Agent;
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = user?.user_metadata?.role as string | undefined;
  const isCompany = role === "company";
  const isOwner = user?.id === agent.developer_id;

  let companyJobs: { id: string; title: string }[] = [];
  let scoutedJobIds = new Set<string>();
  let companyInteractions: CompanyInteraction[] = [];

  if (isCompany && user) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (company) {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("company_id", company.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      companyJobs = jobsData ?? [];
      const jobIds = companyJobs.map((j) => j.id);

      if (jobIds.length > 0) {
        const { data: iData } = await supabase
          .from("interactions")
          .select("id, job_id, status, type")
          .eq("agent_id", id)
          .in("job_id", jobIds)
          .order("created_at", { ascending: false });

        companyInteractions = (iData ?? []) as CompanyInteraction[];
        scoutedJobIds = new Set(
          companyInteractions
            .filter((i) => i.type === "scout")
            .map((i) => i.job_id),
        );
      }
    }
  }

  const topInteraction = companyInteractions.reduce<CompanyInteraction | null>(
    (best, curr) =>
      (STATUS_PRIORITY[curr.status] ?? 0) > (STATUS_PRIORITY[best?.status ?? ""] ?? 0)
        ? curr
        : best,
    null,
  );

  const interviewingInteraction = companyInteractions.find(
    (i) => i.status === "interviewing",
  );

  const tr = agent.track_record;

  const uptimeColor = !tr ? "#9ca3af"
    : tr.uptime_percentage >= 99 ? "#059669"
    : tr.uptime_percentage >= 95 ? "#d97706"
    : "#dc2626";

  const errorColor = !tr ? "#9ca3af"
    : tr.error_rate <= 1 ? "#059669"
    : tr.error_rate <= 5 ? "#d97706"
    : "#dc2626";

  const stats = [
    {
      value: tr ? `${tr.uptime_percentage.toFixed(1)}%` : "N/A",
      label: "出勤率",
      color: uptimeColor,
      bg: !tr ? "#f9fafb" : uptimeColor + "10",
      border: !tr ? "#e5e7eb" : uptimeColor + "30",
    },
    {
      value: tr ? tr.total_processed.toLocaleString() : "0",
      label: "総処理数",
      color: "#111827",
      bg: "#f0f4ff",
      border: "#bfdbfe",
    },
    {
      value: tr ? `${tr.avg_response_ms}ms` : "N/A",
      label: "反応速度",
      color: "#111827",
      bg: "#f0f4ff",
      border: "#bfdbfe",
    },
    {
      value: tr ? `${tr.error_rate.toFixed(2)}%` : "N/A",
      label: "欠勤率",
      color: errorColor,
      bg: !tr ? "#f9fafb" : errorColor + "10",
      border: !tr ? "#e5e7eb" : errorColor + "30",
    },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending:      { label: "スカウト送信済み（返答待ち）", color: "#92400e", bg: "#fef3c7", border: "1px solid #fde68a" },
    interviewing: { label: "面接可能",                    color: "#1d4ed8", bg: "#eff6ff", border: "1px solid #bfdbfe" },
    probation:    { label: "試用期間中",                   color: "#6d28d9", bg: "#f5f3ff", border: "1px solid #ddd6fe" },
    hired:        { label: "採用済み",                    color: "#15803d", bg: "#f0fdf4", border: "1px solid #bbf7d0" },
    rejected:     { label: "不採用",                      color: "#b91c1c", bg: "#fef2f2", border: "1px solid #fecaca" },
  };

  const categoryLabel = agent.category ? (CATEGORY_LABELS[agent.category] ?? agent.category) : null;

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* 戻るリンク */}
        <Link
          href="/agents"
          className="ah-back-link"
          style={{ marginBottom: 28 }}
        >
          ← エージェント一覧に戻る
        </Link>

        {/* ── プロフィールカード ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            marginBottom: 24,
          }}
        >
          {/* バナー */}
          <div
            style={{
              height: 100,
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #2563eb 100%)",
              position: "relative",
            }}
          />

          {/* プロフィール情報 */}
          <div style={{ position: "relative", padding: "48px 28px 28px" }}>
            {/* アバター（バナー下端にまたがる） */}
            <div
              style={{
                position: "absolute",
                top: -40,
                left: 28,
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: "#ffffff",
                overflow: "hidden",
                border: "4px solid #ffffff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                letterSpacing: "-0.02em",
                zIndex: 2,
              }}
            >
              {agent.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.avatar_url} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>

            {/* アクションボタン */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {isCompany && topInteraction ? (
                  <>
                    {(() => {
                      const cfg = statusConfig[topInteraction.status];
                      if (!cfg) return null;
                      return (
                        <span style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: cfg.color,
                          backgroundColor: cfg.bg,
                          border: cfg.border,
                          padding: "7px 14px",
                          borderRadius: 8,
                          whiteSpace: "nowrap",
                        }}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                    {interviewingInteraction && (
                      <InterviewButton interactionId={interviewingInteraction.id} />
                    )}
                  </>
                ) : (
                  isCompany && companyJobs.length > 0 && (
                    <ScoutButton
                      agentId={agent.id}
                      agentName={agent.name}
                      companyJobs={companyJobs}
                      scoutedJobIds={scoutedJobIds}
                    />
                  )
                )}
                {isOwner && (
                  <Link
                    href={`/agents/${agent.id}/edit`}
                    className="ah-edit-link"
                  >
                    編集
                  </Link>
                )}
              </div>
            </div>

            {/* 名前・カテゴリ・説明 */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
                  {agent.name}
                </h1>
                <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#f0f4ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: 999 }}>
                  {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
                </span>
                {agent.is_verified && (
                  <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#059669", border: "1px solid #a7f3d0", padding: "3px 10px", borderRadius: 999 }}>
                    ✓ 認証済
                  </span>
                )}
              </div>
              {categoryLabel && (
                <p style={{ margin: "0 0 8px", fontSize: 14, color: "#6b7280", fontWeight: 500 }}>
                  {categoryLabel}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.7, maxWidth: 600 }}>
                {agent.personality || "説明なし"}
              </p>
            </div>
          </div>
        </div>

        {/* ── スキルセクション ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, background: "#2563eb", borderRadius: 2, display: "inline-block" }} />
            スキル
          </h2>
          {agent.skills.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {agent.skills.map((skill) => (
                <span key={skill} className="ah-skill-pill">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>スキルなし</p>
          )}
        </div>

        {/* ── 実績セクション ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, background: "#2563eb", borderRadius: 2, display: "inline-block" }} />
            実績 (Track Record)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {stats.map(({ value, label, color, bg, border }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: "18px 16px",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ポートフォリオ（予定） ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #d1d5db",
            borderRadius: 16,
            padding: 24,
            boxShadow: "none",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#9ca3af", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, background: "#d1d5db", borderRadius: 2, display: "inline-block" }} />
            ポートフォリオ
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#d1d5db" }}>
            Phase 2で実装予定
          </p>
        </div>
      </div>
    </div>
  );
}
