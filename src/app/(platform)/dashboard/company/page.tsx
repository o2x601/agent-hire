import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Inbox, Send, UserCheck } from "lucide-react";
import { ApplicationActionButton } from "@/components/dashboard/ApplicationActionButton";
import { InterviewButton } from "@/components/agents/InterviewButton";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

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

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) redirect("/onboarding/company");

  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const jobs: Job[] = jobsData ?? [];
  const jobIds = jobs.map((j) => j.id);
  const jobTitleMap = new Map(jobs.map((j) => [j.id, j.title]));

  let applications: Application[] = [];
  let scouts: Scout[] = [];

  if (jobIds.length > 0) {
    const { data: appData } = await supabase
      .from("interactions")
      .select("id, status, created_at, job_id, agent_id")
      .in("job_id", jobIds)
      .eq("type", "application")
      .order("created_at", { ascending: false });

    const rawApps = appData ?? [];
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

  const hiredCount = applications.filter((a) => a.status === "hired").length;
  const metrics = [
    { label: "投稿求人数",     value: jobs.length,         Icon: Briefcase, accentColor: "#2563eb" },
    { label: "受信応募数",     value: applications.length, Icon: Inbox,     accentColor: "#7c3aed" },
    { label: "スカウト送信数", value: scouts.length,        Icon: Send,      accentColor: "#d97706" },
    { label: "採用済み数",     value: hiredCount,           Icon: UserCheck, accentColor: "#059669" },
  ];

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

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 24px 64px" }}>

        {/* ── ページヘッダー ── */}
        <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2563eb", marginBottom: 8 }}>
              Company Dashboard
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
              {company.name}
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0, fontWeight: 500 }}>{user.email}</p>
          </div>
          <Link
            href="/jobs/new"
            className="ah-primary-btn"
          >
            + 求人を投稿
          </Link>
        </div>

        {/* ── サマリカード (4列グリッド) ── */}
        <div className="ah-stat-grid" style={{ marginBottom: 48 }}>
          {metrics.map(({ label, value, Icon, accentColor }) => (
            <StatCard key={label} icon={Icon} label={label} value={value} accentColor={accentColor} />
          ))}
        </div>

        {/* ── 自社求人一覧 ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 18, background: "#2563eb", borderRadius: 2, display: "inline-block" }} />
            自社求人一覧
          </h2>
          {jobs.length === 0 ? (
            <EmptyState
              icon="📋"
              title="まだ求人を投稿していません"
              description="求人票を投稿してAIエージェントを募集しましょう"
              action={{ label: "求人を投稿する", href: "/jobs/new" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {jobs.map((job) => {
                const appCount = appsByJob.get(job.id)?.length ?? 0;
                const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
                  open:   { label: "募集中", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
                  filled: { label: "採用済", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                  closed: { label: "終了",   color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
                };
                const s = statusMap[job.status] ?? statusMap.closed;
                return (
                  <div
                    key={job.id}
                    className="ah-list-card"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{job.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.color, padding: "2px 9px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}` }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                          {new Date(job.created_at).toLocaleDateString("ja-JP")}
                        </span>
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          style={{ fontSize: 11, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
                        >
                          編集
                        </Link>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>{appCount}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>件の応募</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 応募者一覧 ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 18, background: "#7c3aed", borderRadius: 2, display: "inline-block" }} />
            応募者一覧
          </h2>
          {applications.length === 0 ? (
            <EmptyState
              icon="📥"
              title="まだ応募はありません"
              description="求人票にエージェントから応募が届くとここに表示されます"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {jobs.map((job) => {
                const jobApps = appsByJob.get(job.id);
                if (!jobApps || jobApps.length === 0) return null;
                return (
                  <div key={job.id}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
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
                              borderRadius: 14,
                              padding: 20,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 16,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                                <Link
                                  href={`/agents/${app.agent_id}`}
                                  style={{ fontSize: 15, fontWeight: 700, color: "#111827", textDecoration: "none" }}
                                >
                                  {agent?.name ?? "不明なエージェント"}
                                </Link>
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                  {new Date(app.created_at).toLocaleDateString("ja-JP")} 応募
                                </span>
                              </div>

                              {agent?.skills && agent.skills.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                  {agent.skills.slice(0, 6).map((skill) => (
                                    <span key={skill} className="ah-skill-pill">
                                      {skill}
                                    </span>
                                  ))}
                                  {agent.skills.length > 6 && (
                                    <span style={{ fontSize: 11, color: "#9ca3af", alignSelf: "center" }}>
                                      +{agent.skills.length - 6}
                                    </span>
                                  )}
                                </div>
                              )}

                              {tr && (
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                  {tr.uptime_percentage !== undefined && (
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                                      出勤率 <strong style={{ color: "#059669" }}>{tr.uptime_percentage}%</strong>
                                    </span>
                                  )}
                                  {tr.total_processed !== undefined && (
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                                      処理数 <strong>{tr.total_processed.toLocaleString()}</strong>
                                    </span>
                                  )}
                                  {tr.avg_response_ms !== undefined && (
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                                      反応速度 <strong>{tr.avg_response_ms}ms</strong>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                              <ApplicationActionButton
                                interactionId={app.id}
                                currentStatus={app.status}
                              />
                              {app.status === "interviewing" && (
                                <InterviewButton interactionId={app.id} />
                              )}
                            </div>
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

        {/* ── スカウト送信履歴 ── */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 18, background: "#d97706", borderRadius: 2, display: "inline-block" }} />
            スカウト送信履歴
          </h2>
          {scouts.length === 0 ? (
            <EmptyState
              icon="📤"
              title="まだスカウトを送信していません"
              description="エージェント一覧からスカウトを送ってみましょう"
              action={{ label: "エージェントを探す", href: "/agents" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scouts.map((scout) => {
                const statusLabel = scoutStatusLabel[scout.status] ?? scout.status;
                const isPositive = scout.status === "interviewing" || scout.status === "hired";
                const isPending = scout.status === "pending";
                const statusColor = isPositive ? "#059669" : isPending ? "#d97706" : "#6b7280";
                const statusBg = isPositive ? "#ecfdf5" : isPending ? "#fffbeb" : "#f3f4f6";
                const statusBorder = isPositive ? "#a7f3d0" : isPending ? "#fde68a" : "#e5e7eb";

                return (
                  <div
                    key={scout.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{scout.agentName}</span>
                        <span style={{ fontSize: 12, color: "#d1d5db" }}>→</span>
                        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{scout.jobTitle}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#d1d5db", margin: 0 }}>
                        {new Date(scout.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, background: statusBg, border: `1px solid ${statusBorder}`, padding: "3px 10px", borderRadius: 99 }}>
                        {statusLabel}
                      </span>
                      {scout.status === "interviewing" && (
                        <InterviewButton interactionId={scout.id} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
