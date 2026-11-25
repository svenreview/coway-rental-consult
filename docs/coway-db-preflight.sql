-- COWAY DB CONSOLIDATION: READ-ONLY PREFLIGHT
-- 이 파일은 원본 coway-water와 대상 coway-rental-db에서 각각 실행할 수 있습니다.
-- 개인정보를 SELECT하거나 데이터를 수정하지 않습니다.
-- 결과의 프로젝트/DB 식별 정보는 공개하지 마세요.

-- A. DB 기본 정보와 public 테이블 목록
select current_database() as db_name, current_user as sql_user, current_setting('server_version') as postgres_version;
select table_schema, table_name, table_type
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- B. public 테이블의 예상 레코드 수(통계값이며 정확하지 않을 수 있음)
select schemaname, relname as table_name, n_live_tup as approximate_rows
from pg_stat_user_tables where schemaname = 'public'
order by relname;

-- C. 서비스 관련 객체(함수, 뷰)
select schemaname, viewname from pg_views where schemaname = 'public' order by viewname;
select routine_schema, routine_name, routine_type from information_schema.routines
where routine_schema = 'public' order by routine_name;

-- D. RLS와 정책 현황
select n.nspname as schema_name, c.relname as relation_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
order by c.relname;
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies where schemaname='public' order by tablename, policyname;

-- E. 대상 DB에서 public.inquiries 존재 확인 (없으면 결과 0행, 오류 없음)
select to_regclass('public.inquiries') as active_inquiries_table;
