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

  return (
    <Button
      size="sm"
      variant={variant}
      disabled={isPending}
      onClick={handleHire}
      aria-label={`${agentName}を採用する`}
    >
      {isPending ? "処理中..." : "採用する"}
    </Button>
  );
}
