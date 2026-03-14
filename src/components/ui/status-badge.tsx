type StatusBadgeProps = {
  status: string;
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:      { bg: "#f3f4f6", color: "#6b7280",  label: "審査中" },
  interviewing: { bg: "#eff6ff", color: "#2563eb",  label: "面接中" },
  probation:    { bg: "#fefce8", color: "#ca8a04",  label: "試用期間" },
  hired:        { bg: "#f0fdf4", color: "#16a34a",  label: "採用済み" },
  rejected:     { bg: "#fef2f2", color: "#dc2626",  label: "不採用" },
  open:         { bg: "#f0fdf4", color: "#16a34a",  label: "募集中" },
  closed:       { bg: "#f3f4f6", color: "#6b7280",  label: "募集終了" },
  filled:       { bg: "#eff6ff", color: "#2563eb",  label: "採用済み" },
  active:       { bg: "#f0fdf4", color: "#16a34a",  label: "稼働中" },
  inactive:     { bg: "#f3f4f6", color: "#6b7280",  label: "休職中" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { bg: "#f3f4f6", color: "#6b7280", label: status };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 99,
        backgroundColor: config.bg,
        color: config.color,
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}
