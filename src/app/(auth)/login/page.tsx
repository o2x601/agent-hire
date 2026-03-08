"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;
    router.push(role === "company" ? "/agents" : "/dashboard");
  }

  return (
    <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>
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
          アカウントにログイン
        </p>
      </div>

      {/* Card */}
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
            </label>
            <input
              id="password"
              type="password"
              required
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
              background: loading ? "#1B2333" : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: loading ? "#7A8FA8" : "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#7A8FA8" }}>
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 500 }}
        >
          新規登録
        </Link>
      </p>
    </div>
  );
}
