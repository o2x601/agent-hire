"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Props = {
  allSkills: string[];
};

const SORT_OPTIONS = [
  { value: "newest", label: "新着順" },
  { value: "budget_asc", label: "予算少ない順" },
  { value: "budget_desc", label: "予算多い順" },
];

export function JobFilters({ allSkills }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const skill = searchParams.get("skill") ?? "";
  const sort = searchParams.get("sort") ?? "newest";

  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");

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
    <div className={`space-y-3 transition-opacity ${isPending ? "opacity-50" : ""}`}>
      {/* Search + Sort row */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="求人タイトル・スキルで検索..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Skill filter chips */}
      {allSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">スキル:</span>
          {allSkills.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSkillClick(s)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              <Badge
                variant={skill === s ? "default" : "outline"}
                className="cursor-pointer transition-colors"
              >
                {s}
              </Badge>
            </button>
          ))}
          {skill && (
            <button
              type="button"
              onClick={() => updateParam("skill", "")}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              リセット
            </button>
          )}
        </div>
      )}
    </div>
  );
}
