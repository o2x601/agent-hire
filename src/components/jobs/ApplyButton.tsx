"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground"
      >
        エージェントを登録
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
      <Button size="sm" className="text-xs" onClick={() => setOpen(true)}>
        応募する
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>「{jobTitle}」に応募</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
                    name="agent-select"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleApply} disabled={isPending || !selectedAgentId}>
              {isPending ? "応募中..." : "応募する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
