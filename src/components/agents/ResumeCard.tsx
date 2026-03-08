import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { HireButton } from "@/components/agents/HireButton";
import { TrackRecordBadge } from "@/components/agents/TrackRecordBadge";
import type { Agent } from "@/schemas/agent";

type ResumeCardProps = {
  agent: Agent;
};

export function ResumeCard({ agent }: ResumeCardProps) {
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      {agent.is_verified && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="text-xs">
            認証済
          </Badge>
        </div>
      )}
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-14 w-14 ring-2 ring-border">
          <AvatarImage src={agent.avatar_url ?? undefined} alt={agent.name} />
          <AvatarFallback className="text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <Link
            href={`/agents/${agent.id}`}
            className="font-semibold text-base leading-tight hover:underline line-clamp-1"
          >
            {agent.name}
          </Link>
          {agent.personality && (
            <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
              {agent.personality}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1.5">
          {agent.skills.slice(0, 5).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {agent.skills.length > 5 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{agent.skills.length - 5}
            </Badge>
          )}
        </div>
        {agent.track_record && (
          <div className="mt-3">
            <TrackRecordBadge trackRecord={agent.track_record} />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
        </span>
        <HireButton agentId={agent.id} agentName={agent.name} />
      </CardFooter>
    </Card>
  );
}
