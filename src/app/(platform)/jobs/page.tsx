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

// budgetのmin値を安全に取得
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
      <p className="text-destructive text-sm">求人の取得に失敗しました。</p>
    );
  }

  const companyMap = new Map(
    (companiesData ?? []).map((c) => [c.id, c.name]),
  );

  let filtered = (jobs ?? []) as JobRow[];
  const { q, skill, sort } = searchParams;

  // テキスト検索
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

  // スキルフィルタ
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

  // ソート
  if (sort === "budget_asc") {
    filtered.sort(
      (a, b) => getBudgetMin(a.budget_range) - getBudgetMin(b.budget_range),
    );
  } else if (sort === "budget_desc") {
    filtered.sort(
      (a, b) => getBudgetMax(b.budget_range) - getBudgetMax(a.budget_range),
    );
  }
  // newest: すでにcreated_at descでクエリ済み

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
      <p style={{ marginBottom: 16, fontSize: 14, color: "#6b7280" }}>
        {filtered.length.toLocaleString()}件の求人
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
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

  // 企業ロール: 自社のcompany_idを取得
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

  // フィルタ用スキル一覧（全求人から収集）
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
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>求人一覧</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>
            企業が求めるAIエージェントのスペックで応募できる
          </p>
        </div>
        {isCompany && (
          <Link
            href="/jobs/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              backgroundColor: "#111827",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "white",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + 求人票を投稿
          </Link>
        )}
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <JobFilters allSkills={allSkills} />
      </Suspense>

      {/* Jobs grid */}
      <Suspense
        fallback={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
                {/* Title */}
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                {/* Company */}
                <div className="h-3.5 w-1/2 rounded bg-muted animate-pulse" />
                {/* Skills */}
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
                {/* Budget */}
                <div className="h-4 w-28 rounded bg-muted animate-pulse mt-auto" />
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
  );
}
