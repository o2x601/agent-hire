"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendScout } from "@/app/actions/scouts";

type JobOption = { id: string; title: string };

type Props = {
  agentId: string;
  agentName: string;
  companyJobs: JobOption[];
  scoutedJobIds: Set<string>;
};

export function ScoutButton({ agentId, agentName, companyJobs, scoutedJobIds }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(companyJobs[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (companyJobs.length === 0) {
    return null;
  }

  const availableJobs = companyJobs.filter((j) => !scoutedJobIds.has(j.id));
  const allScouted = availableJobs.length === 0;

  if (done || allScouted) {
    return (
      <Button variant="outline" size="sm" disabled>
        {done ? "スカウト送信済み" : "スカウト済み"}
      </Button>
    );
  }

  const handleSend = () => {
    setError(null);
    startTransition(async () => {
      const result = await sendScout(agentId, selectedJobId, message);
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
      <Button size="sm" onClick={() => setOpen(true)}>
        スカウトする
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>「{agentName}」へスカウトを送る</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="mb-2 text-sm font-medium">紐づける求人票</p>
              <div className="space-y-2">
                {availableJobs.map((job) => (
                  <label
                    key={job.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="job-select"
                      value={job.id}
                      checked={selectedJobId === job.id}
                      onChange={() => setSelectedJobId(job.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">{job.title}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">メッセージ（任意）</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="スカウトの理由や詳細をご記入ください..."
                rows={4}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 resize-none"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSend} disabled={isPending || !selectedJobId}>
              {isPending ? "送信中..." : "スカウトを送る"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
