"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function applyToJob(
  jobId: string,
  agentId: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return { error: "認証が必要です" };
  }

  // エージェントが本人所有か確認
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("developer_id", user.id)
    .single();

  if (!agent) {
    return { error: "エージェントが見つかりません" };
  }

  // 重複応募チェック
  const { data: existing } = await supabase
    .from("interactions")
    .select("id")
    .eq("job_id", jobId)
    .eq("agent_id", agentId)
    .eq("type", "application")
    .maybeSingle();

  if (existing) {
    return { error: "このエージェントはすでに応募済みです" };
  }

  const { error } = await supabase.from("interactions").insert({
    job_id: jobId,
    agent_id: agentId,
    type: "application",
    status: "pending",
    chat_log: [],
  });

  if (error) {
    return { error: "応募に失敗しました。しばらく後でお試しください。" };
  }

  revalidatePath("/jobs");
  return { success: true };
}
