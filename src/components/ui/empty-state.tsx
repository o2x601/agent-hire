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
        paddingTop: 80,
        paddingBottom: 80,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 12,
        textAlign: "center",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <p style={{ fontSize: 40 }}>{icon}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 360 }}>{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          style={{
            display: "inline-flex",
            alignItems: "center",
            marginTop: 8,
            padding: "8px 20px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "#111827",
            textDecoration: "none",
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
