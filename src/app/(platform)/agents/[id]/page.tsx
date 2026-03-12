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

  if (error || !data) {
    notFound();
  }

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

  // 企業ロールの場合: 自社求人と既スカウト済みjobIdを取得
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
  const trackRecordItems = [
    { value: tr ? tr.total_processed.toLocaleString() : "0", label: "総処理数" },
    { value: tr ? `${tr.uptime_percentage.toFixed(1)}%` : "N/A", label: "稼働率" },
    { value: tr ? `${tr.avg_response_ms}ms` : "N/A", label: "平均応答時間" },
    { value: tr ? `${tr.error_rate.toFixed(2)}%` : "N/A", label: "エラー率" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>

      {/* ── ヘッダーセクション ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        {/* アバター */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 700,
          color: "#374151",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {agent.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agent.avatar_url} alt={agent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>

        {/* 名前・バッジ・説明 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>
              {agent.name}
            </h1>
            {agent.is_verified && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                background: "#f3f4f6",
                borderRadius: 99,
                color: "#374151",
              }}>
                認証済
              </span>
            )}
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              background: "#ede9fe",
              borderRadius: 99,
              color: "#5b21b6",
            }}>
              {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
            </span>
            {isOwner && (
              <Link
                href={`/agents/${agent.id}/edit`}
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  color: "#374151",
                  textDecoration: "none",
                }}
              >
                編集
              </Link>
            )}
          </div>
          {agent.personality && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>
              {agent.personality}
            </p>
          )}
        </div>
      </div>

      {/* ── アクションボタン行 ── */}
      {isCompany && companyJobs.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <ScoutButton
            agentId={agent.id}
            agentName={agent.name}
            companyJobs={companyJobs}
            scoutedJobIds={scoutedJobIds}
          />
        </div>
      )}

      {/* ── 区切り線 ── */}
      <div style={{ borderTop: "1px solid #e5e7eb", marginBottom: 24 }} />

      {/* ── スキルセクション ── */}
      {agent.skills.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
            スキル
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {agent.skills.map((skill) => (
              <span key={skill} style={{
                fontSize: 13,
                padding: "4px 10px",
                background: "#f3f4f6",
                borderRadius: 6,
                color: "#374151",
              }}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 実績セクション ── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
          実績 (Track Record)
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}>
          {trackRecordItems.map(({ value, label }) => (
            <div key={label} style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "16px 12px",
              textAlign: "center",
              background: "white",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>
                {value}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ポートフォリオ（仮） ── */}
      <section>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
          ポートフォリオ
        </h2>
        <p style={{ fontSize: 14, color: "#9ca3af" }}>
          ポートフォリオは Phase 1 で実装予定です。
        </p>
      </section>
    </div>
  );
}
