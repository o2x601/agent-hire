"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateApplicationStatus(
  interactionId: string,
  action: "interview" | "reject",
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return { error: "認証が必要です" };

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "company") return { error: "企業アカウントのみ操作できます" };

  // 自社のcompanyを確認
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) return { error: "企業プロフィールが見つかりません" };

  // interactionとその求人が自社所有か確認
  const { data: interaction } = await supabase
    .from("interactions")
    .select("id, status, job_id")
    .eq("id", interactionId)
    .eq("type", "application")
    .maybeSingle();

  if (!interaction) return { error: "応募が見つかりません" };
  if (interaction.status !== "pending") return { error: "この応募はすでに処理済みです" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", interaction.job_id)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!job) return { error: "この応募を操作する権限がありません" };

  const newStatus = action === "interview" ? "interviewing" : "rejected";

  const { error } = await supabase
    .from("interactions")
    .update({ status: newStatus })
    .eq("id", interactionId);

  if (error) return { error: "処理に失敗しました" };

  revalidatePath("/dashboard/company");
  return { success: true };
}
