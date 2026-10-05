-- Grants, RLS on profiles, anon lockout.

begin;
select tests.as_anon();
select tests.throws('select * from public.profiles', 'permission denied', 'anon cannot read profiles');
select tests.throws('select * from public.public_profiles', 'permission denied', 'anon cannot read public_profiles');
select tests.throws('select * from public.games', 'permission denied', 'anon cannot read games');
select tests.throws('select * from public.game_players', 'permission denied', 'anon cannot read game_players');
select tests.throws('select * from public.groups', 'permission denied', 'anon cannot read groups');
select tests.throws('select * from public.group_members', 'permission denied', 'anon cannot read group_members');
select tests.throws('select * from public.group_requests', 'permission denied', 'anon cannot read group_requests');
select tests.throws('select * from public.group_bans', 'permission denied', 'anon cannot read group_bans');
select tests.throws('select * from public.group_messages', 'permission denied', 'anon cannot read group_messages');
select tests.throws('select * from public.blocks', 'permission denied', 'anon cannot read blocks');
select tests.throws('select * from public.reports', 'permission denied', 'anon cannot read reports');
select tests.throws('select * from public.blocked_terms', 'permission denied', 'anon cannot read blocked_terms');
select tests.throws('select * from public.nearby_games()', 'permission denied', 'anon cannot call nearby_games');
select tests.throws('select * from public.nearby_groups()', 'permission denied', 'anon cannot call nearby_groups');
select tests.throws('select public.delete_my_account()', 'permission denied', 'anon cannot call delete_my_account');
select tests.throws($q$insert into public.reports (target_type, target_id, reason)
                       values ('user', gen_random_uuid()::text, 'spam')$q$,
                    'permission denied', 'anon cannot insert reports');
select tests.check(
  not exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public'
  ), 'anon has no table grants in public');
select tests.check(
  not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
  ), 'anon cannot execute any public function');
rollback;

begin;
select tests.as_user('alice');
select tests.eq((select count(*) from public.profiles)::int, 1, 'user sees only their own profile row');
select tests.eq((select display_name from public.profiles where id = tests.uid('bob')), null::text,
                'other profiles are not readable');
select tests.eq((select display_name from public.public_profiles where id = tests.uid('bob')), 'Bob',
                'public_profiles exposes display names');
select tests.eq((select count(*) from information_schema.columns
                 where table_schema = 'public' and table_name = 'public_profiles')::int, 2,
                'public_profiles has only id and display_name');
select tests.ok($q$update public.profiles set display_name = 'Alice B', city = 'Toronto', gender = 'woman'
                   where id = auth.uid()$q$, 'user can update own display_name, city, gender');
select tests.eq((select display_name from public.profiles where id = auth.uid()), 'Alice B', 'display name updated');
select tests.throws($q$update public.profiles set is_reviewer = true where id = auth.uid()$q$,
                    'permission denied', 'user cannot set is_reviewer');
select tests.throws($q$update public.profiles set birth_date = '2015-01-01' where id = auth.uid()$q$,
                    'permission denied', 'user cannot change birth_date');
select tests.throws($q$update public.profiles set display_name = 'x' where id = auth.uid()$q$,
                    'Display name must be 2 to 40', 'display name length enforced on update');
select tests.throws($q$update public.profiles set display_name = 'big slut' where id = auth.uid()$q$,
                    'not allowed', 'display name content filter on update');
update public.profiles set display_name = 'Hacked' where id = tests.uid('bob');
select tests.eq((select display_name from public.public_profiles where id = tests.uid('bob')), 'Bob',
                'cannot update another user profile');
select tests.throws('delete from public.profiles', 'permission denied', 'user cannot delete profiles');
select tests.throws($q$insert into public.profiles (id, display_name, birth_date, terms_version)
                       values (gen_random_uuid(), 'Fake', '1990-01-01', 'x')$q$,
                    'permission denied', 'user cannot insert profiles');
select tests.throws('select * from public.games', 'permission denied', 'authenticated cannot read games table directly');
select tests.throws('select * from public.groups', 'permission denied', 'authenticated cannot read groups table directly');
select tests.throws('select * from public.group_members', 'permission denied', 'authenticated cannot read group_members directly');
select tests.throws('select * from public.game_players', 'permission denied', 'authenticated cannot read game_players directly');
select tests.throws('select * from public.reports', 'permission denied', 'reports are not selectable');
select tests.throws('select * from public.blocked_terms', 'permission denied', 'blocked_terms are not readable');
select tests.throws($q$select public.join_game_internal(gen_random_uuid(), auth.uid(), true)$q$,
                    'permission denied', 'internal helpers are not callable');
select tests.throws($q$select public.is_blocked_between(gen_random_uuid(), gen_random_uuid())$q$,
                    'permission denied', 'is_blocked_between not exposed');
rollback;

begin;
select tests.check(exists (select 1 from pg_publication_tables
                           where pubname = 'supabase_realtime' and schemaname = 'public'
                             and tablename = 'group_messages'),
                   'group_messages is in the supabase_realtime publication');
select tests.check(not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  'RLS enabled on every public table');
select tests.check(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%pg_temp%')),
  'every security definer function pins search_path with pg_temp');
select tests.check(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prolang <> (select oid from pg_language where lanname = 'c')
    and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')),
  'every public function pins search_path');
rollback;
