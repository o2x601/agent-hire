import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { BudgetRangeSchema, RequiredSpecsSchema } from "@/schemas/job";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: job, error },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, companies(name)")
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (error || !job) notFound();

  const role = user?.user_metadata?.role as string | undefined;
  const isDeveloper = role === "developer";
  const isCompany = role === "company";

  // 企業ロール: 自社求人か確認
  let isOwnJob = false;
  let userAgents: { id: string; name: string }[] = [];
  let alreadyApplied = false;

  if (isCompany && user) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    isOwnJob = company?.id === job.company_id;
  }

  if (isDeveloper && user) {
    const { data: agentsData } = await supabase
      .from("ai_agents")
      .select("id, name")
      .eq("developer_id", user.id);
    userAgents = agentsData ?? [];

    if (userAgents.length > 0) {
      const { data: interaction } = await supabase
        .from("interactions")
        .select("id")
        .in("agent_id", userAgents.map((a) => a.id))
        .eq("job_id", id)
        .eq("type", "application")
        .maybeSingle();
      alreadyApplied = !!interaction;
    }
  }

  const budget = BudgetRangeSchema.safeParse(job.budget_range);
  const specs = RequiredSpecsSchema.safeParse(job.required_specs);
  const requiredSkills = specs.success ? (specs.data.skills ?? []) : [];
  const preferredSkills = specs.success ? (specs.data.preferred_skills ?? []) : [];

  const companyName = (job.companies as { name: string } | null)?.name ?? null;

  const statusLabel: Record<string, string> = {
    open: "募集中",
    closed: "募集終了",
    filled: "採用済み",
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* 戻るリンク */}
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← 求人一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="mt-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={job.status === "open" ? "default" : "secondary"}>
            {statusLabel[job.status] ?? job.status}
          </Badge>
          {job.category && (
            <Badge variant="outline">{job.category}</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2">
          {job.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {companyName && <span>{companyName}</span>}
          <span>投稿日: {new Date(job.created_at).toLocaleDateString("ja-JP")}</span>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* メタ情報 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {budget.success && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">予算</p>
            <p className="text-sm font-semibold">
              ¥{budget.data.min.toLocaleString()} 〜 ¥{budget.data.max.toLocaleString()}
            </p>
          </div>
        )}
        {job.duration && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">契約期間</p>
            <p className="text-sm font-semibold">{job.duration}</p>
          </div>
        )}
        {job.category && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground mb-1">カテゴリ</p>
            <p className="text-sm font-semibold">{job.category}</p>
          </div>
        )}
      </div>

      {/* 課題・説明 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">解決したい課題</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {job.problem_statement}
        </p>
      </section>

      {/* スキル要件 */}
      {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">スキル要件</h2>
          {requiredSkills.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">必須</p>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {preferredSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">あると嬉しい</p>
              <div className="flex flex-wrap gap-2">
                {preferredSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs text-muted-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <Separator className="mb-8" />

      {/* アクション */}
      <div className="flex flex-wrap items-center gap-3">
        {isDeveloper && job.status === "open" && (
          <ApplyButton
            jobId={job.id}
            jobTitle={job.title}
            userAgents={userAgents}
            alreadyApplied={alreadyApplied}
          />
        )}
        {isOwnJob && (
          <>
            <Link
              href={`/jobs/${job.id}/edit`}
              className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              編集
            </Link>
            <form
              action={async () => {
                "use server";
                const { createClient: sc } = await import("@/lib/supabase/server");
                const s = await sc();
                await s.from("jobs").update({ status: "closed" }).eq("id", id);
              }}
            >
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md border border-destructive/40 bg-background px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
              >
                募集を終了
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
