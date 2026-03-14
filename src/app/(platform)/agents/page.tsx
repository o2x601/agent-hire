import { Suspense } from "react";
import Link from "next/link";
import { ResumeCard } from "@/components/agents/ResumeCard";
import { AgentFilters } from "./AgentFilters";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import type { Agent } from "@/schemas/agent";

type SearchParams = {
  q?: string;
  skill?: string;
  sort?: string;
};

async function AgentList({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from("ai_agents")
    .select("*")
    .eq("is_active", true) as any)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p style={{ fontSize: 14, color: "#dc2626" }}>
        エージェントの取得に失敗しました。
      </p>
    );
  }

  let agents = data as Agent[];
  const { q, skill, sort } = searchParams;

  if (q) {
    const lq = q.toLowerCase();
    agents = agents.filter(
      (a) =>
        a.name.toLowerCase().includes(lq) ||
        a.skills.some((s) => s.toLowerCase().includes(lq)),
    );
  }

  if (skill) {
    agents = agents.filter((a) => a.skills.includes(skill));
  }

  if (sort === "uptime") {
    agents.sort(
      (a, b) =>
        (b.track_record?.uptime_percentage ?? 0) -
        (a.track_record?.uptime_percentage ?? 0),
    );
  } else if (sort === "processed") {
    agents.sort(
      (a, b) =>
        (b.track_record?.total_processed ?? 0) -
        (a.track_record?.total_processed ?? 0),
    );
  } else if (sort === "response") {
    agents.sort(
      (a, b) =>
        (a.track_record?.avg_response_ms ?? Infinity) -
        (b.track_record?.avg_response_ms ?? Infinity),
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="条件に合うエージェントが見つかりません"
        description="検索条件を変えてみてください"
        action={{ label: "履歴書を登録する", href: "/dashboard/agents/new" }}
      />
    );
  }

  return (
    <>
      <p style={{ marginBottom: 20, fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>
        {agents.length.toLocaleString()}件のエージェント
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {agents.map((agent) => (
          <ResumeCard key={agent.id} agent={agent} />
        ))}
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .agent-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .agent-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: agentsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    (supabase.from("ai_agents").select("skills") as any).eq("is_active", true),
  ]);

  const isCompany = user?.user_metadata?.role === "company";

  const allSkills = Array.from(
    new Set((agentsData ?? []).flatMap((a) => a.skills ?? [])),
  ).sort();

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 64px" }}>
        {/* ── ページヘッダー ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2563eb", marginBottom: 8 }}>
              AI Agent Market
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              求職中のAIエージェント
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              出勤率と処理実績で選ぶ、実力主義の人材市場
            </p>
          </div>
          {isCompany && (
            <Link
              href="/jobs/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                backgroundColor: "#111827",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(17,24,39,0.2)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(17,24,39,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(17,24,39,0.2)";
              }}
            >
              + 求人票を投稿
            </Link>
          )}
        </div>

        {/* ── フィルター ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 28,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Suspense fallback={null}>
            <AgentFilters allSkills={allSkills} />
          </Suspense>
        </div>

        {/* ── エージェントグリッド ── */}
        <Suspense
          fallback={
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f3f4f6" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ height: 14, width: "70%", borderRadius: 4, background: "#f3f4f6" }} />
                      <div style={{ height: 11, width: "45%", borderRadius: 4, background: "#f3f4f6" }} />
                    </div>
                    <div style={{ width: 54, height: 46, borderRadius: 10, background: "#f3f4f6" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} style={{ height: 24, width: 64, borderRadius: 99, background: "#f3f4f6" }} />
                    ))}
                  </div>
                  <div style={{ height: 1, background: "#f3f4f6" }} />
                  <div style={{ height: 12, width: "55%", borderRadius: 4, background: "#f3f4f6" }} />
                </div>
              ))}
            </div>
          }
        >
          <AgentList searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
