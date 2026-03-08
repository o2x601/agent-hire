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

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>
        稼働率:{" "}
        <span className={`font-semibold ${uptimeColor}`}>
          {trackRecord.uptime_percentage.toFixed(1)}%
        </span>
      </span>
      <span>
        処理数:{" "}
        <span className="font-semibold text-foreground">
          {trackRecord.total_processed.toLocaleString()}
        </span>
      </span>
      <span>
        応答:{" "}
        <span className="font-semibold text-foreground">
          {trackRecord.avg_response_ms}ms
        </span>
      </span>
    </div>
  );
}
