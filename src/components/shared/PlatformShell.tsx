"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Mail,
  Settings,
  Bot,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const companyNav: NavItem[] = [
  { icon: LayoutDashboard, label: "ダッシュボード",       href: "/dashboard/company" },
  { icon: Briefcase,       label: "求人管理",             href: "/jobs" },
  { icon: Search,          label: "エージェントを探す",   href: "/agents" },
  { icon: Mail,            label: "スカウト管理",         href: "#" },
  { icon: Settings,        label: "設定",                 href: "#" },
];

const developerNav: NavItem[] = [
  { icon: LayoutDashboard, label: "ダッシュボード",       href: "/dashboard" },
  { icon: Bot,             label: "登録エージェント",     href: "/agents/register" },
  { icon: Search,          label: "求人を探す",           href: "/jobs" },
  { icon: Mail,            label: "スカウト・応募",       href: "#" },
  { icon: Settings,        label: "設定",                 href: "#" },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser]       = useState<User | null>(null);
  const [role, setRole]       = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false); // PC sidebar collapsed
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile sidebar open

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
    return () => listener.subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile overlay is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const navItems = role === "company" ? companyNav : developerNav;
  const initials  = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";
  const displayName = user?.user_metadata?.name ?? user?.email ?? "";

  const EXPANDED_W = 240;
  const COLLAPSED_W = 64;
  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <div style={{ overflowX: "hidden", position: "relative" }}>
      {/* ── Mobile hamburger (outside sidebar, shown on mobile only) ─ */}
      {!mobileOpen && (
        <button
          onClick={() => { setMobileOpen(true); setCollapsed(false); }}
          aria-label="メニューを開く"
          className="platform-mobile-hamburger"
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "#111111",
            border: "1px solid #222222",
            color: "#e5e5e5",
            cursor: "pointer",
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="platform-mobile-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* ── Sidebar wrapper (clips translateX animation) ────────── */}
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        className="platform-sidebar-wrapper"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          overflow: "hidden",
          width: sidebarW,
          transition: "width 200ms ease",
          pointerEvents: "none",
        }}
      >
      <aside
        className={`platform-sidebar${mobileOpen ? " mobile-open" : ""}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          background: "#111111",
          borderRight: "1px solid #222222",
          color: "#e5e5e5",
          overflow: "hidden",
          overflowX: "hidden",
          width: sidebarW,
          transition: "transform 200ms ease",
          pointerEvents: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 56,
            padding: "0 12px",
            gap: 8,
            borderBottom: "1px solid #222222",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => { setCollapsed((c) => !c); setMobileOpen(false); }}
            aria-label="サイドバーを開閉"
            className="platform-sidebar-toggle"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: "#e5e5e5",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>

          {!collapsed && (
            <Link
              href="/"
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#e5e5e5",
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ color: "#3b82f6" }}>Agent</span>
              <span> Hire</span>
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href !== "#" && pathname === item.href;
            return (
              <div
                key={item.href + item.label}
                style={{ position: "relative" }}
                className="platform-nav-item"
              >
                <Link
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed ? "9px 10px" : "9px 12px",
                    borderRadius: 6,
                    marginBottom: 2,
                    color: isActive ? "#ffffff" : "#a3a3a3",
                    background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    transition: "background 150ms, color 150ms",
                  }}
                  className="platform-nav-link"
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>

                {/* Tooltip (collapsed only) */}
                {collapsed && (
                  <span
                    className="platform-nav-tooltip"
                    style={{
                      position: "absolute",
                      left: "calc(100% + 8px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "#1f1f1f",
                      border: "1px solid #333",
                      color: "#e5e5e5",
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 4,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      opacity: 0,
                      zIndex: 100,
                      transition: "opacity 100ms",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div
          style={{
            borderTop: "1px solid #222222",
            padding: "12px 8px",
            flexShrink: 0,
          }}
        >
          {!collapsed && user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 12px",
                marginBottom: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#e5e5e5",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#737373",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {role === "company" ? "企業" : "AI運営者"}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="platform-logout-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: collapsed ? "9px 10px" : "9px 12px",
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: "#a3a3a3",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              transition: "background 150ms, color 150ms",
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>ログアウト</span>}
          </button>
        </div>
      </aside>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main
        className="platform-main"
        style={{
          marginLeft: sidebarW,
          padding: 32,
          minHeight: "100vh",
          overflowX: "hidden",
          transition: "margin-left 200ms ease",
        }}
      >
        {children}
      </main>

      {/* ── Global styles ────────────────────────────────────────── */}
      <style>{`
        html, body { overflow-x: hidden; }

        /* Hover effects */
        .platform-nav-link:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #ffffff !important;
        }
        .platform-logout-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #ffffff !important;
        }
        .platform-nav-item:hover .platform-nav-tooltip {
          opacity: 1 !important;
        }

        /* PC (≥1024px): sidebar always shown, toggle collapses width */
        @media (min-width: 1024px) {
          .platform-mobile-hamburger { display: none !important; }
          .platform-mobile-overlay   { display: none !important; }
          .platform-sidebar-toggle   { display: flex !important; }
        }

        /* Mobile (<1024px): sidebar hidden by default, slides in when open */
        @media (max-width: 1023px) {
          .platform-mobile-hamburger { display: flex !important; }
          .platform-sidebar-wrapper {
            width: 240px !important;
            pointer-events: none;
          }
          .platform-sidebar-wrapper:has(.mobile-open) {
            pointer-events: auto;
          }
          .platform-sidebar {
            width: 240px !important;
            transform: translateX(-100%);
          }
          .platform-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .platform-sidebar-toggle { display: flex !important; }
          .platform-main {
            margin-left: 0 !important;
            padding: 64px 16px 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
