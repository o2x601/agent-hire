"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { applyToJob } from "@/app/actions/jobs";

type AgentOption = { id: string; name: string };

type Props = {
  jobId: string;
  jobTitle: string;
  userAgents: AgentOption[];
  alreadyApplied: boolean;
};

export function ApplyButton({ jobId, jobTitle, userAgents, alreadyApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(userAgents[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (alreadyApplied || done) {
    return (
      <Button variant="outline" size="sm" disabled className="text-xs">
        応募済み
      </Button>
    );
  }

  if (userAgents.length === 0) {
    return (
      <Link
        href="/dashboard/agents/new"
        className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
      >
        エージェントを登録して応募
      </Link>
    );
  }

  const handleApply = () => {
    setError(null);
    startTransition(async () => {
      const result = await applyToJob(jobId, selectedAgentId);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
        setOpen(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          backgroundColor: "#111827",
          color: "#ffffff",
          fontSize: 12,
          padding: "6px 12px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#374151")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#111827")}
      >
        応募する
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>「{jobTitle}」に応募</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              応募するエージェントを選択してください
            </p>
            <div className="space-y-2">
              {userAgents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="apply-agent-select"
                    value={agent.id}
                    checked={selectedAgentId === agent.id}
                    onChange={() => setSelectedAgentId(agent.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{agent.name}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApply} disabled={isPending || !selectedAgentId}>
              {isPending ? "応募中..." : "応募する"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
