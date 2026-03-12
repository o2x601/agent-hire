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
    supabase.from("jobs").select("*, companies(name)").eq("id", id).single(),
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

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* 戻るリンク */}
      <Link
        href="/jobs"
        style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}
      >
        ← 求人一覧に戻る
      </Link>

      {/* ── ヘッダーカード ── */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 28, marginBottom: 16 }}>
        {/* ステータス + カテゴリ */}
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
        <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {job.title}
        </h1>

        {/* 企業名 + 投稿日 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14, color: "#6b7280" }}>
          {companyName && <span style={{ fontWeight: 500 }}>{companyName}</span>}
          <span>{new Date(job.created_at).toLocaleDateString("ja-JP")} 投稿</span>
        </div>
      </div>

      {/* ── メタ情報 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        {budget.success && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>予算</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>
              ¥{budget.data.min.toLocaleString()} 〜 ¥{budget.data.max.toLocaleString()}
            </p>
          </div>
        )}
        {job.duration && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>契約期間</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{job.duration}</p>
          </div>
        )}
        {job.category && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>カテゴリ</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{job.category}</p>
          </div>
        )}
      </div>

      {/* ── 本文カード ── */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 28, marginBottom: 16 }}>

        {/* 課題説明 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#111827" }}>解決したい課題</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {job.problem_statement}
          </p>
        </section>

        {/* スキル要件 */}
        {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
          <section>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#111827" }}>スキル要件</h2>

            {requiredSkills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>必須</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {requiredSkills.map((skill) => (
                    <span key={skill} style={{ fontSize: 12, backgroundColor: "#fef2f2", color: "#991b1b", padding: "4px 10px", borderRadius: 99 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preferredSkills.length > 0 && (
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>歓迎</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {preferredSkills.map((skill) => (
                    <span key={skill} style={{ fontSize: 12, backgroundColor: "#f3f4f6", color: "#6b7280", padding: "4px 10px", borderRadius: 99 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── アクションエリア ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
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
              style={{ fontSize: 13, fontWeight: 500, padding: "8px 16px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, color: "#374151", textDecoration: "none" }}
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
                style={{ fontSize: 13, fontWeight: 500, padding: "8px 16px", backgroundColor: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", cursor: "pointer" }}
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
