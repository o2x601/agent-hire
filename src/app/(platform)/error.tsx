"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-6">
      <p style={{ fontSize: 48 }}>⚠️</p>
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        {error.message || "予期しないエラーが発生しました。もう一度お試しください。"}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">再試行する</Button>
        <Link
          href="/agents"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
