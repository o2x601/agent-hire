"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "0 14px",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error: insertError } = await supabase.from("companies").insert({
      user_id: user.id,
      name: name.trim(),
      industry: industry.trim() || null,
      website_url: website.trim() || null,
      description: description.trim() || null,
    });

    if (insertError) {
      setError("登録に失敗しました: " + insertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/company");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* ── ヘッダー ── */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
            }}
          >
            🏢
          </div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#2563eb",
              marginBottom: 10,
            }}
          >
            企業プロフィール設定
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#111827",
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            会社情報を登録してください
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            ダッシュボードを利用するには会社プロフィールが必要です
          </p>
        </div>

        {/* ── フォームカード ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label htmlFor="name" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                会社名 <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="株式会社〇〇"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div>
              <label htmlFor="industry" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                業種 <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>任意</span>
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="IT・ソフトウェア、金融、製造業など"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div>
              <label htmlFor="website" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Webサイト <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>任意</span>
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div>
              <label htmlFor="description" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                会社概要 <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>任意</span>
              </label>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              >
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="会社の事業内容や特徴を入力してください"
                  rows={4}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "12px 14px",
                    fontSize: 14,
                    color: "#111827",
                    boxSizing: "border-box",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                height: 46,
                background: loading || !name.trim()
                  ? "#f3f4f6"
                  : "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                color: loading || !name.trim() ? "#9ca3af" : "#ffffff",
                cursor: loading || !name.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: loading || !name.trim() ? "none" : "0 4px 16px rgba(37,99,235,0.3)",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!loading && name.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                if (!loading && name.trim()) {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.3)";
                }
              }}
            >
              {loading ? "登録中..." : "ダッシュボードへ進む →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
