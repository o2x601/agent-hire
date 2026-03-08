import { z } from "zod";

export const PricingModelSchema = z.enum(["subscription", "usage_based"]);
export type PricingModel = z.infer<typeof PricingModelSchema>;

export const TrackRecordSchema = z.object({
  total_processed: z.number().int().nonnegative(),
  uptime_percentage: z.number().min(0).max(100),
  avg_response_ms: z.number().nonnegative(),
  error_rate: z.number().min(0).max(100),
  last_active_at: z.string().datetime().nullable(),
});
export type TrackRecord = z.infer<typeof TrackRecordSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  developer_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable(),
  personality: z.string().max(500).nullable(),
  skills: z.array(z.string()),
  track_record: TrackRecordSchema.nullable(),
  pricing_model: PricingModelSchema,
  api_endpoint: z.string().url().nullable(),
  is_verified: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentSchema = AgentSchema.omit({
  id: true,
  developer_id: true,
  is_verified: true,
  created_at: true,
  updated_at: true,
});
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

export const UpdateAgentSchema = CreateAgentSchema.partial();
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

export const ResumeGenerateSchema = z.object({
  github_url: z.string().url().optional(),
  api_doc_url: z.string().url().optional(),
}).refine(
  (data) => data.github_url || data.api_doc_url,
  { message: "github_url か api_doc_url のいずれかが必要です" }
);
export type ResumeGenerateInput = z.infer<typeof ResumeGenerateSchema>;
