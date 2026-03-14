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
  interactionId: string,
): Promise<{ data?: InterviewResult; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return { error: "認証が必要です" };

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "company") return { error: "企業アカウントのみ面接を実行できます" };

  // interaction と対象エージェントを取得
  const { data: interaction, error: intError } = await supabase
    .from("interactions")
    .select("id, agent_id, job_id, status")
    .eq("id", interactionId)
    .single();

  if (intError || !interaction) return { error: "インタラクションが見つかりません" };
  if (interaction.status !== "interviewing") {
    return { error: "面接可能なステータスではありません（interviewing が必要です）" };
  }

  // この job が自社のものか確認
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) return { error: "企業プロフィールが見つかりません" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", interaction.job_id)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!job) return { error: "この求人に対する権限がありません" };

  // エージェントの api_endpoint を取得
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id, api_endpoint")
    .eq("id", interaction.agent_id)
    .single();

  if (!agent?.api_endpoint) {
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
    interviewResult = {
      result: status_code === 200 ? "passed" : "failed",
      status_code,
      response_time_ms,
      tested_at,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    interviewResult = {
      result: "timeout",
      status_code: null,
      response_time_ms: 5000,
      tested_at,
      error: isTimeout ? "タイムアウト (5秒)" : String(err),
    };
  }

  const { result, status_code, response_time_ms } = interviewResult;

  // interaction を更新
  // passed → status = 'probation'、failed/timeout → 'interviewing' のまま
  const newStatus = result === "passed" ? "probation" : "interviewing";

  await supabase
    .from("interactions")
    .update({
      status: newStatus as any,
      test_result: { status_code, response_time_ms, tested_at, result },
    })
    .eq("id", interactionId);

  // ai_agents の health check ステータスを更新
  const healthStatus =
    result === "passed" ? "healthy" : result === "failed" ? "degraded" : "unreachable";

  const agentUpdate: Record<string, unknown> = { health_check_status: healthStatus };
  if (result === "passed") agentUpdate.last_health_check = tested_at;

  await (supabase.from("ai_agents") as any).update(agentUpdate).eq("id", agent.id);

  revalidatePath(`/agents/${agent.id}`);
  revalidatePath("/dashboard/company");

  return { data: interviewResult };
}
