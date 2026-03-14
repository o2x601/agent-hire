"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        padding: "48px 24px",
        maxWidth: 520,
        margin: "0 auto",
        fontFamily: "'DM Sans', 'Noto Sans JP', -apple-system, sans-serif",
      }}
    >
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#3B82F6",
            marginBottom: 12,
          }}
        >
          企業プロフィール設定
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#E2EAF4",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          会社情報を登録してください
        </h1>
        <p style={{ color: "#7A8FA8", fontSize: 14, marginTop: 8 }}>
          ダッシュボードを利用するには会社プロフィールが必要です
        </p>
      </div>

      <div
        style={{
          background: "#0C1019",
          border: "1px solid #1E2A3A",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label
              htmlFor="name"
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#7A8FA8", marginBottom: 8 }}
            >
              会社名 <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="株式会社〇〇"
              style={{
                width: "100%",
                height: 44,
                background: "#070D14",
                border: "1px solid #1E2A3A",
                borderRadius: 10,
                padding: "0 14px",
                fontSize: 14,
                color: "#E2EAF4",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#7A8FA8", marginBottom: 8 }}
            >
              業種
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="IT・ソフトウェア、金融、製造業など"
              style={{
                width: "100%",
                height: 44,
                background: "#070D14",
                border: "1px solid #1E2A3A",
                borderRadius: 10,
                padding: "0 14px",
                fontSize: 14,
                color: "#E2EAF4",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="website"
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#7A8FA8", marginBottom: 8 }}
            >
              Webサイト
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              style={{
                width: "100%",
                height: 44,
                background: "#070D14",
                border: "1px solid #1E2A3A",
                borderRadius: 10,
                padding: "0 14px",
                fontSize: 14,
                color: "#E2EAF4",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#7A8FA8", marginBottom: 8 }}
            >
              会社概要
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="会社の事業内容や特徴を入力してください"
              rows={4}
              style={{
                width: "100%",
                background: "#070D14",
                border: "1px solid #1E2A3A",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                color: "#E2EAF4",
                outline: "none",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#2D1515",
                border: "1px solid #EF444440",
                borderRadius: 8,
                fontSize: 13,
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              height: 44,
              background:
                loading || !name.trim()
                  ? "#1E2A3A"
                  : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: loading || !name.trim() ? "#4A5A6A" : "#ffffff",
              cursor: loading || !name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "登録中..." : "ダッシュボードへ進む"}
          </button>
        </form>
      </div>
    </div>
  );
}
