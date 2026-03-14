"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type HireButtonProps = {
  agentId: string;
  agentName: string;
  variant?: "default" | "outline";
};

export function HireButton({
  agentId,
  agentName,
  variant = "default",
}: HireButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function handleHire() {
    setIsPending(true);
    try {
      // TODO: Phase2でスカウト/採用フローを実装
      await new Promise((r) => setTimeout(r, 500));
      window.location.href = `/agents/${agentId}?action=hire`;
    } finally {
      setIsPending(false);
    }
  }

  if (variant === "outline") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={(e) => { e.stopPropagation(); handleHire(); }}
        aria-label={`${agentName}を採用する`}
      >
        {isPending ? "処理中..." : "採用する"}
      </Button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={(e) => { e.stopPropagation(); handleHire(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${agentName}を採用する`}
      style={{
        backgroundColor: isPending ? "#9ca3af" : hovered ? "#1f2937" : "#111827",
        color: "white",
        fontSize: "12px",
        padding: "6px 12px",
        borderRadius: "8px",
        border: "none",
        cursor: isPending ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        transition: "background-color 150ms ease",
      }}
    >
      {isPending ? "処理中..." : "採用する"}
    </button>
  );
}
