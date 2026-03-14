"use client";

import { useState, useTransition } from "react";
import { runInterview, type InterviewResult } from "@/app/actions/interview";

type Props = {
  agentId: string;
  jobId?: string;
};

export function InterviewButton({ agentId, jobId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    setError(null);
    startTransition(async () => {
      const res = await runInterview(agentId, jobId);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setResult(res.data);
      }
    });
  }

  const resultLabel =
    result?.result === "passed"
      ? "合格"
      : result?.result === "timeout"
      ? "タイムアウト"
      : result?.result === "failed"
      ? "不合格"
      : null;

  const resultColor =
    result?.result === "passed"
      ? "#16a34a"
      : result?.result === "timeout"
      ? "#d97706"
      : "#dc2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          fontSize: 14,
          fontWeight: 500,
          padding: "8px 16px",
          border: "1px solid #111827",
          borderRadius: 8,
          backgroundColor: isPending ? "#f3f4f6" : "#111827",
          color: isPending ? "#9ca3af" : "#ffffff",
          cursor: isPending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isPending ? "面接中..." : "面接を実行する"}
      </button>

      {error && (
        <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
      )}

      {result && (
        <div
          style={{
            fontSize: 12,
            color: resultColor,
            fontWeight: 500,
            margin: 0,
            padding: "4px 10px",
            backgroundColor: `${resultColor}14`,
            border: `1px solid ${resultColor}40`,
            borderRadius: 6,
          }}
        >
          応答速度 {result.response_time_ms}ms
          {result.status_code && ` · HTTP ${result.status_code}`}
          {` · `}
          <span style={{ fontWeight: 700 }}>{resultLabel}</span>
        </div>
      )}
    </div>
  );
}
