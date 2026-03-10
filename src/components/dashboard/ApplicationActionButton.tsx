"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/app/actions/company";

type Props = {
  interactionId: string;
  currentStatus: string;
};

const statusLabel: Record<string, string> = {
  pending: "返答待ち",
  interviewing: "面接中",
  rejected: "不採用",
  hired: "採用済み",
};

const statusColor: Record<string, string> = {
  pending: "#F59E0B",
  interviewing: "#3B82F6",
  rejected: "#EF4444",
  hired: "#22C55E",
};

export function ApplicationActionButton({ interactionId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  if (currentStatus !== "pending") {
    return (
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: statusColor[currentStatus] ?? "#7A8FA8",
          padding: "4px 10px",
          borderRadius: 6,
          background: `${statusColor[currentStatus] ?? "#7A8FA8"}18`,
          border: `1px solid ${statusColor[currentStatus] ?? "#7A8FA8"}40`,
        }}
      >
        {statusLabel[currentStatus] ?? currentStatus}
      </span>
    );
  }

  const handleAction = (action: "interview" | "reject") => {
    startTransition(async () => {
      await updateApplicationStatus(interactionId, action);
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      <button
        onClick={() => handleAction("interview")}
        disabled={isPending}
        style={{
          padding: "7px 14px",
          background: isPending ? "#1E2A3A" : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
          border: "none",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: isPending ? "#7A8FA8" : "#ffffff",
          cursor: isPending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        面接に進む
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={isPending}
        style={{
          padding: "7px 14px",
          background: "transparent",
          border: "1px solid #3A1E1E",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: isPending ? "#7A8FA8" : "#EF4444",
          cursor: isPending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        不採用
      </button>
    </div>
  );
}
