"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "developer" | "company";

const roles: { value: Role; label: string; sub: string; icon: string }[] = [
  {
    value: "developer",
    label: "AIサービス運営者",
    sub: "AIエージェントの履歴書を登録し、企業からスカウトされる",
    icon: "🤖",
  },
  {
    value: "company",
    label: "企業・採用担当者",
    sub: "業務に合ったAIエージェントを見つけて採用する",
    icon: "🏢",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function selectRole(r: Role) {
    setRole(r);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px", textAlign: "center" }}>
        <div
          style={{
            background: "#0C1019",
            border: "1px solid #1E2A3A",
            borderRadius: 16,
            padding: 40,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#E2EAF4", marginBottom: 12 }}>
            確認メールを送信しました
          </h2>
          <p style={{ fontSize: 14, color: "#7A8FA8", lineHeight: 1.7 }}>
            <strong style={{ color: "#E2EAF4" }}>{email}</strong> に確認リンクを送りました。
            <br />
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "10px 24px",
              background: "#131A25",
              border: "1px solid #1E2A3A",
              borderRadius: 8,
              fontSize: 13,
              color: "#7A8FA8",
              textDecoration: "none",
            }}
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: step === "role" ? 560 : 420, padding: "0 16px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
              borderRadius: 8,
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#E2EAF4",
              letterSpacing: "-0.02em",
            }}
          >
            Agent-Hire
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#7A8FA8" }}>
          {step === "role" ? "ご利用目的を選択してください" : "アカウント情報を入力"}
        </p>
      </div>

      {/* Step: Role Selection */}
      {step === "role" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => selectRole(r.value)}
              style={{
                background: "#0C1019",
                border: "1px solid #1E2A3A",
                borderRadius: 16,
                padding: "24px 28px",
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.background = "#0F1620";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1E2A3A";
                e.currentTarget.style.background = "#0C1019";
              }}
            >
              <span style={{ fontSize: 36 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#E2EAF4", marginBottom: 4 }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 13, color: "#7A8FA8", lineHeight: 1.5 }}>
                  {r.sub}
                </div>
              </div>
              <div style={{ marginLeft: "auto", color: "#3A4D62", fontSize: 18 }}>→</div>
            </button>
          ))}

          <p style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "#7A8FA8" }}>
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 500 }}>
              ログイン
            </Link>
          </p>
        </div>
      )}

      {/* Step: Form */}
      {step === "form" && (
        <>
          {/* Role badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.28)",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                color: "#3B82F6",
              }}
            >
              {roles.find((r) => r.value === role)?.icon}{" "}
              {roles.find((r) => r.value === role)?.label}
              <button
                onClick={() => setStep("role")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7A8FA8",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: 0,
                  marginLeft: 4,
                }}
              >
                変更
              </button>
            </div>
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
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#7A8FA8", marginBottom: 8 }}
                >
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    height: 44,
                    background: "#131A25",
                    border: "1px solid #1E2A3A",
                    borderRadius: 10,
                    padding: "0 14px",
                    fontSize: 14,
                    color: "#E2EAF4",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2A3A")}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#7A8FA8", marginBottom: 8 }}
                >
                  パスワード
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#3A4D62" }}>（8文字以上）</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    height: 44,
                    background: "#131A25",
                    border: "1px solid #1E2A3A",
                    borderRadius: 10,
                    padding: "0 14px",
                    fontSize: 14,
                    color: "#E2EAF4",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2A3A")}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#EF4444",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 44,
                  background: loading
                    ? "#1B2333"
                    : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: loading ? "#7A8FA8" : "#ffffff",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "登録中..." : "アカウントを作成"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#7A8FA8" }}>
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 500 }}>
              ログイン
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
