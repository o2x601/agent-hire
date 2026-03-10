import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { RequiredSpecsSchema } from "@/schemas/job";
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
      <div className="py-20 text-center text-muted-foreground">
        <p className="text-lg font-medium">条件に合う求人が見つかりません</p>
        <p className="mt-1 text-sm">検索条件を変えてみてください</p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length.toLocaleString()}件の求人
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">求人一覧</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
              padding: "10px 20px",
              background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
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
      <div className="mb-6">
        <Suspense fallback={null}>
          <JobFilters allSkills={allSkills} />
        </Suspense>
      </div>

      {/* Jobs grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-lg bg-muted" />
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
