import { notFound } from "next/navigation";
import Link from "next/link";
import { ScoutButton } from "@/components/agents/ScoutButton";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/schemas/agent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentResumePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data, error }, { data: { user } }] = await Promise.all([
    supabase.from("ai_agents").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (error || !data) notFound();

  const agent = data as Agent;
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = user?.user_metadata?.role as string | undefined;
  const isCompany = role === "company";
  const isOwner = user?.id === agent.developer_id;

  let companyJobs: { id: string; title: string }[] = [];
  let scoutedJobIds = new Set<string>();

  if (isCompany && user) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (company) {
      const [{ data: jobsData }, { data: scoutsData }] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title")
          .eq("company_id", company.id)
          .eq("status", "open")
          .order("created_at", { ascending: false }),
        supabase
          .from("interactions")
          .select("job_id")
          .eq("agent_id", id)
          .eq("type", "scout"),
      ]);
      companyJobs = jobsData ?? [];
      scoutedJobIds = new Set((scoutsData ?? []).map((s) => s.job_id));
    }
  }

  const tr = agent.track_record;
  const stats = [
    {
      value: tr ? `${tr.uptime_percentage.toFixed(1)}%` : "N/A",
      label: "稼働率",
      color: tr
        ? tr.uptime_percentage >= 99
          ? "#16a34a"
          : tr.uptime_percentage >= 95
          ? "#d97706"
          : "#dc2626"
        : "#9ca3af",
    },
    {
      value: tr ? tr.total_processed.toLocaleString() : "0",
      label: "総処理数",
      color: "#111827",
    },
    {
      value: tr ? `${tr.avg_response_ms}ms` : "N/A",
      label: "平均応答時間",
      color: "#111827",
    },
    {
      value: tr ? `${tr.error_rate.toFixed(2)}%` : "N/A",
      label: "エラー率",
      color: tr
        ? tr.error_rate <= 1
          ? "#16a34a"
          : tr.error_rate <= 5
          ? "#d97706"
          : "#dc2626"
        : "#9ca3af",
    },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* 戻るリンク */}
      <Link
        href="/agents"
        style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24 }}
      >
        ← エージェント一覧に戻る
      </Link>

      {/* ── メインカード ── */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, marginBottom: 24 }}>

        {/* 2カラムレイアウト */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr)", gap: 40, alignItems: "start" }}>

          {/* ── 左: アバター + 基本情報 ── */}
          <div>
            {/* アバター */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#4b5563",
              marginBottom: 16,
              overflow: "hidden",
            }}>
              {agent.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.avatar_url} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>

            {/* 名前 */}
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
              {agent.name}
            </h1>

            {/* バッジ */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#f3f4f6", color: "#6b7280", padding: "3px 10px", borderRadius: 99 }}>
                {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
              </span>
              {agent.is_verified && (
                <span style={{ fontSize: 12, fontWeight: 500, backgroundColor: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 99 }}>
                  認証済
                </span>
              )}
            </div>

            {/* 説明 */}
            {agent.personality && (
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                {agent.personality}
              </p>
            )}

            {/* アクションボタン */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {isCompany && companyJobs.length > 0 && (
                <ScoutButton
                  agentId={agent.id}
                  agentName={agent.name}
                  companyJobs={companyJobs}
                  scoutedJobIds={scoutedJobIds}
                />
              )}
              {isOwner && (
                <Link
                  href={`/agents/${agent.id}/edit`}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "8px 16px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    color: "#374151",
                    textDecoration: "none",
                  }}
                >
                  編集
                </Link>
              )}
            </div>
          </div>

          {/* ── 右: スキル + 実績 ── */}
          <div>
            {/* スキルタグ */}
            {agent.skills.length > 0 && (
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  スキル
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {agent.skills.map((skill) => (
                    <span key={skill} style={{ fontSize: 12, padding: "4px 10px", backgroundColor: "#f3f4f6", borderRadius: 99, color: "#4b5563" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 実績カード */}
            <section>
              <h2 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                実績データ
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {stats.map(({ value, label, color }) => (
                  <div key={label} style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 14px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {value}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── ポートフォリオ（仮） ── */}
      <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#374151" }}>ポートフォリオ</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>ポートフォリオは Phase 1 で実装予定です。</p>
      </div>
    </div>
  );
}
