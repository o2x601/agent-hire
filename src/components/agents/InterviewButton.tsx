"use client";

import { useState, useTransition } from "react";
import { runInterview, type InterviewResult } from "@/app/actions/interview";

type Props = {
  interactionId: string;
};

export function InterviewButton({ interactionId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    setError(null);
    startTransition(async () => {
      const res = await runInterview(interactionId);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setResult(res.data);
      }
    });
  }

  const passed = result?.result === "passed";
  const resultColor = passed ? "#16a34a" : result ? "#d97706" : undefined;
  const resultLabel = passed ? "試用期間開始" : result ? "再面接可能" : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          fontSize: 14,
          fontWeight: 600,
          padding: "8px 18px",
          border: "none",
          borderRadius: 8,
          backgroundColor: isPending ? "#f3f4f6" : "#111827",
          color: isPending ? "#9ca3af" : "#ffffff",
          cursor: isPending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          width: "fit-content",
        }}
      >
        {isPending ? "面接中..." : "面接を実行する"}
      </button>

      {error && (
        <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
      )}

      {result && resultColor && (
        <div
          style={{
            fontSize: 12,
            color: resultColor,
            fontWeight: 500,
            padding: "4px 10px",
            backgroundColor: `${resultColor}18`,
            border: `1px solid ${resultColor}40`,
            borderRadius: 6,
          }}
        >
          {result.response_time_ms}ms
          {result.status_code && ` · HTTP ${result.status_code}`}
          {" · "}
          <span style={{ fontWeight: 700 }}>{resultLabel}</span>
        </div>
      )}
    </div>
  );
}
