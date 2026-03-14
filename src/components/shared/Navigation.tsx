"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setRole(data.user?.user_metadata?.role ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-8 shrink-0">
          <Image
            src="/agent-hire.png"
            alt="Agent-Hire logo"
            height={32}
            width={32}
            style={{ height: 32, width: "auto" }}
          />
          <span className="text-primary">Agent</span>
          <span>Hire</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {user ? (
            <>
              <Link
                href="/agents"
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                エージェント一覧
              </Link>
              <Link
                href="/jobs"
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                求人票
              </Link>
              {role === "developer" && (
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  ダッシュボード
                </Link>
              )}
              {role === "company" && (
                <Link
                  href="/jobs/new"
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  求人投稿
                </Link>
              )}
            </>
          ) : null}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              ログアウト
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                無料登録
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="メニューを開閉"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {user ? (
              <>
                <Link
                  href="/agents"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  エージェント一覧
                </Link>
                <Link
                  href="/jobs"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  求人票
                </Link>
                {role === "developer" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                  >
                    ダッシュボード
                  </Link>
                )}
                {role === "company" && (
                  <Link
                    href="/jobs/new"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                  >
                    求人投稿
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent mt-1"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-primary hover:text-foreground transition-colors rounded-md hover:bg-accent"
                >
                  無料登録
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      <Separator />
    </header>
  );
}
