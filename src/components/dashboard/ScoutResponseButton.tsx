"use client";

import { useState, useTransition } from "react";
import { respondToScout } from "@/app/actions/scouts";

type Props = {
  interactionId: string;
};

export function ScoutResponseButton({ interactionId }: Props) {
  const [done, setDone] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <span style={{ fontSize: 13, fontWeight: 600, color: done === "accept" ? "#111827" : "#6b7280" }}>
        {done === "accept" ? "承諾済み" : "辞退済み"}
      </span>
    );
  }

  const handle = (action: "accept" | "reject") => {
    setError(null);
    startTransition(async () => {
      const result = await respondToScout(interactionId, action);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(action);
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => handle("accept")}
          disabled={isPending}
          style={{
            padding: "7px 14px",
            background: isPending ? "#9ca3af" : "#111827",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#ffffff",
            cursor: isPending ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          承諾
        </button>
        <button
          onClick={() => handle("reject")}
          disabled={isPending}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: isPending ? "#9ca3af" : "#374151",
            cursor: isPending ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          辞退
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>{error}</p>}
    </div>
  );
}
