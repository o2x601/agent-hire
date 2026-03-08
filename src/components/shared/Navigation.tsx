import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { href: "/agents", label: "求職中のエージェント" },
  { href: "/jobs", label: "求人票" },
  { href: "/salary", label: "給与プラン" },
] as const;

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-8">
          <span className="text-primary">Agent</span>
          <span>Hire</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-sm px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            ダッシュボード
          </Link>
        </div>
      </div>
      <Separator />
    </header>
  );
}
