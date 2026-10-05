-- seed_demo: errors, idempotency, reviewer experience. Runs after seed_demo.sql is loaded.
-- Each run is committed so the second run really exercises the cleanup path.

insert into auth.users (id, email, raw_user_meta_data) values
  (tests.uid('host2'), 'host2@test.local',
   '{"display_name":"Sam","birth_date":"1991-04-04","terms_version":"2026-10-04"}');

begin;
select tests.throws($q$select public.seed_demo('missing@test.local', 'host@test.local')$q$,
                    'no auth user with email missing@test.local', 'seed_demo errors on unknown reviewer');
select tests.throws($q$select public.seed_demo('reviewer@test.local', 'nobody@test.local')$q$,
                    'no auth user with email nobody@test.local', 'seed_demo errors on unknown host');
select tests.throws($q$select public.seed_demo('reviewer@test.local', 'host@test.local', 'nobody2@test.local')$q$,
                    'no auth user with email nobody2@test.local', 'seed_demo errors on unknown second host');
select tests.throws($q$select public.seed_demo('reviewer@test.local', 'host@test.local', 'host@test.local')$q$,
                    'second host must be a different account', 'seed_demo rejects a duplicate second host');
select tests.as_user('rev');
select tests.throws($q$select public.seed_demo('reviewer@test.local', 'host@test.local')$q$,
                    'permission denied', 'app users cannot run seed_demo');
rollback;

-- One host (second host omitted) -----------------------------------------------
select public.seed_demo('reviewer@test.local', 'host@test.local');
select public.seed_demo('REVIEWER@test.local', 'host@test.local');

begin;
select tests.eq((select count(*)::int from public.games where is_demo), 6, 'seed twice leaves exactly 6 demo games');
select tests.eq((select count(*)::int from public.groups where is_demo), 3, 'seed twice leaves exactly 3 demo groups');
select tests.eq((select count(*)::int from public.group_messages m join public.groups g on g.id = m.group_id where g.is_demo), 7,
                'seed twice leaves exactly 7 demo messages');
select tests.check((select is_reviewer from public.profiles where id = tests.uid('rev')), 'reviewer flagged');
select tests.check((select min(starts_at) >= now() + interval '2 hours' and max(starts_at) <= now() + interval '6 days'
                    from public.games where is_demo), 'demo games start 2 hours to 6 days out');
select tests.eq((select count(distinct sport)::int from public.games where is_demo), 3, 'demo games cover 3 sports');

select tests.as_user('rev');
select tests.eq((select count(*)::int from public.nearby_games(p_city => 'Toronto') where host_id = tests.uid('host')), 6,
                'reviewer sees 6 demo games by city');
select tests.eq((select count(*)::int from public.nearby_games(43.6550, -79.4100) where host_id = tests.uid('host')), 6,
                'reviewer sees 6 demo games near downtown');
select tests.eq((select count(*)::int from public.nearby_games(p_city => 'Toronto') where is_joined), 3,
                'reviewer joined to three games');
select tests.check((select min(starts_at) >= now() + interval '1 day' from public.my_games()),
                   'every joined game starts at least a day out, so it is still upcoming during review');
select tests.eq((select count(*)::int from public.nearby_games(p_city => 'Toronto') where not is_joined), 3,
                'three demo games stay open to join');
select tests.ok($q$select public.check_in((select id from public.my_games() order by starts_at limit 1), 0, 0)$q$,
                'reviewer can check in to demo game from anywhere');
select tests.ok($q$select public.check_in((select id from public.my_games() order by starts_at desc limit 1), null, null)$q$,
                'reviewer can check in without any location');
select tests.eq((select count(*)::int from public.nearby_groups(43.6550, -79.4100)), 3, 'reviewer sees 3 demo groups');
select tests.eq((select count(*)::int from public.my_groups()), 1, 'reviewer is a member of one demo group');
select tests.eq((select count(*)::int from public.group_messages
                 where group_id = (select id from public.my_groups())), 3, 'reviewer reads seeded chat');
select tests.ok($q$insert into public.group_messages (group_id, body)
                   values ((select id from public.my_groups()), 'Looking forward to it')$q$,
                'reviewer can post in demo group');
select tests.as_user('host');
select tests.check((select count(*) = 7 and bool_and(sender_name = 'Jordan') from public.group_messages
                    where sender_id = auth.uid()), 'seeded messages carry host name');
rollback;

-- Two hosts (recommended for App Review) ---------------------------------------
select public.seed_demo('reviewer@test.local', 'host@test.local', 'host2@test.local');

begin;
select tests.eq((select count(*)::int from public.games where is_demo), 6, 'two-host seed replaces demo games');
select tests.eq((select count(*)::int from public.games where is_demo and host_id = tests.uid('host2')), 2,
                'second host owns the basketball games');
select tests.eq((select count(*)::int from public.groups where is_demo and host_id = tests.uid('host2')), 1,
                'second host owns one group');

select tests.as_user('rev');
select tests.eq((select count(*)::int from public.nearby_games(p_city => 'Toronto')), 6, 'reviewer sees all 6 games');
select tests.check((select count(distinct sender_id) = 2 from public.group_messages
                    where group_id = (select id from public.my_groups())),
                   'reviewer group chat has messages from two people');
select tests.check((select bool_and(jsonb_array_length(to_jsonb(roster)) >= 3)
                    from public.my_games() mg, public.game_detail(mg.id) d),
                   'joined game rosters show both hosts and the reviewer');

-- The App Review path: block the second host, the app must still be full.
insert into public.blocks (blocked_id) values (tests.uid('host2'));
select tests.eq((select count(*)::int from public.nearby_games(p_city => 'Toronto')), 4,
                'after blocking the second host, 4 games remain');
select tests.eq((select count(*)::int from public.nearby_groups(43.6550, -79.4100)), 2,
                'after blocking the second host, 2 groups remain');
select tests.check((select count(*) > 0 and bool_and(sender_id = tests.uid('host'))
                    from public.group_messages where group_id = (select id from public.my_groups())),
                   'after blocking, chat keeps the other host messages and hides the blocked ones');
rollback;

-- Blocked people also disappear from rosters and member lists.
select public.seed_demo('reviewer@test.local', 'host@test.local', 'host2@test.local');
begin;
select tests.as_user('rev');
insert into public.blocks (blocked_id) values (tests.uid('host2'));
select tests.check((select bool_and(not (roster @> jsonb_build_array(jsonb_build_object('user_id', tests.uid('host2')))))
                    from public.my_games() mg, public.game_detail(mg.id) d),
                   'blocked user hidden from game rosters');
select tests.check((select not (members @> jsonb_build_array(jsonb_build_object('user_id', tests.uid('host2'))))
                    from public.group_detail((select id from public.my_groups()))),
                   'blocked user hidden from group member list');
rollback;
