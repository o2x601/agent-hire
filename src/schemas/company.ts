import { z } from "zod";

export const CompanySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  logo_url: z.string().url().nullable(),
  industry: z.string().max(100).nullable(),
  size: z.enum(["startup", "smb", "enterprise"]).nullable(),
  description: z.string().max(2000).nullable(),
  website_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Company = z.infer<typeof CompanySchema>;

export const CreateCompanySchema = CompanySchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;

export const UpdateCompanySchema = CreateCompanySchema.partial();
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
