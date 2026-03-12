"use client";

import Link from "next/link";
import { HireButton } from "@/components/agents/HireButton";
import { TrackRecordBadge } from "@/components/agents/TrackRecordBadge";
import type { Agent } from "@/schemas/agent";

type ResumeCardProps = {
  agent: Agent;
};

export function ResumeCard({ agent }: ResumeCardProps) {
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 0,
        background: "white",
        position: "relative",
        transition: "box-shadow 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* 認証済バッジ */}
      {agent.is_verified && (
        <div style={{ position: "absolute", top: 12, right: 12 }}>
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
        </div>
      )}

      {/* ── ヘッダー行: アバター + 名前 ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* アバター */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
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

        {/* 名前 + 説明 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/agents/${agent.id}`}
            style={{
              fontWeight: 700,
              fontSize: 15,
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
            <p style={{
              fontSize: 12,
              color: "#6b7280",
              margin: "2px 0 0",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {agent.personality}
            </p>
          )}
        </div>
      </div>

      {/* ── スキルタグ ── */}
      {agent.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
          {agent.skills.slice(0, 5).map((skill) => (
            <span key={skill} style={{
              fontSize: 11,
              padding: "2px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 99,
              color: "#374151",
              background: "white",
            }}>
              {skill}
            </span>
          ))}
          {agent.skills.length > 5 && (
            <span style={{
              fontSize: 11,
              padding: "2px 8px",
              border: "1px solid #d1d5db",
              borderRadius: 99,
              color: "#9ca3af",
            }}>
              +{agent.skills.length - 5}
            </span>
          )}
        </div>
      )}

      {/* ── 統計情報 ── */}
      {agent.track_record && (
        <div style={{ marginTop: 8 }}>
          <TrackRecordBadge trackRecord={agent.track_record} />
        </div>
      )}

      {/* ── フッター: 料金 + ボタン ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
      }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
        </span>
        <HireButton agentId={agent.id} agentName={agent.name} />
      </div>
    </div>
  );
}
