import type { ElementType } from "react";

type StatCardProps = {
  icon: ElementType;
  label: string;
  value: number | string;
  accentColor?: string;
};

export function StatCard({ icon: Icon, label, value, accentColor = "#3b82f6" }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} style={{ color: accentColor }} />
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}
