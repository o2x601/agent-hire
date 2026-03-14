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

// ステータスの優先度（高いほど「進んでいる」）
const STATUS_PRIORITY: Record<string, number> = {
  hired: 5,
  probation: 4,
  interviewing: 3,
  pending: 2,
  rejected: 1,
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

  // 最も「進んでいる」interactionを選ぶ
  const topInteraction = companyInteractions.reduce<CompanyInteraction | null>(
    (best, curr) =>
      (STATUS_PRIORITY[curr.status] ?? 0) > (STATUS_PRIORITY[best?.status ?? ""] ?? 0)
        ? curr
        : best,
    null,
  );

  // interviewing の interaction があれば面接ボタンを出す
  const interviewingInteraction = companyInteractions.find(
    (i) => i.status === "interviewing",
  );

  const tr = agent.track_record;
  const stats = [
    {
      value: tr ? `${tr.uptime_percentage.toFixed(1)}%` : "N/A",
      label: "稼働率",
      color: tr
        ? tr.uptime_percentage >= 99
          ? "#16a34a"
          : tr.uptime_percentage >= 95
          ? "#d97706"
          : "#dc2626"
        : "#9ca3af",
    },
    {
      value: tr ? tr.total_processed.toLocaleString() : "0",
      label: "総処理数",
      color: "#111827",
    },
    {
      value: tr ? `${tr.avg_response_ms}ms` : "N/A",
      label: "平均応答時間",
      color: "#111827",
    },
    {
      value: tr ? `${tr.error_rate.toFixed(2)}%` : "N/A",
      label: "エラー率",
      color: tr
        ? tr.error_rate <= 1
          ? "#16a34a"
          : tr.error_rate <= 5
          ? "#d97706"
          : "#dc2626"
        : "#9ca3af",
    },
  ];

  // 企業向けステータス表示の定義
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:      { label: "スカウト送信済み（返答待ち）", color: "#4b5563", bg: "#f3f4f6" },
    interviewing: { label: "面接可能",                   color: "#4b5563", bg: "#f3f4f6" },
    probation:    { label: "試用期間中",                  color: "#4b5563", bg: "#f3f4f6" },
    hired:        { label: "採用済み",                   color: "#4b5563", bg: "#f3f4f6" },
    rejected:     { label: "不採用",                     color: "#4b5563", bg: "#f3f4f6" },
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 32, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* 戻るリンク */}
      <Link
        href="/agents"
        style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}
      >
        ← エージェント一覧に戻る
      </Link>

      {/* ── ヘッダーセクション ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 32 }}>

        {/* アバター */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          backgroundColor: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: 600,
          color: "#4b5563",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {agent.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agent.avatar_url} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : initials}
        </div>

        {/* 右: 名前・説明・ボタン */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 1行目: 名前 + 料金タイプバッジ */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
              {agent.name}
            </h1>
            <span style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#f3f4f6", color: "#4b5563", padding: "3px 8px", borderRadius: 99 }}>
              {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
            </span>
            {agent.is_verified && (
              <span style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#f0fdf4", color: "#16a34a", padding: "3px 8px", borderRadius: 99 }}>
                認証済
              </span>
            )}
          </div>

          {/* 2行目: 説明文 */}
          <p style={{ margin: "6px 0 0", fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
            {agent.personality || "説明なし"}
          </p>

          {/* 3行目: アクションエリア */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 8, marginTop: 16 }}>
            {isCompany && topInteraction ? (
              // interaction がある場合: ステータスバッジ + 面接ボタン
              <>
                {(() => {
                  const cfg = statusConfig[topInteraction.status];
                  if (!cfg) return null;
                  return (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: cfg.color,
                      backgroundColor: cfg.bg,
                      padding: "3px 8px",
                      borderRadius: 99,
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
              // interaction なし: スカウトボタン
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
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  textDecoration: "none",
                }}
              >
                編集
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── スキルセクション ── */}
      <>
        <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: 32 }} />
        <section style={{ marginBottom: 0 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
            スキル
          </h2>
          {agent.skills.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {agent.skills.map((skill) => (
                <span key={skill} style={{ fontSize: 13, padding: "6px 12px", backgroundColor: "#f3f4f6", borderRadius: 99, color: "#4b5563" }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>スキルなし</p>
          )}
        </section>
      </>

      {/* ── 実績セクション ── */}
      <div style={{ borderTop: "1px solid #f3f4f6", margin: "32px 0" }} />
      <section>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
          実績 (Track Record)
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {stats.map(({ value, label, color }) => (
            <div key={label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                {value}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ポートフォリオセクション ── */}
      <div style={{ borderTop: "1px solid #f3f4f6", margin: "32px 0" }} />
      <section>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
          ポートフォリオ
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
          ポートフォリオはPhase 1で実装予定です。
        </p>
      </section>

    </div>
  );
}
