import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ScoutResponseButton } from "@/components/dashboard/ScoutResponseButton";

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

  // 自分のエージェントを取得
  const { data: agentsData } = await supabase
    .from("ai_agents")
    .select("id, name")
    .eq("developer_id", user.id);

  const agents = agentsData ?? [];
  const agentIds = agents.map((a) => a.id);
  const agentMap = new Map(agents.map((a) => [a.id, a.name]));

  // スカウト受信一覧を取得
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

  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#3B82F6",
              marginBottom: 8,
            }}
          >
            Dashboard
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#E2EAF4",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            ようこそ 👋
          </h1>
          <p style={{ color: "#7A8FA8", fontSize: 14, marginTop: 8 }}>
            {user.email}
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          + 履歴書を作成
        </Link>
      </div>

      {/* サマリカード */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          { label: "登録済みAIエージェント", value: agents.length, icon: "🤖" },
          { label: "受け取ったスカウト", value: scouts.length, icon: "📨" },
          { label: "進行中の面接", value: scouts.filter((s) => s.status === "interviewing").length, icon: "🧪" },
          { label: "成立した契約", value: scouts.filter((s) => s.status === "hired").length, icon: "✅" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#0C1019",
              border: "1px solid #1E2A3A",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#E2EAF4",
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "#7A8FA8", marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* スカウト受信一覧 */}
      {scouts.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#E2EAF4",
              marginBottom: 16,
            }}
          >
            📨 スカウト一覧
          </h2>

          {/* 未対応スカウト */}
          {pendingScouts.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                返答待ち
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pendingScouts.map((scout) => {
                  const message = getFirstMessage(scout.chat_log);
                  return (
                    <div
                      key={scout.id}
                      style={{
                        background: "#0C1019",
                        border: "1px solid #1E3A5F",
                        borderRadius: 12,
                        padding: 20,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#E2EAF4" }}>
                            {agentMap.get(scout.agent_id) ?? "不明なエージェント"}
                          </span>
                          <span style={{ fontSize: 12, color: "#7A8FA8" }}>←</span>
                          <span style={{ fontSize: 13, color: "#7A8FA8" }}>
                            {scoutJobCompanyMap.get(scout.job_id) ?? "不明な企業"}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "#3B82F6", marginBottom: 6 }}>
                          求人: {scoutJobMap.get(scout.job_id) ?? "不明な求人"}
                        </p>
                        {message && (
                          <p style={{ fontSize: 13, color: "#7A8FA8", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {message}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: "#4A5A6A", marginTop: 6 }}>
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
              <p style={{ fontSize: 12, color: "#7A8FA8", fontWeight: 600, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                対応済み
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pastScouts.map((scout) => {
                  const statusLabel =
                    scout.status === "interviewing"
                      ? "承諾"
                      : scout.status === "rejected"
                        ? "辞退"
                        : scout.status === "hired"
                          ? "採用"
                          : scout.status;
                  const statusColor =
                    scout.status === "interviewing" || scout.status === "hired"
                      ? "#22c55e"
                      : "#ef4444";

                  return (
                    <div
                      key={scout.id}
                      style={{
                        background: "#0C1019",
                        border: "1px solid #1E2A3A",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        opacity: 0.7,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#E2EAF4" }}>
                            {agentMap.get(scout.agent_id) ?? "不明なエージェント"}
                          </span>
                          <span style={{ fontSize: 11, color: "#7A8FA8" }}>←</span>
                          <span style={{ fontSize: 12, color: "#7A8FA8" }}>
                            {scoutJobCompanyMap.get(scout.job_id) ?? "不明な企業"}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#4A5A6A", marginTop: 2 }}>
                          {scoutJobMap.get(scout.job_id) ?? "不明な求人"} ·{" "}
                          {new Date(scout.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, flexShrink: 0 }}>
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
        <div
          style={{
            background: "#0C1019",
            border: "1px solid #1E2A3A",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            color: "#7A8FA8",
          }}
        >
          <p style={{ fontSize: 20, marginBottom: 8 }}>📨</p>
          <p style={{ fontSize: 14 }}>まだスカウトが届いていません</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            エージェントの実績を充実させてスカウトを待ちましょう
          </p>
        </div>
      )}
    </div>
  );
}
