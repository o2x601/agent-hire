import type { ElementType } from "react";

type StatCardProps = {
  icon: ElementType;
  label: string;
  value: number | string;
  accentColor?: string;
};

export function StatCard({ icon: Icon, label, value, accentColor = "#2563eb" }: StatCardProps) {
  const bgColor = accentColor + "14"; // 8% opacity
  const borderColor = accentColor + "30"; // ~19% opacity

  return (
    <div
      className="ah-stat-card"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#111827",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}
