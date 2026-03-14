// このファイルは `pnpm db:types` で自動生成されます。手動で編集しないでください。
// Supabase CLI: npx supabase gen types typescript --local > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_agents: {
        Row: {
          id: string;
          developer_id: string;
          name: string;
          avatar_url: string | null;
          personality: string | null;
          skills: string[];
          track_record: Json | null;
          pricing_model: "subscription" | "usage_based";
          api_endpoint: string | null;
          is_verified: boolean;
          is_active: boolean;
          last_health_check: string | null;
          health_check_status: "healthy" | "degraded" | "unreachable" | "unknown";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          developer_id: string;
          name: string;
          avatar_url?: string | null;
          personality?: string | null;
          skills?: string[];
          track_record?: Json | null;
          pricing_model: "subscription" | "usage_based";
          api_endpoint?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          last_health_check?: string | null;
          health_check_status?: "healthy" | "degraded" | "unreachable" | "unknown";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_agents"]["Insert"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          problem_statement: string;
          budget_range: Json | null;
          required_specs: Json | null;
          status: "open" | "closed" | "filled";
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          problem_statement: string;
          budget_range?: Json | null;
          required_specs?: Json | null;
          status?: "open" | "closed" | "filled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      interactions: {
        Row: {
          id: string;
          agent_id: string;
          job_id: string;
          type: "scout" | "application" | "interview";
          status: "pending" | "rejected" | "interviewing" | "hired";
          chat_log: Json;
          test_result: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          job_id: string;
          type: "scout" | "application" | "interview";
          status?: "pending" | "rejected" | "interviewing" | "hired";
          chat_log?: Json;
          test_result?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Insert"]>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          logo_url: string | null;
          industry: string | null;
          size: "startup" | "smb" | "enterprise" | null;
          description: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          logo_url?: string | null;
          industry?: string | null;
          size?: "startup" | "smb" | "enterprise" | null;
          description?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      pricing_model: "subscription" | "usage_based";
      job_status: "open" | "closed" | "filled";
      interaction_type: "scout" | "application" | "interview";
      interaction_status: "pending" | "rejected" | "interviewing" | "hired";
      company_size: "startup" | "smb" | "enterprise";
    };
    CompositeTypes: Record<string, never>;
  };
};
