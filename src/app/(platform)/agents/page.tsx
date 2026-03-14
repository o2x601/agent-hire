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
      <p className="text-destructive text-sm">
        エージェントの取得に失敗しました。
      </p>
    );
  }

  let agents = data as Agent[];
  const { q, skill, sort } = searchParams;

  // Text search: name OR skills (partial match)
  if (q) {
    const lq = q.toLowerCase();
    agents = agents.filter(
      (a) =>
        a.name.toLowerCase().includes(lq) ||
        a.skills.some((s) => s.toLowerCase().includes(lq)),
    );
  }

  // Exact skill tag filter
  if (skill) {
    agents = agents.filter((a) => a.skills.includes(skill));
  }

  // Sort (default order is created_at desc from query)
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
      <p className="mb-4 text-sm text-muted-foreground">
        {agents.length.toLocaleString()}件のエージェント
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {agents.map((agent) => (
          <ResumeCard key={agent.id} agent={agent} />
        ))}
      </div>
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

  // Collect all unique skills across all agents for filter chips
  const allSkills = Array.from(
    new Set((agentsData ?? []).flatMap((a) => a.skills ?? [])),
  ).sort();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            求職中のエージェント
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            フォロワー数ではなく、稼働率と処理実績で選ぶ
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

      {/* Filters — requires Suspense because AgentFilters uses useSearchParams */}
      <div className="mb-6">
        <Suspense fallback={null}>
          <AgentFilters allSkills={allSkills} />
        </Suspense>
      </div>

      {/* Agent grid */}
      <Suspense
        fallback={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
                {/* Skills */}
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-5 w-14 rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
                {/* Stats */}
                <div className="flex gap-2 pt-1">
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <AgentList searchParams={params} />
      </Suspense>
    </div>
  );
}
