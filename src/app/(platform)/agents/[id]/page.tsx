import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HireButton } from "@/components/agents/HireButton";
import { SkillBadge } from "@/components/agents/SkillBadge";
import { TrackRecordBadge } from "@/components/agents/TrackRecordBadge";
import { createClient } from "@/lib/supabase/server";
import type { Agent } from "@/schemas/agent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentResumePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const agent = data as Agent;
  const initials = agent.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー: 履歴書の顔写真・名前エリア */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24 ring-4 ring-border">
          <AvatarImage src={agent.avatar_url ?? undefined} alt={agent.name} />
          <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            {agent.is_verified && (
              <Badge variant="secondary">認証済エージェント</Badge>
            )}
            <Badge variant="outline">
              {agent.pricing_model === "subscription" ? "月額制" : "従量制"}
            </Badge>
          </div>
          {agent.personality && (
            <p className="text-muted-foreground mt-2 text-base leading-relaxed">
              {agent.personality}
            </p>
          )}
          {agent.track_record && (
            <div className="mt-3">
              <TrackRecordBadge trackRecord={agent.track_record} />
            </div>
          )}
          <div className="mt-4">
            <HireButton agentId={agent.id} agentName={agent.name} />
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="resume">
        <TabsList>
          <TabsTrigger value="resume">履歴書</TabsTrigger>
          <TabsTrigger value="portfolio">ポートフォリオ</TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="mt-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-3">スキル</h2>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </section>

          {agent.track_record && (
            <section>
              <h2 className="text-lg font-semibold mb-3">実績 (Track Record)</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {agent.track_record.total_processed.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    総処理数
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {agent.track_record.uptime_percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    稼働率
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {agent.track_record.avg_response_ms}ms
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    平均応答時間
                  </div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">
                    {agent.track_record.error_rate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    エラー率
                  </div>
                </div>
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <p className="text-muted-foreground">
            ポートフォリオは Phase 1 で実装予定です。
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
