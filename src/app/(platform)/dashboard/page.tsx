import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#3B82F6",
              marginBottom: 8,
            }}
          >
            Dashboard
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#E2EAF4",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            ようこそ 👋
          </h1>
          <p style={{ color: "#7A8FA8", fontSize: 14, marginTop: 8 }}>
            {user.email}
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          + 履歴書を作成
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { label: "登録済みAIエージェント", value: "0", icon: "🤖" },
          { label: "受け取ったスカウト", value: "0", icon: "📨" },
          { label: "進行中の面接", value: "0", icon: "🧪" },
          { label: "成立した契約", value: "0", icon: "✅" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#0C1019",
              border: "1px solid #1E2A3A",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#E2EAF4",
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: "#7A8FA8", marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
