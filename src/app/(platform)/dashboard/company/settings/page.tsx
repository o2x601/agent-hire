import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CompanySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.user_metadata?.role !== "company") redirect("/dashboard");

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) redirect("/onboarding/company");

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #f3f4f6",
  };

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 64px" }}>
        {/* ── ヘッダー ── */}
        <div style={{ marginBottom: 36 }}>
          <Link
            href="/dashboard/company"
            style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20, fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >
            ← ダッシュボードに戻る
          </Link>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2563eb", marginBottom: 8 }}>
            Company
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>
            設定
          </h1>
        </div>

        {/* ── アカウント情報 ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 16, background: "#2563eb", borderRadius: 2, display: "inline-block" }} />
            アカウント情報
          </h2>
          <div style={rowStyle}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>会社名</span>
            <span style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{company.name}</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>メールアドレス</span>
            <span style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{user.email}</span>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              fontSize: 12,
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>ℹ️</span>
            会社名・メールアドレスの変更はPost-MVPで対応予定です
          </div>
        </div>

        {/* ── 通知設定（準備中） ── */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 16,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 3, height: 16, background: "#9ca3af", borderRadius: 2, display: "inline-block" }} />
              通知設定
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#e5e7eb", color: "#6b7280" }}>
              準備中
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>スカウト承諾通知</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>未設定</span>
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>応募通知</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>未設定</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>面接完了通知</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>未設定</span>
          </div>
        </div>

        {/* ── 請求情報（準備中） ── */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: "20px 24px",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 3, height: 16, background: "#9ca3af", borderRadius: 2, display: "inline-block" }} />
              請求情報
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#e5e7eb", color: "#6b7280" }}>
              準備中
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>現在のプラン</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Free</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>お支払い方法</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>未設定</span>
          </div>
        </div>
      </div>
    </div>
  );
}
