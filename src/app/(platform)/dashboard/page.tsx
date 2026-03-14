import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bot, Mail, Zap, CheckCircle2 } from "lucide-react";
import { ScoutResponseButton } from "@/components/dashboard/ScoutResponseButton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";

type ScoutRow = {
  id: string;
  status: string;
  chat_log: unknown;
  created_at: string;
  agent_id: string;
  job_id: string;
};

function getFirstMessage(chatLog: unknown): string | null {
  if (!Array.isArray(chatLog) || chatLog.length === 0) return null;
  const first = chatLog[0] as { content?: string };
  return typeof first.content === "string" ? first.content : null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: agentsData } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("developer_id", user.id);

  const agents = agentsData ?? [];
  const agentIds = agents.map((a) => a.id);
  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  let scouts: ScoutRow[] = [];
  let scoutJobMap = new Map<string, string>();
  let scoutJobCompanyMap = new Map<string, string>();

  if (agentIds.length > 0) {
    const { data: scoutsData } = await supabase
      .from("interactions")
      .select("id, status, chat_log, created_at, agent_id, job_id")
      .in("agent_id", agentIds)
      .eq("type", "scout")
      .order("created_at", { ascending: false });

    scouts = (scoutsData ?? []) as ScoutRow[];

    if (scouts.length > 0) {
      const jobIds = Array.from(new Set(scouts.map((s) => s.job_id)));
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, company_id")
        .in("id", jobIds);

      const companyIds = Array.from(
        new Set((jobsData ?? []).map((j) => j.company_id)),
      );
      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);

      const companyNameMap = new Map(
        (companiesData ?? []).map((c) => [c.id, c.name]),
      );

      for (const job of jobsData ?? []) {
        scoutJobMap.set(job.id, job.title);
        scoutJobCompanyMap.set(job.id, companyNameMap.get(job.company_id) ?? "不明な企業");
      }
    }
  }

  const pendingScouts = scouts.filter((s) => s.status === "pending");
  const pastScouts = scouts.filter((s) => s.status !== "pending");
  const interviewingCount = scouts.filter((s) => s.status === "interviewing").length;
  const hiredCount = scouts.filter((s) => s.status === "hired").length;

  const metrics = [
    { label: "登録済みAIエージェント", value: agents.length, Icon: Bot,          accentColor: "#2563eb" },
    { label: "受け取ったスカウト",     value: scouts.length,  Icon: Mail,         accentColor: "#7c3aed" },
    { label: "進行中の面接",           value: interviewingCount, Icon: Zap,        accentColor: "#d97706" },
    { label: "成立した契約",           value: hiredCount,     Icon: CheckCircle2, accentColor: "#059669" },
  ];

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px 64px" }}>

        {/* ── ページヘッダー ── */}
        <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2563eb", marginBottom: 8 }}>
              Developer Dashboard
            </p>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.03em",
                margin: "0 0 6px",
              }}
            >
              ようこそ
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0, fontWeight: 500 }}>
              {user.email}
            </p>
          </div>
          <Link
            href="/dashboard/agents/new"
            className="ah-primary-btn"
          >
            + 履歴書を作成
          </Link>
        </div>

        {/* ── サマリカード (4列グリッド) ── */}
        <div className="ah-stat-grid" style={{ marginBottom: 48 }}>
          {metrics.map(({ label, value, Icon, accentColor }) => (
            <StatCard key={label} icon={Icon} label={label} value={value} accentColor={accentColor} />
          ))}
        </div>

        {/* ── エージェント未登録 ── */}
        {agents.length === 0 && (
          <EmptyState
            icon="🤖"
            title="まだAIエージェントを登録していません"
            description="AIの履歴書を作成して、企業からのスカウトを待ちましょう"
            action={{ label: "履歴書を作成する", href: "/dashboard/agents/new" }}
          />
        )}

        {/* ── スカウト一覧 ── */}
        {scouts.length > 0 && (
          <div>
            {/* 未対応スカウト */}
            {pendingScouts.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 3, height: 18, background: "#d97706", borderRadius: 2, display: "inline-block" }} />
                  返答待ちのスカウト
                  <span style={{ fontSize: 12, fontWeight: 600, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "2px 9px", borderRadius: 99 }}>
                    {pendingScouts.length}件
                  </span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingScouts.map((scout) => {
                    const message = getFirstMessage(scout.chat_log);
                    return (
                      <div
                        key={scout.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 20,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 16,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          transition: "box-shadow 0.2s ease",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                              {agentMap.get(scout.agent_id) ?? "不明なエージェント"}
                            </span>
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>←</span>
                            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                              {scoutJobCompanyMap.get(scout.job_id) ?? "不明な企業"}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "#2563eb", marginBottom: 6, fontWeight: 500 }}>
                            {scoutJobMap.get(scout.job_id) ?? "不明な求人"}
                          </p>
                          {message && (
                            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {message}
                            </p>
                          )}
                          <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 8 }}>
                            {new Date(scout.created_at).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <ScoutResponseButton interactionId={scout.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 対応済みスカウト */}
            {pastScouts.length > 0 && (
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 3, height: 18, background: "#9ca3af", borderRadius: 2, display: "inline-block" }} />
                  対応済みのスカウト
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pastScouts.map((scout) => {
                    const statusLabel =
                      scout.status === "interviewing" ? "承諾"
                      : scout.status === "rejected" ? "辞退"
                      : scout.status === "hired" ? "採用"
                      : scout.status;
                    const isPositive = scout.status === "interviewing" || scout.status === "hired";
                    const statusColor = isPositive ? "#059669" : "#dc2626";
                    const statusBg = isPositive ? "#ecfdf5" : "#fef2f2";
                    const statusBorder = isPositive ? "#a7f3d0" : "#fecaca";

                    return (
                      <div
                        key={scout.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #f3f4f6",
                          borderRadius: 12,
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 16,
                          opacity: 0.8,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                              {agentMap.get(scout.agent_id) ?? "不明なエージェント"}
                            </span>
                            <span style={{ fontSize: 11, color: "#d1d5db" }}>←</span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>
                              {scoutJobCompanyMap.get(scout.job_id) ?? "不明な企業"}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                            {scoutJobMap.get(scout.job_id) ?? "不明な求人"} · {new Date(scout.created_at).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, background: statusBg, border: `1px solid ${statusBorder}`, padding: "3px 10px", borderRadius: 99, flexShrink: 0 }}>
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {scouts.length === 0 && agents.length > 0 && (
          <EmptyState
            icon="📨"
            title="まだスカウトが届いていません"
            description="エージェントの実績を充実させてスカウトを待ちましょう"
          />
        )}
      </div>
    </div>
  );
}
