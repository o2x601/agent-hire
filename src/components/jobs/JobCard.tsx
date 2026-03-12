"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { BudgetRangeSchema, RequiredSpecsSchema } from "@/schemas/job";
import type { Database } from "@/types/database";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
type AgentOption = { id: string; name: string };

type Props = {
  job: JobRow;
  companyName: string | null;
  isOwnCompany: boolean;
  isDeveloper: boolean;
  userAgents: AgentOption[];
  alreadyApplied: boolean;
};

export function JobCard({
  job,
  companyName,
  isOwnCompany,
  isDeveloper,
  userAgents,
  alreadyApplied,
}: Props) {
  const router = useRouter();
  const budget = BudgetRangeSchema.safeParse(job.budget_range);
  const specs = RequiredSpecsSchema.safeParse(job.required_specs);
  const requiredSkills = specs.success ? (specs.data.skills ?? []) : [];
  const preferredSkills = specs.success ? (specs.data.preferred_skills ?? []) : [];
  const allSkills = [...requiredSkills, ...preferredSkills];

  const statusLabel: Record<string, string> = {
    open: "募集中",
    closed: "募集終了",
    filled: "採用済み",
  };

  return (
    <Card
      onClick={() => router.push(`/jobs/${job.id}`)}
      className={`relative flex flex-col overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
        isOwnCompany ? "ring-2 ring-primary" : ""
      }`}
    >
      {isOwnCompany && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="text-xs">自社の求人</Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start gap-2 pr-20">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {job.title}
            </h3>
            {companyName && (
              <p className="mt-0.5 text-xs text-muted-foreground">{companyName}</p>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge
            variant={job.status === "open" ? "default" : "secondary"}
            className="text-xs"
          >
            {statusLabel[job.status] ?? job.status}
          </Badge>
          {budget.success && (
            <span className="text-xs text-muted-foreground">
              ¥{budget.data.min.toLocaleString()} 〜 ¥{budget.data.max.toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.problem_statement}
        </p>

        {allSkills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {requiredSkills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {preferredSkills.slice(0, Math.max(0, 4 - requiredSkills.length)).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {skill}
              </Badge>
            ))}
            {allSkills.length > 4 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{allSkills.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(job.created_at).toLocaleDateString("ja-JP")}
        </span>
        {isDeveloper && job.status === "open" && (
          <span onClick={(e) => e.stopPropagation()}>
            <ApplyButton
              jobId={job.id}
              jobTitle={job.title}
              userAgents={userAgents}
              alreadyApplied={alreadyApplied}
            />
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
