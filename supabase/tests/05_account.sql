-- delete_my_account removes the auth user and everything they own.

begin;
select tests.as_user('alice');
select tests.set('alice_grp', public.create_group('Alice Keeps This', 'soccer', 'remote', 'Toronto')::text);
select tests.set('alice_game', public.create_game('soccer', 'Christie Pits', 43.6645, -79.4205,
                                                  now() + interval '1 day', 60, 10)::text);

select tests.as_user('gail');
select tests.set('gail_grp', public.create_group('Gail Hosts This', 'pickleball', 'remote', 'Toronto')::text);
select tests.set('gail_game', public.create_game('pickleball', 'Trinity Bellwoods', 43.6475, -79.4135,
                                                 now() + interval '1 day', 60, 8)::text);
select public.join_group(tests.get('alice_grp')::uuid);
select public.join_game(tests.get('alice_game')::uuid);
insert into public.group_messages (group_id, body) values (tests.get('alice_grp')::uuid, 'Thanks for the invite');
insert into public.group_messages (group_id, body) values (tests.get('gail_grp')::uuid, 'Welcome all');
insert into public.blocks (blocked_id) values (tests.uid('erin'));
insert into public.reports (target_type, target_id, reason) values ('user', tests.uid('fred')::text, 'spam');
select tests.as_user('alice');
insert into public.group_messages (group_id, body) values (tests.get('alice_grp')::uuid, 'Pitch is booked');
select tests.set('m_alice', (select max(id)::text from public.group_messages));
select tests.as_user('gail');
insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_alice'), 'spam');
select tests.as_user('fred');
insert into public.reports (target_type, target_id, reason) values ('user', tests.uid('gail')::text, 'harassment');

select tests.as_user('bob');
select public.join_group(tests.get('gail_grp')::uuid);
select public.join_game(tests.get('gail_game')::uuid);
insert into public.blocks (blocked_id) values (tests.uid('gail'));

select tests.as_user('fred');
select public.join_group(tests.get('alice_grp')::uuid);
select public.join_group(tests.get('gail_grp')::uuid);
reset role;
update public.group_members set role = 'cohost'
where group_id = tests.get('alice_grp')::uuid and user_id = tests.uid('fred');
insert into public.group_bans (group_id, user_id, banned_by) values (tests.get('alice_grp')::uuid, tests.uid('dan'), tests.uid('gail'));

select tests.as_user('gail');
select public.delete_my_account();

reset role;
select tests.check(not exists (select 1 from auth.users where id = tests.uid('gail')), 'auth user deleted');
select tests.check(not exists (select 1 from public.profiles where id = tests.uid('gail')), 'profile deleted');
select tests.check(not exists (select 1 from public.games where host_id = tests.uid('gail')), 'hosted games deleted');
select tests.check(not exists (select 1 from public.game_players where game_id = tests.get('gail_game')::uuid),
                   'players of hosted games removed');
select tests.check(not exists (select 1 from public.game_players where user_id = tests.uid('gail')), 'game memberships deleted');
select tests.check(not exists (select 1 from public.groups where host_id = tests.uid('gail')), 'hosted groups deleted');
select tests.check(not exists (select 1 from public.group_messages where group_id = tests.get('gail_grp')::uuid),
                   'messages in hosted groups deleted');
select tests.check(not exists (select 1 from public.group_members where user_id = tests.uid('gail')), 'group memberships deleted');
select tests.check(not exists (select 1 from public.group_messages where sender_id = tests.uid('gail')), 'sent messages deleted');
select tests.check(not exists (select 1 from public.blocks where tests.uid('gail') in (blocker_id, blocked_id)), 'blocks deleted');
select tests.check(not exists (select 1 from public.reports where reporter_id = tests.uid('gail')),
                   'no reports reference the deleted reporter');
select tests.eq((select count(*)::int from public.reports where reporter_id is null), 2,
                'reports filed by the deleted user kept, anonymised');
select tests.check(exists (select 1 from public.reports where target_type = 'user' and target_id = tests.uid('gail')::text
                           and reporter_id = tests.uid('fred')), 'reports about the deleted user kept');
-- The anonymised report still counts toward the 3-reporter auto-hide.
select tests.as_user('fred');
insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_alice'), 'spam');
reset role;
select tests.check(not (select hidden from public.group_messages where id = tests.get('m_alice')::bigint),
                   'message visible with 2 reporters (one anonymised)');
select tests.as_user('alice');
insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_alice'), 'other');
reset role;
select tests.check((select hidden from public.group_messages where id = tests.get('m_alice')::bigint),
                   'anonymised report counts toward 3-reporter hide');
select tests.check((select banned_by is null from public.group_bans where group_id = tests.get('alice_grp')::uuid
                    and user_id = tests.uid('dan')), 'bans issued by deleted user are kept, banned_by cleared');
select tests.check(exists (select 1 from public.groups where id = tests.get('alice_grp')::uuid), 'other users groups untouched');
select tests.eq((select count(*)::int from public.group_members where group_id = tests.get('alice_grp')::uuid), 2,
                'other users memberships untouched');
select tests.eq((select count(*)::int from public.game_players where game_id = tests.get('alice_game')::uuid), 1,
                'other users games untouched');

select set_config('request.jwt.claims', '', true);
select tests.as_user('gail');
select tests.throws('select * from public.nearby_games()', 'Not signed in', 'deleted user token no longer works for RPCs');
select tests.as_anon();
select tests.throws('select public.delete_my_account()', 'permission denied', 'anon cannot delete accounts');
rollback;
