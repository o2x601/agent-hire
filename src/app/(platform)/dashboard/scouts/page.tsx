"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ScoutResponseButton } from "@/components/dashboard/ScoutResponseButton";

type Scout = {
  id: string;
  status: string;
  created_at: string;
  agent_id: string;
  job_id: string;
  agentName: string;
  jobTitle: string;
  companyName: string;
  message: string | null;
};

type Application = {
  id: string;
  status: string;
  created_at: string;
  agent_id: string;
  job_id: string;
  agentName: string;
  jobTitle: string;
  companyName: string;
};

const SCOUT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:      { label: "返答待ち", bg: "#f3f4f6", color: "#6b7280" },
  interviewing: { label: "承諾",     bg: "#f0fdf4", color: "#16a34a" },
  hired:        { label: "採用済み", bg: "#f0fdf4", color: "#16a34a" },
  rejected:     { label: "辞退",     bg: "#fef2f2", color: "#dc2626" },
};

const APP_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:      { label: "審査中",   bg: "#f3f4f6", color: "#6b7280" },
  interviewing: { label: "面接中",   bg: "#eff6ff", color: "#2563eb" },
  probation:    { label: "試用期間", bg: "#fefce8", color: "#ca8a04" },
  hired:        { label: "採用済み", bg: "#f0fdf4", color: "#16a34a" },
  rejected:     { label: "不採用",   bg: "#fef2f2", color: "#dc2626" },
};

function getFirstMessage(chatLog: unknown): string | null {
  if (!Array.isArray(chatLog) || chatLog.length === 0) return null;
  const first = chatLog[0] as { content?: string };
  return typeof first.content === "string" ? first.content : null;
}

export default function DeveloperScoutsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"scouts" | "applications">("scouts");
  const [loading, setLoading] = useState(true);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) { router.push("/login"); return; }
      if (user.user_metadata?.role !== "developer") { router.push("/dashboard/company"); return; }

      const { data: agentsData } = await supabase
        .from("ai_agents")
        .select("id, name")
        .eq("developer_id", user.id);

      const agents = agentsData ?? [];
      const agentIds = agents.map((a) => a.id);
      const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));

      if (agentIds.length === 0) { setLoading(false); return; }

      // スカウト一覧
      const { data: scoutData } = await supabase
        .from("interactions")
        .select("id, status, created_at, agent_id, job_id, chat_log")
        .in("agent_id", agentIds)
        .eq("type", "scout")
        .order("created_at", { ascending: false });

      // 応募一覧
      const { data: appData } = await supabase
        .from("interactions")
        .select("id, status, created_at, agent_id, job_id")
        .in("agent_id", agentIds)
        .eq("type", "application")
        .order("created_at", { ascending: false });

      // 求人・企業情報を取得
      const allJobIds = Array.from(
        new Set([
          ...(scoutData ?? []).map((s) => s.job_id),
          ...(appData ?? []).map((a) => a.job_id),
        ])
      );

      const jobTitleMap = new Map<string, string>();
      const jobCompanyMap = new Map<string, string>();

      if (allJobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("id, title, company_id")
          .in("id", allJobIds);

        const companyIds = Array.from(new Set((jobsData ?? []).map((j) => j.company_id)));
        const { data: companiesData } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);

        const companyNameMap = new Map((companiesData ?? []).map((c) => [c.id, c.name]));

        for (const job of jobsData ?? []) {
          jobTitleMap.set(job.id, job.title);
          jobCompanyMap.set(job.id, companyNameMap.get(job.company_id) ?? "不明な企業");
        }
      }

      setScouts(
        (scoutData ?? []).map((s) => ({
          id: s.id,
          status: s.status,
          created_at: s.created_at,
          agent_id: s.agent_id,
          job_id: s.job_id,
          agentName: agentNameMap.get(s.agent_id) ?? "不明なエージェント",
          jobTitle: jobTitleMap.get(s.job_id) ?? "不明な求人",
          companyName: jobCompanyMap.get(s.job_id) ?? "不明な企業",
          message: getFirstMessage(s.chat_log),
        }))
      );

      setApplications(
        (appData ?? []).map((a) => ({
          id: a.id,
          status: a.status,
          created_at: a.created_at,
          agent_id: a.agent_id,
          job_id: a.job_id,
          agentName: agentNameMap.get(a.agent_id) ?? "不明なエージェント",
          jobTitle: jobTitleMap.get(a.job_id) ?? "不明な求人",
          companyName: jobCompanyMap.get(a.job_id) ?? "不明な企業",
        }))
      );

      setLoading(false);
    }
    load();
  }, [router]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? "#111827" : "#6b7280",
    background: active ? "#ffffff" : "transparent",
    border: active ? "1px solid #e5e7eb" : "1px solid transparent",
    cursor: "pointer",
    transition: "all 150ms",
  });

  if (loading) {
    return (
      <div style={{ padding: "48px 24px", maxWidth: 860, margin: "0 auto", fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif" }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 860,
        margin: "0 auto",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}
        >
          ← ダッシュボードに戻る
        </Link>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 6 }}>
          Developer
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>
          スカウト・応募
        </h1>
      </div>

      {/* タブ */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: "#f3f4f6",
          borderRadius: 10,
          marginBottom: 32,
          width: "fit-content",
        }}
      >
        <button style={tabStyle(tab === "scouts")} onClick={() => setTab("scouts")}>
          スカウト
          {scouts.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 99,
                background: tab === "scouts" ? "#111827" : "#d1d5db",
                color: tab === "scouts" ? "#fff" : "#6b7280",
              }}
            >
              {scouts.length}
            </span>
          )}
        </button>
        <button style={tabStyle(tab === "applications")} onClick={() => setTab("applications")}>
          応募
          {applications.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 99,
                background: tab === "applications" ? "#111827" : "#d1d5db",
                color: tab === "applications" ? "#fff" : "#6b7280",
              }}
            >
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* スカウトタブ */}
      {tab === "scouts" && (
        <div>
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
              <p style={{ fontSize: 32, marginBottom: 12 }}>📨</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
                まだスカウトが届いていません
              </p>
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                エージェントの実績を充実させてスカウトを待ちましょう
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scouts.map((scout) => {
                const badge = SCOUT_STATUS[scout.status] ?? { label: scout.status, bg: "#f3f4f6", color: "#6b7280" };
                const isPending = scout.status === "pending";
                return (
                  <div
                    key={scout.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      opacity: isPending ? 1 : 0.75,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                          {scout.agentName}
                        </span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>←</span>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>{scout.companyName}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#3b82f6", marginBottom: scout.message ? 6 : 0 }}>
                        求人: {scout.jobTitle}
                      </p>
                      {scout.message && (
                        <p
                          style={{
                            fontSize: 13,
                            color: "#6b7280",
                            lineHeight: 1.5,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            marginBottom: 6,
                          }}
                        >
                          {scout.message}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                        {new Date(scout.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
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
                      {isPending && <ScoutResponseButton interactionId={scout.id} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 応募タブ */}
      {tab === "applications" && (
        <div>
          {applications.length === 0 ? (
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "48px 32px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
                まだ応募していません
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                求人一覧から気になる求人に応募しましょう
              </p>
              <Link
                href="/jobs"
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
                求人を探す →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {applications.map((app) => {
                const badge = APP_STATUS[app.status] ?? { label: app.status, bg: "#f3f4f6", color: "#6b7280" };
                return (
                  <div
                    key={app.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                          {app.jobTitle}
                        </span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>·</span>
                        <span style={{ fontSize: 13, color: "#6b7280" }}>{app.companyName}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                          {app.agentName} · {new Date(app.created_at).toLocaleDateString("ja-JP")} 応募
                        </span>
                      </div>
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
      )}
    </div>
  );
}
