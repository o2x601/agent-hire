import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
    supabase.from("jobs").select("company_id, *, companies(name)").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (error || !job) notFound();

  const role = user?.user_metadata?.role as string | undefined;
  const isDeveloper = role === "developer";
  const isCompany = role === "company";

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

  const statusStyle: Record<string, { label: string; bg: string; color: string }> = {
    open:   { label: "募集中",   bg: "#f0fdf4", color: "#16a34a" },
    closed: { label: "募集終了", bg: "#f3f4f6", color: "#6b7280" },
    filled: { label: "採用済み", bg: "#eff6ff", color: "#2563eb" },
  };
  const status = statusStyle[job.status] ?? { label: job.status, bg: "#f3f4f6", color: "#6b7280" };

  const budgetLabel = budget.success
    ? `¥${budget.data.min.toLocaleString()} 〜 ¥${budget.data.max.toLocaleString()}`
    : "要相談";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* 戻るリンク */}
      <Link
        href="/jobs"
        style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}
      >
        ← 求人一覧に戻る
      </Link>

      {/* ── ヘッダーセクション ── */}
      <div>
        {/* ステータス + カテゴリバッジ */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 500, backgroundColor: status.bg, color: status.color, padding: "3px 10px", borderRadius: 99 }}>
            {status.label}
          </span>
          {job.category && (
            <span style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#f3f4f6", color: "#6b7280", padding: "3px 10px", borderRadius: 99 }}>
              {job.category}
            </span>
          )}
        </div>

        {/* タイトル */}
        <h1 style={{ margin: "12px 0 0", fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {job.title}
        </h1>

        {/* 企業名 + 投稿日 */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {companyName && (
            <span style={{ fontSize: 15, color: "#6b7280", fontWeight: 500 }}>{companyName}</span>
          )}
          <span style={{ fontSize: 15, color: "#9ca3af" }}>
            {new Date(job.created_at).toLocaleDateString("ja-JP")} 投稿
          </span>
        </div>

        {/* 区切り線 */}
        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 24 }} />
      </div>

      {/* ── メタ情報セクション ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 24 }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9ca3af" }}>予算範囲</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{budgetLabel}</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9ca3af" }}>契約期間</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{job.duration ?? "—"}</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9ca3af" }}>カテゴリ</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{job.category ?? "—"}</p>
        </div>
      </div>

      {/* ── 課題説明セクション ── */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>解決したい課題</h2>
        <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {job.problem_statement}
        </p>
      </section>

      {/* ── スキル要件セクション ── */}
      {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
        <section style={{ marginTop: 32, borderTop: "1px solid #f3f4f6", paddingTop: 32 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>スキル要件</h2>

          {requiredSkills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, backgroundColor: "#fef2f2", color: "#dc2626", padding: "3px 8px", borderRadius: 99 }}>
                  必須
                </span>
                {requiredSkills.map((skill) => (
                  <span key={skill} style={{ fontSize: 13, backgroundColor: "#f3f4f6", color: "#4b5563", padding: "6px 12px", borderRadius: 99 }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {preferredSkills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, backgroundColor: "#f3f4f6", color: "#6b7280", padding: "3px 8px", borderRadius: 99 }}>
                あると嬉しい
              </span>
              {preferredSkills.map((skill) => (
                <span key={skill} style={{ fontSize: 13, backgroundColor: "#f3f4f6", color: "#4b5563", padding: "6px 12px", borderRadius: 99 }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── アクションセクション ── */}
      {(isDeveloper || isOwnJob) && (
        <div style={{ marginTop: 32, borderTop: "1px solid #f3f4f6", paddingTop: 32, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
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
                style={{ fontSize: 14, fontWeight: 500, padding: "12px 24px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", textDecoration: "none" }}
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
                  style={{ fontSize: 14, fontWeight: 500, padding: "12px 24px", backgroundColor: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", cursor: "pointer" }}
                >
                  募集を終了
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
