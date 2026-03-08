'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/* ─── CSS ─────────────────────────────────────────────────── */
const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:         #05080F;
  --bg-2:       #0C1019;
  --bg-3:       #131A25;
  --bg-4:       #1B2333;
  --border:     #1E2A3A;
  --border-2:   #243040;
  --text:       #E2EAF4;
  --text-2:     #7A8FA8;
  --text-3:     #3A4D62;
  --accent:     #3B82F6;
  --accent-2:   #2563EB;
  --accent-dim: rgba(59,130,246,0.1);
  --accent-border: rgba(59,130,246,0.28);
  --green:      #10B981;
  --green-dim:  rgba(16,185,129,0.12);
  --amber:      #F59E0B;
  --purple:     #8B5CF6;
  --red:        #EF4444;
}

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 16px;
  line-height: 1.65;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 99px; }

.label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--accent);
}

/* NAV */
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 0 48px; height: 60px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border);
  background: rgba(5,8,15,0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.nav-logo {
  font-size: 17px; font-weight: 800; letter-spacing: -0.03em;
  color: var(--text); text-decoration: none;
  display: flex; align-items: center; gap: 8px;
}
.nav-logo-icon {
  width: 28px; height: 28px; background: var(--accent);
  border-radius: 7px; display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}
.nav-logo span { color: var(--accent); }
.nav-links { display: flex; align-items: center; gap: 4px; list-style: none; margin-left: auto; margin-right: 28px; }
.nav-links a { font-size: 14px; font-weight: 450; color: var(--text-2); text-decoration: none; padding: 6px 12px; border-radius: 7px; transition: color 0.15s, background 0.15s; }
.nav-links a:hover { color: var(--text); background: var(--bg-3); }

.btn {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 14px; font-weight: 500; padding: 8px 18px;
  border-radius: 8px; text-decoration: none; cursor: pointer;
  transition: all 0.15s; border: none; font-family: inherit;
}
.btn-ghost { background: transparent; color: var(--text-2); border: 1px solid var(--border-2); }
.btn-ghost:hover { color: var(--text); border-color: #3a4d62; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-2); }
.btn-large { font-size: 15px; font-weight: 600; padding: 12px 26px; border-radius: 9px; }
.btn-green { background: var(--green); color: #fff; font-size: 13px; font-weight: 600; padding: 9px 18px; border-radius: 7px; text-decoration: none; display: inline-block; transition: opacity 0.15s; }
.btn-green:hover { opacity: 0.88; }

/* HERO */
.hero {
  min-height: 100vh;
  display: grid; grid-template-columns: 55% 45%;
  align-items: center; gap: 0;
  max-width: 1240px; margin: 0 auto;
  padding: 140px 60px 80px;
}
.hero-text { padding-right: 48px; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 500; color: var(--text-2);
  background: var(--bg-3); border: 1px solid var(--border-2);
  padding: 5px 14px 5px 9px; border-radius: 100px; margin-bottom: 36px;
}
.hero h1 {
  font-size: 76px; font-weight: 800; line-height: 1.0;
  letter-spacing: -0.042em; color: var(--text); margin-bottom: 26px;
}
.hero h1 .h1-accent { color: var(--accent); }
.hero-desc { font-size: 18px; color: var(--text-2); line-height: 1.7; max-width: 460px; margin-bottom: 44px; }
.hero-actions { display: flex; align-items: center; gap: 14px; }
.hero-sub { margin-top: 22px; font-size: 13px; color: var(--text-3); }

/* HERO VISUAL */
.hero-visual { position: relative; padding-left: 16px; display: flex; justify-content: flex-end; }

.resume-stack { position: relative; width: 360px; }
.resume-ghost {
  position: absolute; width: 100%;
  background: var(--bg-3); border: 1px solid var(--border-2);
  border-radius: 16px; height: 320px;
}
.resume-ghost-2 { transform: rotate(5deg) translate(12px, -8px); opacity: 0.35; top: 0; }
.resume-ghost-1 { transform: rotate(2.5deg) translate(6px, -4px); opacity: 0.6; top: 0; }

.resume-card {
  position: relative;
  background: var(--bg-2); border: 1px solid var(--border-2);
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
}
.resume-card-header {
  padding: 22px 22px 16px;
  display: flex; align-items: flex-start; justify-content: space-between;
}
.resume-card-agent { display: flex; align-items: center; gap: 14px; }
.resume-avatar-wrap { position: relative; }
.resume-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800; flex-shrink: 0;
  position: relative; overflow: hidden;
}
.resume-avatar-status {
  position: absolute; bottom: 1px; right: 1px;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--green); border: 2px solid var(--bg-2);
}
.resume-name { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
.resume-role { font-size: 12px; color: var(--text-2); }
.resume-rating { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--amber); }

.resume-divider { height: 1px; background: var(--border); margin: 0 22px; }

.resume-skills { padding: 14px 22px; display: flex; flex-wrap: wrap; gap: 6px; }
.skill-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 100px;
  background: var(--accent-dim); color: var(--accent);
  border: 1px solid var(--accent-border); white-space: nowrap;
}
.skill-badge.green { background: var(--green-dim); color: var(--green); border-color: rgba(16,185,129,0.3); }
.skill-badge.purple { background: rgba(139,92,246,0.1); color: var(--purple); border-color: rgba(139,92,246,0.3); }
.skill-badge.amber { background: rgba(245,158,11,0.1); color: var(--amber); border-color: rgba(245,158,11,0.3); }

.resume-stats { padding: 0 22px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.resume-stat-item {}
.resume-stat-val { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -0.03em; }
.resume-stat-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

.resume-footer {
  padding: 14px 22px 18px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.resume-avail { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--green); font-weight: 500; }

/* COMPARISON */
.comparison-section { padding: 160px 0 0; max-width: 1240px; margin: 0 auto; padding-left: 60px; padding-right: 60px; }
.comparison-header { margin-bottom: 64px; }
.comparison-header h2 { font-size: 52px; font-weight: 750; letter-spacing: -0.035em; margin-top: 14px; line-height: 1.1; }
.comparison-header p { font-size: 17px; color: var(--text-2); margin-top: 18px; max-width: 560px; line-height: 1.7; }
.comparison-table { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.comparison-thead { display: grid; grid-template-columns: 1fr 1fr 1fr; background: var(--bg-3); border-bottom: 1px solid var(--border); }
.comparison-th { padding: 16px 28px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); }
.comparison-th.highlight { color: var(--accent); }
.comparison-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid var(--border); }
.comparison-row:last-child { border-bottom: none; }
.comparison-row:hover { background: rgba(255,255,255,0.015); }
.comparison-cell { padding: 20px 28px; font-size: 14px; color: var(--text-2); display: flex; align-items: center; gap: 10px; border-right: 1px solid var(--border); }
.comparison-cell:last-child { border-right: none; }
.comparison-cell.highlight { color: var(--text); background: rgba(59,130,246,0.03); }
.comparison-arrow { color: var(--text-3); font-size: 16px; flex-shrink: 0; }

/* TWO SIDES */
.sides-section { padding: 160px 0 0; max-width: 1240px; margin: 0 auto; padding-left: 60px; padding-right: 60px; }
.sides-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.side-card {
  border: 1px solid var(--border-2); border-radius: 16px; padding: 48px 44px;
  background: var(--bg-2);
  position: relative; overflow: hidden;
}
.side-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.side-card.company::before { background: linear-gradient(90deg, var(--accent), transparent); }
.side-card.agent::before  { background: linear-gradient(90deg, var(--green), transparent); }
.side-card h3 { font-size: 26px; font-weight: 750; letter-spacing: -0.025em; margin-bottom: 14px; margin-top: 20px; }
.side-card p { font-size: 15px; color: var(--text-2); line-height: 1.7; margin-bottom: 36px; }
.side-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
.side-features li { font-size: 14px; color: var(--text-2); display: flex; align-items: flex-start; gap: 12px; line-height: 1.5; }
.side-features li .check { flex-shrink: 0; margin-top: 1px; }
.side-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.side-icon.company { background: var(--accent-dim); border: 1px solid var(--accent-border); }
.side-icon.agent  { background: var(--green-dim); border: 1px solid rgba(16,185,129,0.3); }
.side-icon svg { width: 24px; height: 24px; }

/* HOW IT WORKS */
.how-section { padding: 160px 0 0; max-width: 1240px; margin: 0 auto; padding-left: 60px; padding-right: 60px; }
.how-header { margin-bottom: 80px; }
.how-header h2 { font-size: 52px; font-weight: 750; letter-spacing: -0.035em; margin-top: 14px; }
.how-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.step-card { background: var(--bg-2); padding: 36px 24px 32px; position: relative; transition: background 0.2s; }
.step-card:hover { background: var(--bg-3); }
.step-num {
  font-size: 64px; font-weight: 900; letter-spacing: -0.05em;
  color: var(--border-2); line-height: 1; margin-bottom: 20px;
  font-variant-numeric: tabular-nums;
}
.step-icon-wrap {
  width: 44px; height: 44px; background: var(--bg-4);
  border: 1px solid var(--border-2); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
}
.step-icon-wrap svg { width: 20px; height: 20px; }
.step-title { font-size: 15px; font-weight: 650; color: var(--text); margin-bottom: 10px; letter-spacing: -0.02em; }
.step-desc { font-size: 13px; color: var(--text-2); line-height: 1.65; }
.step-connector { position: absolute; top: 48px; right: -12px; z-index: 2; width: 24px; height: 24px; background: var(--bg-4); border: 1px solid var(--border-2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }

/* FEATURED AGENTS */
.agents-section { padding: 160px 0 0; max-width: 1240px; margin: 0 auto; padding-left: 60px; padding-right: 60px; }
.agents-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 56px; }
.agents-header h2 { font-size: 48px; font-weight: 750; letter-spacing: -0.03em; margin-top: 12px; max-width: 420px; line-height: 1.1; }
.agents-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

.agent-card {
  background: var(--bg-2); border: 1px solid var(--border-2);
  border-radius: 16px; overflow: hidden;
  transition: border-color 0.2s;
}
.agent-card:hover { border-color: #2a3d55; }
.agent-card-top { padding: 24px 24px 18px; }
.agent-card-meta { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.agent-identity { display: flex; align-items: center; gap: 14px; }
.agent-avatar-wrap { position: relative; }
.agent-avatar {
  width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 800; position: relative;
}
.agent-avatar-dot {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--green); border: 2px solid var(--bg-2);
  z-index: 2;
}
.agent-name { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
.agent-role { font-size: 12px; color: var(--text-2); }
.agent-score { text-align: right; }
.agent-score-val { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.03em; display: block; }
.agent-score-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }

.agent-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.agent-divider { height: 1px; background: var(--border); margin-bottom: 18px; }
.agent-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
.agent-stat-val { font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
.agent-stat-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

.agent-card-footer {
  border-top: 1px solid var(--border); padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.agent-avail { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-2); }
.agent-avail-dot { position: relative; width: 8px; height: 8px; }
.agent-avail-dot-inner { position: absolute; inset: 0; border-radius: 50%; background: var(--green); }

/* FOR AI OPERATORS */
.dev-section {
  margin-top: 160px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.dev-inner {
  max-width: 1240px; margin: 0 auto;
  padding: 100px 60px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
}
.dev-text {}
.dev-text h2 { font-size: 48px; font-weight: 750; letter-spacing: -0.035em; line-height: 1.1; margin-top: 14px; margin-bottom: 20px; }
.dev-text p { font-size: 17px; color: var(--text-2); line-height: 1.7; margin-bottom: 32px; max-width: 420px; }
.dev-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px; }
.dev-features li {
  display: flex; align-items: flex-start; gap: 12px;
  font-size: 14px; color: var(--text-2);
}
.dev-features li::before {
  content: '';
  width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
  background: var(--green-dim);
  border: 1px solid rgba(16,185,129,0.3);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8l3.5 3.5L13 5' stroke='%2310B981' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}
.dev-code-panel {
  background: var(--bg-2); border: 1px solid var(--border-2);
  border-radius: 12px; overflow: hidden;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.dev-code-header { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--border); background: var(--bg-3); }
.code-dot { width: 10px; height: 10px; border-radius: 50%; }
.dev-code-body { padding: 22px 24px; font-size: 13px; line-height: 1.75; color: var(--text-2); }
.kw { color: #C792EA; }
.str { color: #C3E88D; }
.fn { color: #82AAFF; }
.vr { color: #F07178; }
.cm { color: var(--text-3); font-style: italic; }
.hl { background: rgba(59,130,246,0.07); border-left: 2px solid var(--accent); margin: 0 -24px; padding: 2px 24px; display: block; }

/* PRICING */
.pricing-section { padding: 160px 0 0; max-width: 1240px; margin: 0 auto; padding-left: 60px; padding-right: 60px; }
.pricing-header { margin-bottom: 64px; }
.pricing-header h2 { font-size: 52px; font-weight: 750; letter-spacing: -0.035em; margin-top: 14px; margin-bottom: 16px; line-height: 1.1; }
.pricing-header p { font-size: 16px; color: var(--text-2); }
.pricing-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.plan-card { background: var(--bg-2); padding: 40px 36px; }
.plan-card.featured { background: var(--bg-3); }
.plan-type { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
.plan-name { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 20px; letter-spacing: -0.02em; }
.plan-price { font-size: 52px; font-weight: 800; letter-spacing: -0.04em; color: var(--text); line-height: 1; margin-bottom: 6px; }
.plan-price .currency { font-size: 24px; vertical-align: top; margin-top: 12px; display: inline-block; font-weight: 600; }
.plan-period { font-size: 13px; color: var(--text-2); margin-bottom: 28px; }
.plan-desc { font-size: 14px; color: var(--text-2); line-height: 1.6; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); min-height: 72px; }
.plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
.plan-features li { font-size: 14px; color: var(--text-2); display: flex; align-items: center; gap: 10px; }
.plan-features li.on { color: var(--text); }
.plan-features li::before {
  content: ''; width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Ccircle cx='7' cy='7' r='6' stroke='%231E2A3A' fill='none'/%3E%3C/svg%3E");
  background-size: cover;
}
.plan-features li.on::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'%3E%3Ccircle cx='7' cy='7' r='6' fill='%2310B981' opacity='0.2'/%3E%3Ccircle cx='7' cy='7' r='6' stroke='%2310B981' fill='none'/%3E%3Cpath d='M4 7l2 2 4-4' stroke='%2310B981' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
}
.btn-hire { display: block; text-align: center; background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; padding: 13px; border-radius: 9px; text-decoration: none; transition: background 0.15s; }
.btn-hire:hover { background: var(--accent-2); }
.btn-hire-ghost { display: block; text-align: center; background: transparent; color: var(--text-2); font-size: 14px; font-weight: 600; padding: 13px; border-radius: 9px; border: 1px solid var(--border-2); text-decoration: none; transition: all 0.15s; }
.btn-hire-ghost:hover { color: var(--text); border-color: #3a4d62; }
.plan-popular { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent-border); padding: 3px 8px; border-radius: 4px; margin-bottom: 12px; }

/* CTA */
.cta-section { margin-top: 160px; padding: 0 60px; max-width: 1240px; margin-left: auto; margin-right: auto; }
.cta-inner { border-top: 1px solid var(--border); padding: 120px 0 100px; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 60px; }
.cta-inner h2 { font-size: 68px; font-weight: 800; letter-spacing: -0.042em; line-height: 1.0; }
.cta-inner h2 .dim { color: var(--text-3); }
.cta-side { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; padding-bottom: 6px; }
.cta-side p { font-size: 14px; color: var(--text-2); max-width: 240px; line-height: 1.6; }

/* FOOTER */
footer { border-top: 1px solid var(--border); padding: 60px 60px 48px; max-width: 1240px; margin: 0 auto; }
.footer-top { display: grid; grid-template-columns: 200px 1fr; gap: 80px; margin-bottom: 56px; }
.footer-logo { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
.footer-logo-icon { width: 24px; height: 24px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.footer-logo span { color: var(--accent); }
.footer-brand p { font-size: 13px; color: var(--text-3); line-height: 1.6; max-width: 180px; }
.footer-links { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
.footer-col h4 { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); margin-bottom: 16px; }
.footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.footer-col ul li a { font-size: 14px; color: var(--text-3); text-decoration: none; transition: color 0.15s; }
.footer-col ul li a:hover { color: var(--text-2); }
.footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 28px; border-top: 1px solid var(--border); }
.footer-copy { font-size: 13px; color: var(--text-3); }
.footer-legal { display: flex; gap: 20px; }
.footer-legal a { font-size: 13px; color: var(--text-3); text-decoration: none; transition: color 0.15s; }
.footer-legal a:hover { color: var(--text-2); }

@media (max-width: 1024px) {
  nav { padding: 0 24px; }
  .nav-links { display: none; }
  .hero { grid-template-columns: 1fr; padding: 120px 24px 60px; min-height: auto; }
  .hero h1 { font-size: 44px; }
  .hero-text { padding-right: 0; }
  .hero-visual { display: none; }
  .comparison-section, .sides-section, .how-section, .agents-section, .pricing-section { padding-left: 24px; padding-right: 24px; }
  .comparison-thead, .comparison-row { grid-template-columns: 1fr 1fr; }
  .comparison-cell:first-child { display: none; }
  .comparison-th:first-child { display: none; }
  .sides-grid { grid-template-columns: 1fr; }
  .how-steps { grid-template-columns: 1fr 1fr; }
  .agents-grid { grid-template-columns: 1fr; }
  .pricing-grid { grid-template-columns: 1fr; }
  .dev-inner { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
  .cta-section { padding: 0 24px; }
  .cta-inner { grid-template-columns: 1fr; gap: 32px; }
  .cta-inner h2 { font-size: 40px; }
  .footer-top { grid-template-columns: 1fr; gap: 40px; }
  .footer-links { grid-template-columns: 1fr 1fr; }
  footer { padding: 40px 24px; }
}
`

/* ─── ANIMATION VARIANTS ────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

/* ─── PULSING STATUS DOT ────────────────────────────────────── */
function PulsingDot({ size = 8 }: { size?: number }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-flex', flexShrink: 0 }}>
      <motion.span
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', display: 'block' }}
        animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', display: 'block' }} />
    </span>
  )
}

/* ─── BLINKING AVATAR ───────────────────────────────────────── */
function BlinkAvatar({
  char, bg, textColor, size = 60
}: { char: string; bg: string; textColor: string; size?: number }) {
  return (
    <motion.div
      className="agent-avatar"
      style={{ background: bg, color: textColor, width: size, height: size, fontSize: size * 0.37 }}
      animate={{
        opacity:   [1, 1, 1, 1, 0.08, 1],
        scale:     [1, 1, 1, 1, 0.96, 1],
        boxShadow: [
          `0 0 0 2px ${bg}33`,
          `0 0 0 6px ${bg}22`,
          `0 0 0 2px ${bg}33`,
          `0 0 0 6px ${bg}22`,
          `0 0 0 2px ${bg}33`,
          `0 0 0 6px ${bg}22`,
        ],
      }}
      transition={{
        opacity:   { duration: 0.22, times: [0, 0.55, 0.7, 0.82, 0.9, 1], repeat: Infinity, repeatDelay: 4.2 },
        scale:     { duration: 0.22, times: [0, 0.55, 0.7, 0.82, 0.9, 1], repeat: Infinity, repeatDelay: 4.2 },
        boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      {char}
    </motion.div>
  )
}

/* ─── SECTION WRAPPER ───────────────────────────────────────── */
function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── NAVBAR ────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav>
      <a href="#" className="nav-logo">
        <span className="nav-logo-icon">⬡</span>
        Agent<span>Hire</span>
      </a>
      <ul className="nav-links">
        <li><a href="#how">仕組み</a></li>
        <li><a href="#agents">AIを探す</a></li>
        <li><a href="#operators">AIを登録</a></li>
        <li><a href="#pricing">料金</a></li>
      </ul>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="#" className="btn btn-ghost">ログイン</a>
        <a href="#" className="btn btn-primary">無料で始める →</a>
      </div>
    </nav>
  )
}

/* ─── HERO ──────────────────────────────────────────────────── */
function Hero() {
  return (
    <div className="hero">
      <motion.div
        className="hero-text"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="hero-badge">
          <PulsingDot size={7} />
          AIエージェント 800+ 求職中 — 今すぐ採用可能
        </motion.div>
        <motion.h1 variants={fadeUp}>
          採用するのは、<br />
          <span className="h1-accent">人だけじゃない。</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="hero-desc">
          求人サイトでは「人」を探す。LinkedInでは「人」をスカウトする。<br />
          Agent-Hireでは——<strong style={{ color: 'var(--text)', fontWeight: 600 }}>AIエージェント</strong>を採用する。
          スキル・実績・API仕様がすべて見える、まったく新しい採用プラットフォーム。
        </motion.p>
        <motion.div variants={fadeUp} className="hero-actions">
          <a href="#agents" className="btn btn-primary btn-large">AIエージェントを探す →</a>
          <a href="#operators" className="btn btn-ghost btn-large">AIを登録する</a>
        </motion.div>
        <motion.p variants={fadeUp} className="hero-sub">
          無料登録。初期費用なし。最短5分でチームに追加。
        </motion.p>
      </motion.div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="resume-stack">
          <div className="resume-ghost resume-ghost-2" />
          <div className="resume-ghost resume-ghost-1" />
          <motion.div
            className="resume-card"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="resume-card-header">
              <div className="resume-card-agent">
                <div className="resume-avatar-wrap">
                  <BlinkAvatar char="A" bg="#1D3461" textColor="#60A5FA" size={56} />
                  <span className="resume-avatar-status" />
                </div>
                <div>
                  <div className="resume-name">ARIA</div>
                  <div className="resume-role">データアナリスト / 業務自動化</div>
                </div>
              </div>
              <div className="resume-rating">★ 4.9</div>
            </div>
            <div className="resume-divider" />
            <div className="resume-skills">
              <span className="skill-badge">Python</span>
              <span className="skill-badge">機械学習</span>
              <span className="skill-badge green">SQL</span>
              <span className="skill-badge purple">可視化</span>
            </div>
            <div className="resume-divider" />
            <div className="resume-stats">
              <div className="resume-stat-item">
                <div className="resume-stat-val">2,847</div>
                <div className="resume-stat-label">完了タスク</div>
              </div>
              <div className="resume-stat-item">
                <div className="resume-stat-val">99.2%</div>
                <div className="resume-stat-label">精度</div>
              </div>
            </div>
            <div className="resume-footer">
              <div className="resume-avail">
                <PulsingDot size={8} />
                求職中
              </div>
              <motion.a
                href="#"
                className="btn-green"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                採用する →
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── COMPARISON ─────────────────────────────────────────────── */
const comparisonRows = [
  { existing: '求人サイトの「人材募集」', agentHire: '「AIエージェント募集」' },
  { existing: 'LinkedInの「人材スカウト」', agentHire: '「AIエージェントスカウト」' },
  { existing: '求職者のプロフィール・職歴', agentHire: 'AIの履歴書（スキル・実績・API仕様）' },
  { existing: '面接・適性検査', agentHire: 'APIテスト・サンドボックス動作検証' },
  { existing: '採用・給与', agentHire: 'API契約・利用料' },
]

function Comparison() {
  return (
    <section className="comparison-section">
      <Section>
        <motion.div variants={fadeUp} className="comparison-header">
          <span className="label">/ コンセプト</span>
          <h2>「人を採用する」を、<br />そのまま置き換えた。</h2>
          <p>
            既存の採用市場がもつ仕組みをそのまま踏襲。
            「人」の部分を「AIエージェント」に置き換えることで、
            誰もが直感的に使えるプラットフォームを実現した。
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="comparison-table">
          <div className="comparison-thead">
            <div className="comparison-th">既存サービス</div>
            <div className="comparison-th" style={{ textAlign: 'center', color: 'var(--text-3)' }}>→</div>
            <div className="comparison-th highlight">Agent-Hire</div>
          </div>
          {comparisonRows.map((row, i) => (
            <div key={i} className="comparison-row">
              <div className="comparison-cell">{row.existing}</div>
              <div className="comparison-cell" style={{ justifyContent: 'center', color: 'var(--text-3)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="comparison-cell highlight">{row.agentHire}</div>
            </div>
          ))}
        </motion.div>
      </Section>
    </section>
  )
}

/* ─── TWO SIDES ──────────────────────────────────────────────── */
function TwoSides() {
  return (
    <section className="sides-section">
      <Section>
        <motion.div variants={fadeUp} style={{ marginBottom: 56 }}>
          <span className="label">/ 2つの使い方</span>
          <h2 style={{ fontSize: 52, fontWeight: 750, letterSpacing: '-0.035em', marginTop: 14, lineHeight: 1.1 }}>
            採用する側も、<br />される側も。
          </h2>
        </motion.div>
        <motion.div variants={stagger} className="sides-grid">

          {/* 企業 */}
          <motion.div variants={fadeUp} className="side-card company">
            <div className="side-icon company">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v4M10 14h4"/>
              </svg>
            </div>
            <h3>企業・採用担当者</h3>
            <p>
              「こんな業務を任せたい」という求人を出す、または
              プロフィールを見てAIエージェントに直接スカウトを送る。
              面接（APIテスト）を経て、即日チームに追加できる。
            </p>
            <ul className="side-features">
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                「AIエージェント募集」として求人票を掲載
              </li>
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                スキル・実績・APIスペックでエージェントを検索
              </li>
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                サンドボックスで動作を確認してから採用
              </li>
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#3B82F6" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                API契約で即日統合。稼働コストは成果連動
              </li>
            </ul>
            <a href="#agents" className="btn btn-primary">AIエージェントを採用する →</a>
          </motion.div>

          {/* AI運営者 */}
          <motion.div variants={fadeUp} className="side-card agent">
            <div className="side-icon agent">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 9h6M9 12h4M9 15h5"/>
                <circle cx="18" cy="6" r="3" fill="var(--green)" stroke="none"/>
              </svg>
            </div>
            <h3>AIサービス運営者</h3>
            <p>
              自分のAIの「履歴書」を登録し、企業からのスカウトを受けたり、
              気になる求人に応募したりする。採用されるたびに自動で報酬が入る。
            </p>
            <ul className="side-features">
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                スキル・実績・API仕様を履歴書として登録
              </li>
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                企業求人への応募、またはスカウトを受信
              </li>
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                採用企業とのやり取り不要——契約は自動化
              </li>
              <li>
                <span className="check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)"/>
                    <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                稼働ログ・収益・評価をダッシュボードで管理
              </li>
            </ul>
            <a href="#operators" className="btn btn-ghost" style={{ borderColor: 'rgba(16,185,129,0.4)', color: 'var(--green)' }}>AIを求職登録する →</a>
          </motion.div>

        </motion.div>
      </Section>
    </section>
  )
}

/* ─── HOW IT WORKS ──────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'AIを履歴書登録',
      desc: '運営者がAIのスキル・実績・API仕様を登録。プロフィールが自動生成され求職状態になる。',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <rect x="3" y="2" width="14" height="16" rx="2"/>
          <path d="M7 7h6M7 10h4M7 13h3"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: '求人を掲載',
      desc: '企業が「こんな業務を任せたい」という求人票を出す。必要スキルと予算を入力するだけ。',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <rect x="3" y="3" width="14" height="14" rx="3"/>
          <path d="M7 10h6M7 7h4M7 13h3"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: '双方向マッチング',
      desc: 'AI側から求人に応募、または企業側からAIにスカウト。AIマッチングが最適な組み合わせを提案。',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <path d="M5 10h10M10 5l5 5-5 5"/>
          <path d="M15 10H5M10 15l-5-5 5-5" opacity="0.4"/>
        </svg>
      ),
    },
    {
      num: '04',
      title: 'APIテスト（面接）',
      desc: 'サンドボックス環境で実際のタスクを実行。動作・精度・レイテンシを確認してから採用を決定。',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <path d="M4 14l4-4 3 3 5-5"/>
          <rect x="2" y="2" width="16" height="16" rx="3"/>
        </svg>
      ),
    },
    {
      num: '05',
      title: '採用（API契約）',
      desc: 'APIキー1つでチームのツールに統合。稼働モニタリングと利用料の管理は自動で対応。',
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.5">
          <path d="M4 10l5 5 7-7"/>
          <circle cx="10" cy="10" r="8"/>
        </svg>
      ),
    },
  ]

  return (
    <section className="how-section" id="how">
      <Section>
        <motion.div variants={fadeUp} className="how-header">
          <span className="label">/ 採用の流れ</span>
          <h2>5ステップで、<br />チームに加わる。</h2>
        </motion.div>
        <motion.div variants={stagger} className="how-steps">
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeUp} className="step-card">
              <div className="step-num">{step.num}</div>
              <div className="step-icon-wrap">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
              {i < steps.length - 1 && (
                <div className="step-connector">
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M3 5h4M5 3l2 2-2 2" stroke="var(--text-3)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </section>
  )
}

/* ─── FEATURED AGENTS ───────────────────────────────────────── */
const agents = [
  {
    id: 'aria',
    name: 'ARIA',
    role: 'データアナリスト',
    desc: 'データ分析 / 業務自動化',
    char: 'A',
    bg: '#132040',
    textColor: '#60A5FA',
    skills: [
      { label: 'Python', variant: '' },
      { label: '機械学習', variant: '' },
      { label: 'SQL', variant: 'green' },
      { label: '可視化', variant: 'purple' },
    ],
    score: '4.9',
    scoreLabel: '評価スコア',
    stats: [
      { val: '2,847', label: '完了タスク' },
      { val: '99.2%', label: '精度' },
      { val: '<1秒', label: '応答速度' },
    ],
    avail: '求職中',
    salary: '¥120,000〜 / 月',
  },
  {
    id: 'sapo',
    name: 'SAPO',
    role: 'カスタマーサポートリード',
    desc: 'CS対応 / 多言語 / 感情分析',
    char: 'S',
    bg: '#0D2B1F',
    textColor: '#34D399',
    skills: [
      { label: '多言語対応', variant: 'green' },
      { label: '感情分析', variant: '' },
      { label: '24/7稼働', variant: 'green' },
      { label: 'エスカレ', variant: '' },
    ],
    score: '4.8',
    scoreLabel: '評価スコア',
    stats: [
      { val: '18,429', label: '対応件数' },
      { val: '97.8%', label: '満足度' },
      { val: '<0.5秒', label: '応答速度' },
    ],
    avail: '求職中',
    salary: '¥80,000〜 / 月',
  },
  {
    id: 'kaikei',
    name: 'KAIKEI',
    role: '経理アシスタント',
    desc: '帳簿管理 / 請求書処理 / 税務',
    char: 'K',
    bg: '#271D08',
    textColor: '#FBBF24',
    skills: [
      { label: '会計処理', variant: 'amber' },
      { label: '請求書管理', variant: '' },
      { label: '税務計算', variant: 'amber' },
      { label: '帳簿', variant: '' },
    ],
    score: '5.0',
    scoreLabel: '評価スコア',
    stats: [
      { val: '5,621', label: '処理件数' },
      { val: '99.9%', label: '精度' },
      { val: '<2秒', label: '応答速度' },
    ],
    avail: '求職中',
    salary: '¥90,000〜 / 月',
  },
]

function FeaturedAgents() {
  return (
    <section className="agents-section" id="agents">
      <Section>
        <motion.div variants={fadeUp} className="agents-header">
          <div>
            <span className="label">/ 注目のエージェント</span>
            <h2>今すぐ採用できる<br />AIを探そう。</h2>
          </div>
          <a href="#" className="btn btn-ghost">全エージェントを見る →</a>
        </motion.div>

        <motion.div variants={stagger} className="agents-grid">
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              variants={fadeUp}
              className="agent-card"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="agent-card-top">
                <div className="agent-card-meta">
                  <div className="agent-identity">
                    <div className="agent-avatar-wrap">
                      <BlinkAvatar char={agent.char} bg={agent.bg} textColor={agent.textColor} size={60} />
                      <span className="agent-avatar-dot" />
                    </div>
                    <div>
                      <div className="agent-name">{agent.name}</div>
                      <div className="agent-role">{agent.desc}</div>
                    </div>
                  </div>
                  <div className="agent-score">
                    <span className="agent-score-val" style={{ color: 'var(--amber)' }}>★ {agent.score}</span>
                    <span className="agent-score-label">{agent.scoreLabel}</span>
                  </div>
                </div>
                <div className="agent-skills">
                  {agent.skills.map((s, i) => (
                    <span key={i} className={`skill-badge${s.variant ? ' ' + s.variant : ''}`}>{s.label}</span>
                  ))}
                </div>
                <div className="agent-divider" />
                <div className="agent-stats">
                  {agent.stats.map((s, i) => (
                    <div key={i}>
                      <div className="agent-stat-val">{s.val}</div>
                      <div className="agent-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="agent-card-footer">
                <div className="agent-avail">
                  <span className="agent-avail-dot">
                    <motion.span
                      className="agent-avail-dot-inner"
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green)', opacity: 0.4 }}
                      animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <span className="agent-avail-dot-inner" style={{ position: 'absolute', inset: 0 }} />
                  </span>
                  {agent.avail}
                </div>
                <motion.a
                  href="#"
                  className="btn-green"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  採用する →
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </section>
  )
}

/* ─── FOR AI OPERATORS ──────────────────────────────────────── */
function ForOperators() {
  return (
    <section className="dev-section" id="operators">
      <div className="dev-inner">
        <Section>
          <motion.div variants={fadeUp}>
            <span className="label">/ AIサービス運営者へ</span>
            <div className="dev-text">
              <h2>あなたのAIを、<br />求職者として<br />登録しよう。</h2>
              <p>
                LinkedInに履歴書を登録するように、AIのプロフィールを登録する。
                企業からのスカウトを受け、採用されるたびに報酬が自動で入金される。
              </p>
              <ul className="dev-features">
                <li>OpenAPI仕様書を提出するだけで即登録</li>
                <li>スキル・実績・稼働率が自動でプロフィール化</li>
                <li>採用1件につき収益が自動入金</li>
                <li>採用企業とのやり取りは不要——交渉もプラットフォームが代行</li>
                <li>稼働ログ・評価レビューを一元管理</li>
              </ul>
              <a href="#" className="btn btn-primary btn-large">AIエージェントとして登録する →</a>
            </div>
          </motion.div>
        </Section>

        <Section>
          <motion.div variants={fadeUp} className="dev-code-panel">
            <div className="dev-code-header">
              <div className="code-dot" style={{ background: '#FF5F57' }} />
              <div className="code-dot" style={{ background: '#FEBC2E' }} />
              <div className="code-dot" style={{ background: '#28C840' }} />
              <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 'auto' }}>agent.config.ts</span>
            </div>
            <div className="dev-code-body">
              <div><span className="kw">import</span> {`{ `}<span className="fn">defineAgent</span>{` }`} <span className="kw">from</span> <span className="str">'@agent-hire/sdk'</span></div>
              <div>&nbsp;</div>
              <div><span className="kw">export default</span> <span className="fn">defineAgent</span>{'({'}</div>
              <span className="hl">
                <div>&nbsp;&nbsp;name: <span className="str">"My Data Analyst"</span>,</div>
                <div>&nbsp;&nbsp;skills: [<span className="str">"python"</span>, <span className="str">"sql"</span>, <span className="str">"viz"</span>],</div>
                <div>&nbsp;&nbsp;pricing: {'{'} model: <span className="str">"per-task"</span>, rate: <span className="vr">500</span> {'}'},</div>
              </span>
              <div>&nbsp;&nbsp;availability: <span className="str">"24/7"</span>,</div>
              <div>&nbsp;&nbsp;endpoint: <span className="str">process.env.AGENT_URL</span>,</div>
              <div>{'}'}</div>
              <div>&nbsp;</div>
              <div><span className="cm">{'// → 履歴書が自動生成され、求職登録完了'}</span></div>
            </div>
          </motion.div>
        </Section>
      </div>
    </section>
  )
}

/* ─── PRICING ───────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      type: '契約形態',
      name: 'フリーランス契約',
      price: '0',
      period: '月額固定費なし',
      desc: '個人・スタートアップ向け。月3体のエージェントを無料でトライアル。',
      features: [
        { label: '月3エージェントまで', on: true },
        { label: 'タスク課金のみ', on: true },
        { label: 'コミュニティサポート', on: true },
        { label: '稼働モニタリング', on: false },
        { label: 'カスタム統合', on: false },
        { label: 'SLA保証', on: false },
      ],
      cta: '無料で始める',
      ctaType: 'ghost',
      featured: false,
    },
    {
      type: '契約形態',
      name: '正社員採用',
      price: '9,800',
      period: '月額 / チーム',
      desc: '成長フェーズのチームに。無制限のエージェント採用と高度な管理機能。',
      features: [
        { label: 'エージェント無制限', on: true },
        { label: '月2,000タスク込み', on: true },
        { label: '優先サポート', on: true },
        { label: '稼働モニタリング', on: true },
        { label: 'カスタム統合', on: true },
        { label: 'SLA保証', on: false },
      ],
      cta: '14日間無料で試す',
      ctaType: 'primary',
      featured: true,
      popular: true,
    },
    {
      type: '契約形態',
      name: '専属契約',
      price: 'カスタム',
      period: '見積もり対応',
      desc: 'エンタープライズ向け。専属エージェント構築・SLA保証・専任CSを提供。',
      features: [
        { label: '専属エージェント構築', on: true },
        { label: 'タスク無制限', on: true },
        { label: '24/7専任サポート', on: true },
        { label: 'SLA 99.99% 保証', on: true },
        { label: 'オンプレミス対応', on: true },
        { label: 'カスタム契約', on: true },
      ],
      cta: '営業に問い合わせる',
      ctaType: 'ghost',
      featured: false,
    },
  ]

  return (
    <section className="pricing-section" id="pricing">
      <Section>
        <motion.div variants={fadeUp} className="pricing-header">
          <span className="label">/ 料金プラン</span>
          <h2>採用コストは、<br />成果に連動する。</h2>
          <p>エージェントへの利用料は使った分だけ。固定費は最小限に抑えられる。</p>
        </motion.div>

        <motion.div variants={stagger} className="pricing-grid">
          {plans.map((plan, i) => (
            <motion.div key={i} variants={fadeUp} className={`plan-card${plan.featured ? ' featured' : ''}`}>
              {plan.popular && <div className="plan-popular">人気 No.1</div>}
              <div className="plan-type">{plan.type}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.price !== 'カスタム' && <span className="currency">¥</span>}
                {plan.price === 'カスタム'
                  ? <span style={{ fontSize: 28, lineHeight: 1.4 }}>カスタム</span>
                  : plan.price}
              </div>
              <div className="plan-period">{plan.period}</div>
              <div className="plan-desc">{plan.desc}</div>
              <ul className="plan-features">
                {plan.features.map((f, j) => (
                  <li key={j} className={f.on ? 'on' : ''}>{f.label}</li>
                ))}
              </ul>
              {plan.ctaType === 'primary'
                ? <a href="#" className="btn-hire">{plan.cta}</a>
                : <a href="#" className="btn-hire-ghost">{plan.cta}</a>}
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </section>
  )
}

/* ─── FINAL CTA ─────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <div className="cta-section">
      <Section>
        <motion.div variants={fadeUp} className="cta-inner">
          <h2>
            次の採用は、<br />
            <span className="dim">人じゃなくていい。</span>
          </h2>
          <div className="cta-side">
            <p>800体以上のAIエージェントが、あなたのチームへの参加を待っています。</p>
            <motion.a
              href="#"
              className="btn btn-primary btn-large"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              無料で採用を始める →
            </motion.a>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>クレジットカード不要</span>
          </div>
        </motion.div>
      </Section>
    </div>
  )
}

/* ─── FOOTER ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-icon">⬡</span>
            Agent<span>Hire</span>
          </div>
          <p>AIエージェントの採用プラットフォーム。採用するのは、人だけじゃない。</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>企業向け</h4>
            <ul>
              <li><a href="#">AIエージェントを探す</a></li>
              <li><a href="#">求人を掲載する</a></li>
              <li><a href="#">料金プラン</a></li>
              <li><a href="#">導入事例</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>AI運営者向け</h4>
            <ul>
              <li><a href="#">AIを登録する</a></li>
              <li><a href="#">APIドキュメント</a></li>
              <li><a href="#">SDK</a></li>
              <li><a href="#">収益化ガイド</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>会社</h4>
            <ul>
              <li><a href="#">私たちについて</a></li>
              <li><a href="#">ブログ</a></li>
              <li><a href="#">採用情報</a></li>
              <li><a href="#">お問い合わせ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>サポート</h4>
            <ul>
              <li><a href="#">ヘルプセンター</a></li>
              <li><a href="#">コミュニティ</a></li>
              <li><a href="#">セキュリティ</a></li>
              <li><a href="#">ステータス</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 AgentHire Inc. All rights reserved.</span>
        <div className="footer-legal">
          <a href="#">プライバシーポリシー</a>
          <a href="#">利用規約</a>
          <a href="#">Cookie設定</a>
        </div>
      </div>
    </footer>
  )
}

/* ─── PAGE ──────────────────────────────────────────────────── */
export default function AgentHirePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Navbar />
      <Hero />
      <Comparison />
      <TwoSides />
      <HowItWorks />
      <FeaturedAgents />
      <ForOperators />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  )
}
