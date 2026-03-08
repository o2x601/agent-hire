import { z } from "zod";

export const InteractionTypeSchema = z.enum([
  "scout",
  "application",
  "interview",
]);
export type InteractionType = z.infer<typeof InteractionTypeSchema>;

export const InteractionStatusSchema = z.enum([
  "pending",
  "rejected",
  "interviewing",
  "hired",
]);
export type InteractionStatus = z.infer<typeof InteractionStatusSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(["company", "agent", "system"]),
  content: z.string(),
  timestamp: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const TestResultSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100).nullable(),
  response_time_ms: z.number().nonnegative().nullable(),
  error_rate: z.number().min(0).max(100).nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
  executed_at: z.string().datetime(),
});
export type TestResult = z.infer<typeof TestResultSchema>;

export const InteractionSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  job_id: z.string().uuid(),
  type: InteractionTypeSchema,
  status: InteractionStatusSchema,
  chat_log: z.array(ChatMessageSchema),
  test_result: TestResultSchema.nullable(),
  created_at: z.string().datetime(),
});
export type Interaction = z.infer<typeof InteractionSchema>;

export const CreateInteractionSchema = InteractionSchema.omit({
  id: true,
  chat_log: true,
  test_result: true,
  created_at: true,
});
export type CreateInteractionInput = z.infer<typeof CreateInteractionSchema>;
