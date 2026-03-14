"use client";

import Link from "next/link";
import { HireButton } from "@/components/agents/HireButton";
import type { Agent } from "@/schemas/agent";

type ResumeCardProps = {
  agent: Agent;
};

const CATEGORY_LABELS: Record<string, string> = {
  customer_support: "カスタマーサポート",
  data_analysis: "データ分析",
  content_generation: "コンテンツ生成",
  coding: "コーディング",
  image_video: "画像・動画",
  voice_translation: "音声・翻訳",
  marketing: "マーケティング",
  rpa: "RPA",
  search_intelligence: "検索・インテリジェンス",
  security_monitoring: "セキュリティ監視",
  other: "その他",
};

export function ResumeCard({ agent }: ResumeCardProps) {
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tr = agent.track_record;

  const uptimeColor =
    !tr ? "#9ca3af"
    : tr.uptime_percentage >= 99 ? "#059669"
    : tr.uptime_percentage >= 95 ? "#d97706"
    : "#dc2626";

  const uptimeBg =
    !tr ? "#f3f4f6"
    : tr.uptime_percentage >= 99 ? "#ecfdf5"
    : tr.uptime_percentage >= 95 ? "#fffbeb"
    : "#fef2f2";

  const categoryLabel = agent.category ? (CATEGORY_LABELS[agent.category] ?? agent.category) : null;

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="agent-card-link"
    >
      {/* ── ヘッダー: アバター + 名前 + カテゴリ ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        {/* アバター */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#ffffff",
            flexShrink: 0,
            overflow: "hidden",
            letterSpacing: "-0.02em",
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

        {/* 名前 + メタ情報 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}
            >
              {agent.name}
            </span>
            {agent.is_verified && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "1px 7px", borderRadius: 99 }}>
                認証済
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {categoryLabel && (
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{categoryLabel}</span>
            )}
            {categoryLabel && (
              <span style={{ fontSize: 11, color: "#d1d5db" }}>·</span>
            )}
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
            </span>
          </div>
        </div>

        {/* 出勤率バッジ */}
        {tr && (
          <div
            style={{
              flexShrink: 0,
              textAlign: "center",
              background: uptimeBg,
              border: `1px solid ${uptimeColor}40`,
              borderRadius: 10,
              padding: "6px 10px",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: uptimeColor, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {tr.uptime_percentage.toFixed(1)}%
            </div>
            <div style={{ fontSize: 9, color: uptimeColor, opacity: 0.8, marginTop: 2, fontWeight: 600, letterSpacing: "0.04em" }}>
              出勤率
            </div>
          </div>
        )}
      </div>

      {/* ── 説明文 ── */}
      {agent.personality && (
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            lineHeight: 1.55,
            marginBottom: 14,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {agent.personality}
        </p>
      )}

      {/* ── スキルタグ ── */}
      {agent.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {agent.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="ah-skill-pill">
              {skill}
            </span>
          ))}
          {agent.skills.length > 4 && (
            <span style={{ fontSize: 12, color: "#9ca3af", padding: "4px 8px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 999 }}>
              +{agent.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* ── フッター: 統計 + ボタン ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 14,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {/* 統計情報 */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {tr?.total_processed !== undefined && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "-0.01em" }}>
                {tr.total_processed.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>総処理数</div>
            </div>
          )}
          {tr?.avg_response_ms !== undefined && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "-0.01em" }}>
                {tr.avg_response_ms}ms
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>反応速度</div>
            </div>
          )}
          {!tr && (
            <span style={{ fontSize: 12, color: "#d1d5db" }}>実績データなし</span>
          )}
        </div>

        {/* 採用ボタン */}
        <div onClick={(e) => e.preventDefault()}>
          <HireButton agentId={agent.id} agentName={agent.name} />
        </div>
      </div>
    </Link>
  );
}
