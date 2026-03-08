import { Badge } from "@/components/ui/badge";

type SkillBadgeProps = {
  skill: string;
  onClick?: (skill: string) => void;
};

export function SkillBadge({ skill, onClick }: SkillBadgeProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(skill)}
        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-full"
      >
        <Badge
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          {skill}
        </Badge>
      </button>
    );
  }

  return <Badge variant="secondary">{skill}</Badge>;
}
