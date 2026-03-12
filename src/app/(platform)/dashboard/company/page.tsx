import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Inbox, Send, UserCheck } from "lucide-react";
import { ApplicationActionButton } from "@/components/dashboard/ApplicationActionButton";

type TrackRecord = {
  uptime_percentage?: number;
  total_processed?: number;
  avg_response_ms?: number;
  error_rate?: number;
};

type AgentInfo = {
  id: string;
  name: string;
  skills: string[];
  track_record: TrackRecord | null;
};

type Application = {
  id: string;
  status: string;
  created_at: string;
  job_id: string;
  agent_id: string;
  agent: AgentInfo | null;
};

type Scout = {
  id: string;
  status: string;
  created_at: string;
  job_id: string;
  agent_id: string;
  agentName: string;
  jobTitle: string;
};

type Job = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "company") redirect("/dashboard");

  // 企業プロフィール取得
  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) redirect("/onboarding/company");

  // 自社の求人を取得
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const jobs: Job[] = jobsData ?? [];
  const jobIds = jobs.map((j) => j.id);
  const jobTitleMap = new Map(jobs.map((j) => [j.id, j.title]));

  // 各求人への応募を取得（エージェント情報含む）
  let applications: Application[] = [];
  let scouts: Scout[] = [];

  if (jobIds.length > 0) {
    // 応募一覧
    const { data: appData } = await supabase
      .from("interactions")
      .select("id, status, created_at, job_id, agent_id")
      .in("job_id", jobIds)
      .eq("type", "application")
      .order("created_at", { ascending: false });

    const rawApps = appData ?? [];

    // エージェント情報を別途取得
    const agentIds = Array.from(new Set(rawApps.map((a) => a.agent_id)));
    let agentMap = new Map<string, AgentInfo>();

    if (agentIds.length > 0) {
      const { data: agentsData } = await supabase
        .from("ai_agents")
        .select("id, name, skills, track_record")
        .in("id", agentIds);

      for (const agent of agentsData ?? []) {
        agentMap.set(agent.id, {
          id: agent.id,
          name: agent.name,
          skills: agent.skills ?? [],
          track_record: agent.track_record as TrackRecord | null,
        });
      }
    }

    applications = rawApps.map((a) => ({
      ...a,
      agent: agentMap.get(a.agent_id) ?? null,
    }));

    // スカウト送信履歴
    const { data: scoutData } = await supabase
      .from("interactions")
      .select("id, status, created_at, job_id, agent_id")
      .in("job_id", jobIds)
      .eq("type", "scout")
      .order("created_at", { ascending: false });

    const rawScouts = scoutData ?? [];
    const scoutAgentIds = Array.from(new Set(rawScouts.map((s) => s.agent_id)));

    let scoutAgentNameMap = new Map<string, string>();
    if (scoutAgentIds.length > 0) {
      const { data: scoutAgents } = await supabase
        .from("ai_agents")
        .select("id, name")
        .in("id", scoutAgentIds);
      for (const a of scoutAgents ?? []) {
        scoutAgentNameMap.set(a.id, a.name);
      }
    }

    scouts = rawScouts.map((s) => ({
      ...s,
      agentName: scoutAgentNameMap.get(s.agent_id) ?? "不明なエージェント",
      jobTitle: jobTitleMap.get(s.job_id) ?? "不明な求人",
    }));
  }

  // サマリ計算
  const hiredCount = applications.filter((a) => a.status === "hired").length;
  const metrics = [
    { label: "投稿求人数",     value: jobs.length,         Icon: Briefcase, accentColor: "#3b82f6" },
    { label: "受信応募数",     value: applications.length, Icon: Inbox,     accentColor: "#8b5cf6" },
    { label: "スカウト送信数", value: scouts.length,        Icon: Send,      accentColor: "#f59e0b" },
    { label: "採用済み数",     value: hiredCount,           Icon: UserCheck, accentColor: "#10b981" },
  ];

  // 応募を求人ごとにグルーピング
  const appsByJob = new Map<string, Application[]>();
  for (const app of applications) {
    const existing = appsByJob.get(app.job_id) ?? [];
    existing.push(app);
    appsByJob.set(app.job_id, existing);
  }

  const scoutStatusLabel: Record<string, string> = {
    pending: "返答待ち",
    interviewing: "承諾",
    rejected: "辞退",
    hired: "採用済み",
  };
  const scoutStatusColor: Record<string, string> = {
    pending: "#6b7280",
    interviewing: "#6b7280",
    rejected: "#6b7280",
    hired: "#6b7280",
  };

  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 1040,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
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
            Company Dashboard
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {company.name}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>{user.email}</p>
        </div>
        <Link
          href="/jobs/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            background: "#111827",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          + 求人を投稿
        </Link>
      </div>

      {/* サマリカード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 48 }}>
        {metrics.map(({ label, value, Icon }) => {
          return (
            <div
              key={label}
              style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: "#9ca3af" }} />
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", backgroundColor: "#f3f4f6", padding: "2px 8px", borderRadius: 99 }}>前週比 —</span>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 自社求人一覧 */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
          📋 自社求人一覧
        </h2>
        {jobs.length === 0 ? (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <p style={{ fontSize: 14 }}>まだ求人を投稿していません</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.map((job) => {
              const appCount = appsByJob.get(job.id)?.length ?? 0;
              const jobStatusColor = job.status === "open" ? "#16a34a" : job.status === "filled" ? "#2563eb" : "#6b7280";
              const jobStatusBg = job.status === "open" ? "#f0fdf4" : job.status === "filled" ? "#eff6ff" : "#f3f4f6";
              return (
                <div
                  key={job.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {job.title}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: jobStatusColor,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: jobStatusBg,
                        }}
                      >
                        {job.status === "open" ? "募集中" : job.status === "filled" ? "採用済" : "終了"}
                      </span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {new Date(job.created_at).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      {appCount} 件の応募
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 応募者一覧 */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
          📥 応募者一覧
        </h2>
        {applications.length === 0 ? (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <p style={{ fontSize: 14 }}>まだ応募はありません</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {jobs.map((job) => {
              const jobApps = appsByJob.get(job.id);
              if (!jobApps || jobApps.length === 0) return null;
              return (
                <div key={job.id}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--primary)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {job.title}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {jobApps.map((app) => {
                      const agent = app.agent;
                      const tr = agent?.track_record;
                      return (
                        <div
                          key={app.id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            padding: 20,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 16,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                                {agent?.name ?? "不明なエージェント"}
                              </span>
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                {new Date(app.created_at).toLocaleDateString("ja-JP")} 応募
                              </span>
                            </div>

                            {/* スキルバッジ */}
                            {agent?.skills && agent.skills.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                {agent.skills.slice(0, 6).map((skill) => (
                                  <span
                                    key={skill}
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 500,
                                      color: "#4b5563",
                                      padding: "3px 8px",
                                      borderRadius: 99,
                                      background: "#f3f4f6",
                                    }}
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {agent.skills.length > 6 && (
                                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                    +{agent.skills.length - 6}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 実績 */}
                            {tr && (
                              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {tr.uptime_percentage !== undefined && (
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    稼働率 {tr.uptime_percentage}%
                                  </span>
                                )}
                                {tr.total_processed !== undefined && (
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    処理数 {tr.total_processed.toLocaleString()}
                                  </span>
                                )}
                                {tr.avg_response_ms !== undefined && (
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    応答 {tr.avg_response_ms}ms
                                  </span>
                                )}
                                {tr.error_rate !== undefined && (
                                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    エラー率 {tr.error_rate}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <ApplicationActionButton
                            interactionId={app.id}
                            currentStatus={app.status}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* スカウト送信履歴 */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
          📤 スカウト送信履歴
        </h2>
        {scouts.length === 0 ? (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <p style={{ fontSize: 14 }}>まだスカウトを送信していません</p>
            <Link
              href="/agents"
              style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", marginTop: 8, display: "inline-block" }}
            >
              エージェントを探す →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scouts.map((scout) => {
              const color = scoutStatusColor[scout.status] ?? "#6b7280";
              return (
                <div
                  key={scout.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                        {scout.agentName}
                      </span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{scout.jobTitle}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                      {new Date(scout.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {scoutStatusLabel[scout.status] ?? scout.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
