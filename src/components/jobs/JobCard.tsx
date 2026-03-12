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

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  open:   { label: "募集中",   bg: "#dcfce7", color: "#166534" },
  closed: { label: "募集終了", bg: "#f3f4f6", color: "#6b7280" },
  filled: { label: "採用済み", bg: "#ede9fe", color: "#5b21b6" },
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

  const status = statusConfig[job.status] ?? { label: job.status, bg: "#f3f4f6", color: "#6b7280" };

  return (
    <div
      onClick={() => router.push(`/jobs/${job.id}`)}
      style={{
        border: isOwnCompany ? "2px solid #6366f1" : "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "16px",
        marginBottom: 12,
        background: "white",
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = isOwnCompany ? "#6366f1" : "#d1d5db";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = isOwnCompany ? "#6366f1" : "#e5e7eb";
      }}
    >
      {/* 1行目: タイトル + ステータスバッジ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <h3 style={{
          fontWeight: 700,
          fontSize: 16,
          lineHeight: 1.4,
          color: "#111827",
          margin: 0,
          flex: 1,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {job.title}
        </h3>
        <span style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 10px",
          borderRadius: 99,
          background: status.bg,
          color: status.color,
        }}>
          {status.label}
        </span>
      </div>

      {/* 2行目: 会社名 + 投稿日 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {companyName ?? ""}
          {budget.success && (
            <span style={{ marginLeft: companyName ? 8 : 0, color: "#9ca3af" }}>
              ¥{budget.data.min.toLocaleString()} 〜 ¥{budget.data.max.toLocaleString()}
            </span>
          )}
        </span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          {new Date(job.created_at).toLocaleDateString("ja-JP")}
        </span>
      </div>

      {/* 3行目: 説明文 */}
      {job.problem_statement && (
        <p style={{
          fontSize: 13,
          color: "#6b7280",
          marginTop: 8,
          lineHeight: 1.5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {job.problem_statement}
        </p>
      )}

      {/* 4行目: スキルタグ */}
      {allSkills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
          {requiredSkills.slice(0, 4).map((skill) => (
            <span key={skill} style={{
              fontSize: 11,
              padding: "2px 8px",
              background: "#f3f4f6",
              borderRadius: 4,
              color: "#374151",
            }}>
              {skill}
            </span>
          ))}
          {preferredSkills.slice(0, Math.max(0, 4 - requiredSkills.length)).map((skill) => (
            <span key={skill} style={{
              fontSize: 11,
              padding: "2px 8px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              color: "#9ca3af",
            }}>
              {skill}
            </span>
          ))}
          {allSkills.length > 4 && (
            <span style={{
              fontSize: 11,
              padding: "2px 8px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              color: "#9ca3af",
            }}>
              +{allSkills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* 5行目: 自社求人ラベル or 応募ボタン */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        {isOwnCompany ? (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 10px",
            background: "#ede9fe",
            borderRadius: 99,
            color: "#5b21b6",
          }}>
            自社の求人
          </span>
        ) : isDeveloper && job.status === "open" ? (
          <span onClick={(e) => e.stopPropagation()}>
            <ApplyButton
              jobId={job.id}
              jobTitle={job.title}
              userAgents={userAgents}
              alreadyApplied={alreadyApplied}
            />
          </span>
        ) : null}
      </div>
    </div>
  );
}
