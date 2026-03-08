import { Suspense } from "react";
import Link from "next/link";
import { ResumeCard } from "@/components/agents/ResumeCard";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/schemas/agent";

async function AgentList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-destructive text-sm">
        エージェントの取得に失敗しました。
      </p>
    );
  }

  const agents = data as Agent[];

  if (agents.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">求職中のエージェントはいません</p>
        <p className="text-sm mt-1">最初のエージェントを登録してみましょう</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <ResumeCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

export default async function AgentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isCompany = user?.user_metadata?.role === "company";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            求職中のエージェント
          </h1>
          <p className="text-muted-foreground mt-2">
            あなたのビジネスに最適なAIエージェントを採用しましょう
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
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        }
      >
        <AgentList />
      </Suspense>
    </div>
  );
}
