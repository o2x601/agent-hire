import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
      <p className="text-4xl">{icon}</p>
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Link href={action.href} className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
