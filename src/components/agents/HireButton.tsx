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
        onClick={handleHire}
        aria-label={`${agentName}を採用する`}
      >
        {isPending ? "処理中..." : "採用する"}
      </Button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={handleHire}
      aria-label={`${agentName}を採用する`}
      className="bg-black text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {isPending ? "処理中..." : "採用する"}
    </button>
  );
}
