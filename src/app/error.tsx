"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: "24px",
      textAlign: "center",
    }}>
      <p style={{ fontSize: 48 }}>⚠️</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)" }}>
        エラーが発生しました
      </h2>
      <p style={{ fontSize: 14, color: "var(--muted-foreground)", maxWidth: 400 }}>
        {error.message || "予期しないエラーが発生しました。もう一度お試しください。"}
      </p>
      <Button onClick={reset} variant="outline">
        再試行する
      </Button>
    </div>
  );
}
