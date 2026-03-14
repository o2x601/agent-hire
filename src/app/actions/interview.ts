"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InterviewResult = {
  result: "passed" | "failed" | "timeout";
  status_code: number | null;
  response_time_ms: number;
  tested_at: string;
  error?: string;
};

export async function runInterview(
  agentId: string,
  jobId?: string,
): Promise<{ data?: InterviewResult; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return { error: "認証が必要です" };

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "company") return { error: "企業アカウントのみ面接を実行できます" };

  // エージェントの api_endpoint を取得
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("id, api_endpoint")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) return { error: "エージェントが見つかりません" };

  if (!agent.api_endpoint) {
    return { error: "このエージェントはAPIエンドポイントを登録していません" };
  }

  // Health Check 実行
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const tested_at = new Date().toISOString();
  let interviewResult: InterviewResult;

  try {
    const startTime = Date.now();
    const response = await fetch(agent.api_endpoint, {
      method: "GET",
      signal: controller.signal,
    });
    const response_time_ms = Date.now() - startTime;
    clearTimeout(timeoutId);

    const status_code = response.status;
    const result = status_code === 200 ? "passed" : "failed";

    interviewResult = { result, status_code, response_time_ms, tested_at };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout =
      err instanceof Error && err.name === "AbortError";

    interviewResult = {
      result: "timeout",
      status_code: null,
      response_time_ms: 5000,
      tested_at,
      error: isTimeout ? "タイムアウト (5秒)" : String(err),
    };
  }

  const { result, status_code, response_time_ms } = interviewResult;

  // health_check_status マッピング
  const healthStatus =
    result === "passed"
      ? "healthy"
      : result === "failed"
      ? "degraded"
      : "unreachable";

  // ai_agents の health check ステータスを更新
  // 成功時のみ last_health_check を更新（3日連続未到達の判定に使用）
  const agentUpdate: Record<string, unknown> = {
    health_check_status: healthStatus,
  };
  if (result === "passed") {
    agentUpdate.last_health_check = tested_at;
  }

  await (supabase.from("ai_agents") as any)
    .update(agentUpdate)
    .eq("id", agentId);

  // interactions に記録（jobId が指定されている場合のみ）
  if (jobId) {
    const interactionStatus =
      result === "passed" ? "interviewing" : "rejected";

    await supabase.from("interactions").insert({
      agent_id: agentId,
      job_id: jobId,
      type: "interview",
      status: interactionStatus,
      test_result: {
        status_code,
        response_time_ms,
        tested_at,
        result,
      },
    });
  }

  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/dashboard/company");

  return { data: interviewResult };
}
