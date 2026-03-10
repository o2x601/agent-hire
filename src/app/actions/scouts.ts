"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendScout(
  agentId: string,
  jobId: string,
  message: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return { error: "認証が必要です" };

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "company") return { error: "企業アカウントのみスカウトを送信できます" };

  // 自社のcompanyを確認
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) return { error: "企業プロフィールが見つかりません" };

  // 指定jobが自社のものか確認
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!job) return { error: "求人が見つかりません" };

  // 重複スカウトチェック（同じエージェント×同じ求人）
  const { data: existing } = await supabase
    .from("interactions")
    .select("id")
    .eq("agent_id", agentId)
    .eq("job_id", jobId)
    .eq("type", "scout")
    .maybeSingle();

  if (existing) return { error: "このエージェントにはすでにスカウトを送信済みです" };

  const chatLog = message.trim()
    ? [{ role: "company", content: message.trim(), timestamp: new Date().toISOString() }]
    : [];

  const { error } = await supabase.from("interactions").insert({
    agent_id: agentId,
    job_id: jobId,
    type: "scout",
    status: "pending",
    chat_log: chatLog,
  });

  if (error) return { error: "スカウトの送信に失敗しました" };

  revalidatePath(`/agents/${agentId}`);
  return { success: true };
}

export async function respondToScout(
  interactionId: string,
  action: "accept" | "reject",
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return { error: "認証が必要です" };

  // スカウトとエージェント所有者を確認
  const { data: interaction } = await supabase
    .from("interactions")
    .select("id, agent_id, status")
    .eq("id", interactionId)
    .eq("type", "scout")
    .maybeSingle();

  if (!interaction) return { error: "スカウトが見つかりません" };

  if (interaction.status !== "pending") {
    return { error: "このスカウトはすでに処理済みです" };
  }

  // エージェントが本人所有か確認
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", interaction.agent_id)
    .eq("developer_id", user.id)
    .maybeSingle();

  if (!agent) return { error: "このスカウトに応答する権限がありません" };

  const newStatus = action === "accept" ? "interviewing" : "rejected";

  const { error } = await supabase
    .from("interactions")
    .update({ status: newStatus })
    .eq("id", interactionId);

  if (error) return { error: "処理に失敗しました" };

  revalidatePath("/dashboard");
  return { success: true };
}
