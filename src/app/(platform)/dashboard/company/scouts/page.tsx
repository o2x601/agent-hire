import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Scout = {
  id: string;
  status: string;
  created_at: string;
  agent_id: string;
  job_id: string;
  agentName: string;
  jobTitle: string;
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:      { label: "返答待ち", bg: "#f3f4f6", color: "#6b7280" },
  interviewing: { label: "承諾",     bg: "#f0fdf4", color: "#16a34a" },
  hired:        { label: "採用済み", bg: "#f0fdf4", color: "#16a34a" },
  rejected:     { label: "辞退",     bg: "#fef2f2", color: "#dc2626" },
};

export default async function CompanyScoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.user_metadata?.role !== "company") redirect("/dashboard");

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) redirect("/onboarding/company");

  // 自社求人のIDを取得
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("company_id", company.id);

  const jobs = jobsData ?? [];
  const jobIds = jobs.map((j) => j.id);
  const jobTitleMap = new Map(jobs.map((j) => [j.id, j.title]));

  let scouts: Scout[] = [];

  if (jobIds.length > 0) {
    const { data: scoutData } = await supabase
      .from("interactions")
      .select("id, status, created_at, agent_id, job_id")
      .in("job_id", jobIds)
      .eq("type", "scout")
      .order("created_at", { ascending: false });

    const rawScouts = scoutData ?? [];
    const agentIds = Array.from(new Set(rawScouts.map((s) => s.agent_id)));

    const agentNameMap = new Map<string, string>();
    if (agentIds.length > 0) {
      const { data: agentsData } = await supabase
        .from("ai_agents")
        .select("id, name")
        .in("id", agentIds);
      for (const a of agentsData ?? []) {
        agentNameMap.set(a.id, a.name);
      }
    }

    scouts = rawScouts.map((s) => ({
      ...s,
      agentName: agentNameMap.get(s.agent_id) ?? "不明なエージェント",
      jobTitle: jobTitleMap.get(s.job_id) ?? "不明な求人",
    }));
  }

  const pendingScouts     = scouts.filter((s) => s.status === "pending");
  const acceptedScouts    = scouts.filter((s) => s.status === "interviewing" || s.status === "hired");
  const rejectedScouts    = scouts.filter((s) => s.status === "rejected");

  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 860,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Link
          href="/dashboard/company"
          style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}
        >
          ← ダッシュボードに戻る
        </Link>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 6 }}>
          Company
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          スカウト管理
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280" }}>
          自社が送信したスカウトの一覧と返答状況です
        </p>
      </div>

      {/* サマリ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {[
          { label: "返答待ち", count: pendingScouts.length,  bg: "#f3f4f6", color: "#6b7280" },
          { label: "承諾",     count: acceptedScouts.length, bg: "#f0fdf4", color: "#16a34a" },
          { label: "辞退",     count: rejectedScouts.length, bg: "#fef2f2", color: "#dc2626" },
        ].map(({ label, count, bg, color }) => (
          <div
            key={label}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "16px 20px",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              {count}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: bg,
                  color,
                }}
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* スカウト一覧 */}
      {scouts.length === 0 ? (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "48px 32px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 12 }}>📤</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
            まだスカウトを送信していません
          </p>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
            エージェント一覧からスカウトを送りましょう
          </p>
          <Link
            href="/agents"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              background: "#111827",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            エージェントを探す →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scouts.map((scout) => {
            const badge = STATUS_MAP[scout.status] ?? { label: scout.status, bg: "#f3f4f6", color: "#6b7280" };
            return (
              <div
                key={scout.id}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {scout.agentName}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                      {scout.jobTitle}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                    {new Date(scout.created_at).toLocaleDateString("ja-JP")} 送信
                  </p>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
