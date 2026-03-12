import type { TrackRecord } from "@/schemas/agent";

type TrackRecordBadgeProps = {
  trackRecord: TrackRecord;
};

export function TrackRecordBadge({ trackRecord }: TrackRecordBadgeProps) {
  const uptimeColor =
    trackRecord.uptime_percentage >= 99
      ? "text-green-600"
      : trackRecord.uptime_percentage >= 95
        ? "text-yellow-600"
        : "text-red-600";

  const items = [
    {
      label: "稼働率",
      value: `${trackRecord.uptime_percentage.toFixed(1)}%`,
      valueClass: uptimeColor,
    },
    {
      label: "処理数",
      value: trackRecord.total_processed.toLocaleString(),
      valueClass: "text-foreground",
    },
    {
      label: "応答",
      value: `${trackRecord.avg_response_ms}ms`,
      valueClass: "text-foreground",
    },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, fontSize: 12, color: "var(--muted-foreground)" }}>
      {items.map((item, i) => (
        <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {i > 0 && (
            <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
          )}
          <span>
            {item.label}:{" "}
            <span style={{ fontWeight: 600 }} className={item.valueClass}>
              {item.value}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
