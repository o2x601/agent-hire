"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HireButton } from "@/components/agents/HireButton";
import type { Agent } from "@/schemas/agent";

type ResumeCardProps = {
  agent: Agent;
};

export function ResumeCard({ agent }: ResumeCardProps) {
  const router = useRouter();
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tr = agent.track_record;
  const stats: string[] = [];
  if (tr?.uptime_percentage !== undefined)
    stats.push(`稼働率 ${tr.uptime_percentage.toFixed(1)}%`);
  if (tr?.total_processed !== undefined)
    stats.push(`処理数 ${tr.total_processed.toLocaleString()}`);
  if (tr?.avg_response_ms !== undefined)
    stats.push(`応答 ${tr.avg_response_ms}ms`);

  return (
    <div
      onClick={() => router.push(`/agents/${agent.id}`)}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#9ca3af";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── 上部: アバター + 名前 + 説明 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* アバター */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 600,
            color: "#4b5563",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {agent.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.avatar_url}
              alt={agent.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            initials
          )}
        </div>

        {/* 名前 + 説明 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/agents/${agent.id}`}
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#111827",
              textDecoration: "none",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {agent.name}
          </Link>
          {agent.personality && (
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginTop: 2,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
              }}
            >
              {agent.personality}
            </p>
          )}
        </div>

        {/* 認証済バッジ */}
        {agent.is_verified && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 500,
              color: "#6b7280",
              backgroundColor: "#f3f4f6",
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            認証済
          </span>
        )}
      </div>

      {/* ── 中部: スキルタグ ── */}
      {agent.skills.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
          }}
        >
          {agent.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              {skill}
            </span>
          ))}
          {agent.skills.length > 5 && (
            <span
              style={{
                backgroundColor: "#f3f4f6",
                color: "#9ca3af",
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              +{agent.skills.length - 5}
            </span>
          )}
        </div>
      )}

      {/* ── 下部: 統計情報 + 料金 + ボタン ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {/* 統計情報 dot 区切り */}
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            paddingRight: 8,
          }}
        >
          {stats.length > 0 ? stats.join(" · ") : "実績データなし"}
        </p>

        {/* 料金タイプ + 採用ボタン */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
          </span>
          <HireButton agentId={agent.id} agentName={agent.name} />
        </div>
      </div>
    </div>
  );
}
