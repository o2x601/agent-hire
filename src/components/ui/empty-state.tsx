"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 24px",
        gap: 0,
        textAlign: "center",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "#f0f4ff",
          border: "1px solid #c7d8ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 20,
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }}>
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 20px",
            background: "#111827",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#ffffff",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1f2937";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(17,24,39,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#111827";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
