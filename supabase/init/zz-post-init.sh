#!/bin/sh
# migrate.sh 実行後に Supabase サービスロールのパスワードを設定する
# アルファベット順で migrate.sh より後に実行される
set -eu

psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -d postgres <<SQL
-- supabase ロールが存在しない場合は作成
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase') THEN
    CREATE ROLE supabase SUPERUSER LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS
      PASSWORD '$POSTGRES_PASSWORD';
  END IF;
END
\$\$;

-- サービスロールのパスワード設定
ALTER USER supabase_admin         WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER USER supabase               WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER USER supabase_auth_admin    WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER USER authenticator          WITH PASSWORD '$POSTGRES_PASSWORD';
ALTER USER supabase_storage_admin WITH PASSWORD '$POSTGRES_PASSWORD';

-- GoTrue が auth 関数を REPLACE できるよう所有権を付与
ALTER FUNCTION auth.uid()   OWNER TO supabase_auth_admin;
ALTER FUNCTION auth.role()  OWNER TO supabase_auth_admin;
ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;
ALTER SCHEMA auth OWNER TO supabase_auth_admin;

-- Realtime 用スキーマ
CREATE SCHEMA IF NOT EXISTS _realtime AUTHORIZATION supabase_admin;
SQL
