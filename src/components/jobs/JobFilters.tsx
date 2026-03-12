"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Props = {
  allSkills: string[];
};

const SORT_OPTIONS = [
  { value: "newest", label: "新着順" },
  { value: "budget_asc", label: "予算少ない順" },
  { value: "budget_desc", label: "予算多い順" },
];

const inputStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  outline: "none",
  backgroundColor: "white",
  color: "#111827",
};

export function JobFilters({ allSkills }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const skill = searchParams.get("skill") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const [inputFocused, setInputFocused] = useState(false);
  const [sortFocused, setSortFocused] = useState(false);

  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (inputValue) {
        params.set("q", inputValue);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSkillClick = (clickedSkill: string) => {
    updateParam("skill", skill === clickedSkill ? "" : clickedSkill);
  };

  return (
    <div style={{ marginTop: 24, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12, opacity: isPending ? 0.5 : 1, transition: "opacity 0.15s" }}>
      {/* 検索バー + ソート */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          placeholder="求人タイトル・スキルで検索..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={{
            ...inputStyle,
            width: "100%",
            borderColor: inputFocused ? "#9ca3af" : "#e5e7eb",
          }}
        />
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          onFocus={() => setSortFocused(true)}
          onBlur={() => setSortFocused(false)}
          style={{
            ...inputStyle,
            width: "auto",
            flexShrink: 0,
            borderColor: sortFocused ? "#9ca3af" : "#e5e7eb",
            cursor: "pointer",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* スキルフィルタータグ */}
      {allSkills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>スキル:</span>
          {allSkills.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSkillClick(s)}
              style={{
                fontSize: 13,
                backgroundColor: skill === s ? "#111827" : "#f3f4f6",
                color: skill === s ? "white" : "#4b5563",
                border: `1px solid ${skill === s ? "#111827" : "#e5e7eb"}`,
                padding: "4px 10px",
                borderRadius: 99,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {s}
            </button>
          ))}
          {skill && (
            <button
              type="button"
              onClick={() => updateParam("skill", "")}
              style={{ fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              リセット
            </button>
          )}
        </div>
      )}
    </div>
  );
}
