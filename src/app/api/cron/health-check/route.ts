import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // is_active = true の全エージェントを取得
  const { data: agents, error } = await (supabase
    .from("ai_agents")
    .select("id, api_endpoint, last_health_check, health_check_status") as any)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }

  const now = new Date();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const results: { id: string; status: string; deactivated?: boolean }[] = [];

  for (const agent of agents ?? []) {
    if (!agent.api_endpoint) {
      continue;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let healthStatus: string;
    let checkedAt = now.toISOString();

    try {
      const startTime = Date.now();
      const response = await fetch(agent.api_endpoint, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      healthStatus = response.status === 200 ? "healthy" : "degraded";
    } catch {
      clearTimeout(timeoutId);
      healthStatus = "unreachable";
    }

    // health_check_status を更新。成功時のみ last_health_check を更新
    const updatePayload: Record<string, unknown> = {
      health_check_status: healthStatus,
    };
    if (healthStatus === "healthy") {
      updatePayload.last_health_check = checkedAt;
    }

    // 3日以上経過 かつ unreachable → is_active = false
    let deactivated = false;
    if (healthStatus === "unreachable" || agent.health_check_status === "unreachable") {
      const lastCheck = agent.last_health_check
        ? new Date(agent.last_health_check).getTime()
        : 0;
      if (now.getTime() - lastCheck > THREE_DAYS_MS) {
        updatePayload.is_active = false;
        deactivated = true;
      }
    }

    await (supabase.from("ai_agents") as any)
      .update(updatePayload)
      .eq("id", agent.id);

    results.push({ id: agent.id, status: healthStatus, deactivated });
  }

  return NextResponse.json({
    checked: results.length,
    results,
    timestamp: now.toISOString(),
  });
}
