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

  const sectionTitle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #e5e7eb",
  };

  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: "1px solid #f3f4f6",
  };

  const label: React.CSSProperties = {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 500,
  };

  const value: React.CSSProperties = {
    fontSize: 14,
    color: "#111827",
    fontWeight: 500,
  };

  return (
    <div
      style={{
        padding: "48px 24px",
        maxWidth: 680,
        margin: "0 auto",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <Link
          href="/dashboard/company"
          style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}
        >
          ← ダッシュボードに戻る
        </Link>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3b82f6", marginBottom: 6 }}>
          Company
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>
          設定
        </h1>
      </div>

      {/* アカウント情報 */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <h2 style={sectionTitle}>アカウント情報</h2>
        <div style={row}>
          <span style={label}>会社名</span>
          <span style={value}>{company.name}</span>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <span style={label}>メールアドレス</span>
          <span style={value}>{user.email}</span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            marginTop: 16,
            padding: "10px 14px",
            background: "#f9fafb",
            borderRadius: 8,
          }}
        >
          ℹ️ 会社名・メールアドレスの変更はPost-MVPで対応予定です
        </p>
      </div>

      {/* 通知設定（準備中） */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>通知設定</h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 99,
              background: "#e5e7eb",
              color: "#6b7280",
            }}
          >
            準備中
          </span>
        </div>
        <div style={row}>
          <span style={label}>スカウト承諾通知</span>
          <span style={{ ...value, color: "#9ca3af" }}>未設定</span>
        </div>
        <div style={row}>
          <span style={label}>応募通知</span>
          <span style={{ ...value, color: "#9ca3af" }}>未設定</span>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <span style={label}>面接完了通知</span>
          <span style={{ ...value, color: "#9ca3af" }}>未設定</span>
        </div>
      </div>

      {/* 請求情報（準備中） */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "20px 24px",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ ...sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>請求情報</h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 99,
              background: "#e5e7eb",
              color: "#6b7280",
            }}
          >
            準備中
          </span>
        </div>
        <div style={row}>
          <span style={label}>現在のプラン</span>
          <span style={{ ...value, color: "#9ca3af" }}>Free</span>
        </div>
        <div style={{ ...row, borderBottom: "none" }}>
          <span style={label}>お支払い方法</span>
          <span style={{ ...value, color: "#9ca3af" }}>未設定</span>
        </div>
      </div>
    </div>
  );
}
