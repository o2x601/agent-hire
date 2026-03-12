"use client";

import { useRouter } from "next/navigation";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { BudgetRangeSchema, RequiredSpecsSchema } from "@/schemas/job";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type AgentOption = { id: string; name: string };

type Props = {
  job: JobRow;
  companyName: string | null;
  isOwnCompany: boolean;
  isDeveloper: boolean;
  userAgents: AgentOption[];
  alreadyApplied: boolean;
};

export function JobCard({
  job,
  companyName,
  isOwnCompany,
  isDeveloper,
  userAgents,
  alreadyApplied,
}: Props) {
  const router = useRouter();
  const budget = BudgetRangeSchema.safeParse(job.budget_range);
  const specs = RequiredSpecsSchema.safeParse(job.required_specs);
  const requiredSkills = specs.success ? (specs.data.skills ?? []) : [];
  const preferredSkills = specs.success ? (specs.data.preferred_skills ?? []) : [];
  const allSkills = [...requiredSkills, ...preferredSkills];

  return (
    <div
      onClick={() => router.push(`/jobs/${job.id}`)}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        cursor: "pointer",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#9ca3af";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* ── 上部: タイトル + ステータスバッジ ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
            margin: 0,
            flex: 1,
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {job.title}
        </h3>
        {job.status === "open" && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              padding: "3px 8px",
              borderRadius: 99,
            }}
          >
            募集中
          </span>
        )}
      </div>

      {/* ── 会社名 ── */}
      <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
        {companyName ?? ""}
        {budget.success && (
          <span style={{ marginLeft: companyName ? 8 : 0, color: "#9ca3af" }}>
            ¥{budget.data.min.toLocaleString()} 〜 ¥{budget.data.max.toLocaleString()}
          </span>
        )}
      </p>

      {/* ── 説明文 ── */}
      {job.problem_statement && (
        <p
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginTop: 12,
            lineHeight: 1.6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {job.problem_statement}
        </p>
      )}

      {/* ── スキルタグ ── */}
      {allSkills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {requiredSkills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              style={{
                fontSize: 12,
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              {skill}
            </span>
          ))}
          {preferredSkills.slice(0, Math.max(0, 4 - requiredSkills.length)).map((skill) => (
            <span
              key={skill}
              style={{
                fontSize: 12,
                backgroundColor: "#f3f4f6",
                color: "#9ca3af",
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              {skill}
            </span>
          ))}
          {allSkills.length > 4 && (
            <span
              style={{
                fontSize: 12,
                backgroundColor: "#f3f4f6",
                color: "#9ca3af",
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              +{allSkills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* ── 下部: 投稿日 + 自社バッジ or 応募ボタン ── */}
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
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          {new Date(job.created_at).toLocaleDateString("ja-JP")}
        </span>

        <div onClick={(e) => e.stopPropagation()}>
          {isOwnCompany ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              自社の求人
            </span>
          ) : isDeveloper && job.status === "open" ? (
            <ApplyButton
              jobId={job.id}
              jobTitle={job.title}
              userAgents={userAgents}
              alreadyApplied={alreadyApplied}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
