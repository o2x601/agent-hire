import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { RequiredSpecsSchema } from "@/schemas/job";
import { EmptyState } from "@/components/ui/empty-state";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type AgentOption = { id: string; name: string };

type SearchParams = {
  q?: string;
  skill?: string;
  sort?: string;
};

function getBudgetMin(budgetRange: unknown): number {
  if (!budgetRange || typeof budgetRange !== "object") return 0;
  const b = budgetRange as Record<string, unknown>;
  return typeof b.min === "number" ? b.min : 0;
}

function getBudgetMax(budgetRange: unknown): number {
  if (!budgetRange || typeof budgetRange !== "object") return 0;
  const b = budgetRange as Record<string, unknown>;
  return typeof b.max === "number" ? b.max : 0;
}

async function JobList({
  searchParams,
  userCompanyId,
  isDeveloper,
  userAgents,
  appliedJobIds,
}: {
  searchParams: SearchParams;
  userCompanyId: string | null;
  isDeveloper: boolean;
  userAgents: AgentOption[];
  appliedJobIds: Set<string>;
}) {
  const supabase = await createClient();

  const [{ data: jobs, error }, { data: companiesData }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id, name"),
  ]);

  if (error) {
    return (
      <p style={{ fontSize: 14, color: "#dc2626" }}>求人の取得に失敗しました。</p>
    );
  }

  const companyMap = new Map(
    (companiesData ?? []).map((c) => [c.id, c.name]),
  );

  let filtered = (jobs ?? []) as JobRow[];
  const { q, skill, sort } = searchParams;

  if (q) {
    const lq = q.toLowerCase();
    filtered = filtered.filter((job) => {
      const specs = RequiredSpecsSchema.safeParse(job.required_specs);
      const skills = specs.success ? (specs.data.skills ?? []) : [];
      return (
        job.title.toLowerCase().includes(lq) ||
        job.problem_statement.toLowerCase().includes(lq) ||
        skills.some((s) => s.toLowerCase().includes(lq))
      );
    });
  }

  if (skill) {
    filtered = filtered.filter((job) => {
      const specs = RequiredSpecsSchema.safeParse(job.required_specs);
      if (!specs.success) return false;
      const allSkills = [
        ...(specs.data.skills ?? []),
        ...(specs.data.preferred_skills ?? []),
      ];
      return allSkills.includes(skill);
    });
  }

  if (sort === "budget_asc") {
    filtered.sort(
      (a, b) => getBudgetMin(a.budget_range) - getBudgetMin(b.budget_range),
    );
  } else if (sort === "budget_desc") {
    filtered.sort(
      (a, b) => getBudgetMax(b.budget_range) - getBudgetMax(a.budget_range),
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="条件に合う求人が見つかりません"
        description="検索条件を変えるか、新しい求人を投稿してみてください"
        action={{ label: "求人を投稿する", href: "/jobs/new" }}
      />
    );
  }

  return (
    <>
      <p style={{ marginBottom: 20, fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>
        {filtered.length.toLocaleString()}件の求人
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            companyName={companyMap.get(job.company_id) ?? null}
            isOwnCompany={userCompanyId === job.company_id}
            isDeveloper={isDeveloper}
            userAgents={userAgents}
            alreadyApplied={appliedJobIds.has(job.id)}
          />
        ))}
      </div>
    </>
  );
}

export default async function JobsPage({
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
    { data: allJobsData },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("jobs").select("required_specs").eq("status", "open"),
  ]);

  const role = user?.user_metadata?.role as string | undefined;
  const isCompany = role === "company";
  const isDeveloper = role === "developer";

  let userCompanyId: string | null = null;
  let userAgents: AgentOption[] = [];
  let appliedJobIds = new Set<string>();

  if (isCompany && user) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    userCompanyId = company?.id ?? null;
  }

  if (isDeveloper && user) {
    const { data: agentsData } = await supabase
      .from("ai_agents")
      .select("id, name")
      .eq("developer_id", user.id);
    userAgents = agentsData ?? [];

    if (userAgents.length > 0) {
      const agentIds = userAgents.map((a) => a.id);
      const { data: interactions } = await supabase
        .from("interactions")
        .select("job_id")
        .in("agent_id", agentIds)
        .eq("type", "application");
      appliedJobIds = new Set((interactions ?? []).map((i) => i.job_id));
    }
  }

  const allSkills = Array.from(
    new Set(
      (allJobsData ?? []).flatMap((job) => {
        const specs = RequiredSpecsSchema.safeParse(job.required_specs);
        if (!specs.success) return [];
        return [
          ...(specs.data.skills ?? []),
          ...(specs.data.preferred_skills ?? []),
        ];
      }),
    ),
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
              Job Listings
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
              AIエージェント求人
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              企業が求めるスペックで応募できる、スキルマッチング型の求人市場
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
            <JobFilters allSkills={allSkills} />
          </Suspense>
        </div>

        {/* ── 求人グリッド ── */}
        <Suspense
          fallback={
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ height: 16, width: "75%", borderRadius: 4, background: "#f3f4f6" }} />
                  <div style={{ height: 12, width: "50%", borderRadius: 4, background: "#f3f4f6" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} style={{ height: 22, width: 60, borderRadius: 99, background: "#f3f4f6" }} />
                    ))}
                  </div>
                  <div style={{ height: 14, width: "40%", borderRadius: 4, background: "#f3f4f6", marginTop: "auto" }} />
                </div>
              ))}
            </div>
          }
        >
          <JobList
            searchParams={params}
            userCompanyId={userCompanyId}
            isDeveloper={isDeveloper}
            userAgents={userAgents}
            appliedJobIds={appliedJobIds}
          />
        </Suspense>
      </div>
    </div>
  );
}
