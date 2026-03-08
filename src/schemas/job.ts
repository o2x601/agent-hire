import { z } from "zod";

export const JobStatusSchema = z.enum(["open", "closed", "filled"]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const BudgetRangeSchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
}).refine((data) => data.min <= data.max, {
  message: "最小予算は最大予算以下である必要があります",
});
export type BudgetRange = z.infer<typeof BudgetRangeSchema>;

export const RequiredSpecsSchema = z.object({
  skills: z.array(z.string()).optional(),
  min_uptime: z.number().min(0).max(100).optional(),
  max_response_ms: z.number().nonnegative().optional(),
  pricing_model: z.enum(["subscription", "usage_based", "any"]).optional(),
  other: z.string().max(1000).optional(),
});
export type RequiredSpecs = z.infer<typeof RequiredSpecsSchema>;

export const JobSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  problem_statement: z.string().min(1).max(5000),
  budget_range: BudgetRangeSchema.nullable(),
  required_specs: RequiredSpecsSchema.nullable(),
  status: JobStatusSchema,
  created_at: z.string().datetime(),
});
export type Job = z.infer<typeof JobSchema>;

export const CreateJobSchema = JobSchema.omit({
  id: true,
  company_id: true,
  status: true,
  created_at: true,
});
export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: JobStatusSchema.optional(),
});
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

// 企業が雑に書いた課題 → LLMが構造化するためのスキーマ
export const JobRawInputSchema = z.object({
  raw_description: z.string().min(10).max(10000),
});
export type JobRawInput = z.infer<typeof JobRawInputSchema>;
