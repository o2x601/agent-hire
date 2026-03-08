-- ============================================================
-- Migration 001: Extensions & ENUM Types
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMs
CREATE TYPE public.pricing_model AS ENUM (
  'subscription',
  'usage_based'
);

CREATE TYPE public.job_status AS ENUM (
  'open',
  'closed',
  'filled'
);

CREATE TYPE public.interaction_type AS ENUM (
  'scout',
  'application',
  'interview'
);

CREATE TYPE public.interaction_status AS ENUM (
  'pending',
  'rejected',
  'interviewing',
  'hired'
);

CREATE TYPE public.company_size AS ENUM (
  'startup',
  'smb',
  'enterprise'
);
