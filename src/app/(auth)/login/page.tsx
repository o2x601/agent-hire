"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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

    // router.push() はソフトナビゲーションのため、Cookie がミドルウェアに
    // 届く前にリダイレクトが走り、ローディングが止まらなくなる場合がある。
    // window.location.href でハードナビゲーションすることで確実にセッションを確立する。
    const role = data.user?.user_metadata?.role;
    window.location.href = role === "company" ? "/dashboard/company" : "/dashboard";
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
              background: "linear-gradient(135deg, var(--primary) 0%, #8B5CF6 100%)",
              borderRadius: 8,
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            Agent-Hire
          </span>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
          アカウントにログイン
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)", marginBottom: 8 }}
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
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "0 14px",
                fontSize: 14,
                color: "var(--foreground)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)", marginBottom: 8 }}
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
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "0 14px",
                fontSize: 14,
                color: "var(--foreground)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--destructive)",
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
                ? "var(--muted)"
                : "linear-gradient(135deg, var(--primary) 0%, #2563EB 100%)",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: loading ? "var(--muted-foreground)" : "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid var(--muted-foreground)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.75s linear infinite",
                  }}
                />
                ログイン中...
              </>
            ) : "ログイン"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted-foreground)" }}>
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
        >
          新規登録
        </Link>
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
