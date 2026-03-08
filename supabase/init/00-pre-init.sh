#!/bin/sh
# migrate.sh が supabase_admin で接続する前にロールを作成する
# Docker postgres の initdb フェーズでは POSTGRES_USER (postgres) で実行される
# また、Supabase サービスが使うロールのパスワードも設定する
set -eu

psql -v ON_ERROR_STOP=1 --no-password --no-psqlrc -U postgres -d postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin SUPERUSER LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS
      PASSWORD '$POSTGRES_PASSWORD';
  ELSE
    ALTER ROLE supabase_admin WITH PASSWORD '$POSTGRES_PASSWORD';
  END IF;
END
\$\$;
SQL

# init-scripts 実行後にパスワードを設定するため migrate.sh 完了後ではなく
# ここで設定しておく（init-scripts でロールが作られた後に migrate.sh が呼ばれるので
# このスクリプトは migrate.sh より先に実行されパスワードは migrate.sh 内で上書きされる）
# → 実際のパスワード設定は migrate.sh 後に行うため別ファイルで対処
