"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
      <span className="text-sm font-medium" style={{ color: done === "accept" ? "#22c55e" : "#ef4444" }}>
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
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handle("accept")}
          disabled={isPending}
          className="text-xs"
        >
          承諾
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle("reject")}
          disabled={isPending}
          className="text-xs"
        >
          辞退
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
