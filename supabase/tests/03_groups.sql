-- Groups: visibility, age/gender rules, requests, codes, removal bans, host transfer, cap.

begin;
select tests.as_user('alice');   -- woman, 32
select tests.set('pub', public.create_group('Christie Pits Soccer', 'soccer', 'in_person', 'Toronto',
                                            43.6645, -79.4205, 5, 18, 'public', 'open', '{7v7}')::text);
select tests.set('req', public.create_group('Bellwoods Pickleball', 'pickleball', 'in_person', 'Toronto',
                                            43.6475, -79.4135, 5, 18, 'request')::text);
select tests.set('inv', public.create_group('Secret Hoops', 'basketball', 'in_person', 'Toronto',
                                            43.6600, -79.3600, 5, 18, 'invite')::text);
select tests.set('age30', public.create_group('Thirty Plus Soccer', 'soccer', 'in_person', 'Toronto',
                                              43.6555, -79.4340, 5, 30)::text);
select tests.set('wnb', public.create_group('Women and NB Pickleball', 'pickleball', 'in_person', 'Toronto',
                                            43.6555, -79.4340, 5, 18, 'public', 'women_nb')::text);
select tests.set('remote', public.create_group('Soccer Tactics Talk', 'soccer', 'remote', 'Toronto')::text);
select tests.set('invcode', (select join_code from public.group_detail(tests.get('inv')::uuid)));
select tests.set('age30code', (select join_code from public.group_detail(tests.get('age30')::uuid)));

select tests.check((select lat = 43.66 and lng = -79.42 and my_role = 'host' and is_member and member_count = 1
                           and join_code ~ '^[A-HJ-NP-Z2-9]{6}$' and jsonb_array_length(members) = 1
                    from public.group_detail(tests.get('pub')::uuid)),
                   'create_group rounds area to 0.01 deg, host is member with code');
select tests.check((select lat is null and lng is null and distance_km is null
                    from public.group_detail(tests.get('remote')::uuid)), 'remote group has no location');
select tests.throws($q$select public.create_group('ab', 'soccer', 'remote', 'Toronto')$q$,
                    'Group name must be 3 to 60', 'group name length enforced');
select tests.throws($q$select public.create_group('Slut Squad', 'soccer', 'remote', 'Toronto')$q$,
                    'not allowed', 'group name content filter');
select tests.throws($q$select public.create_group('Nowhere FC', 'soccer', 'in_person', 'Toronto')$q$,
                    'Choose a location', 'in_person group requires a location');
select tests.throws($q$select public.create_group('Wide FC', 'soccer', 'in_person', 'Toronto', 43.66, -79.42, 30)$q$,
                    'Radius must be 1 to 25', 'radius range enforced');
select tests.throws($q$select public.create_group('Odd FC', 'soccer', 'remote', 'Toronto', null, null, 5, 19)$q$,
                    'Invalid minimum age', 'min_age options enforced');
select tests.throws($q$select public.create_group('Forty FC', 'soccer', 'remote', 'Toronto', null, null, 5, 40)$q$,
                    'aged 40', 'host must meet min_age');

-- Discovery as bob (man, 27) near Christie Pits.
select tests.as_user('bob');
select tests.check(exists (select 1 from public.nearby_groups(43.6645, -79.4205) where id = tests.get('pub')::uuid
                           and member_count = 1 and not is_member and my_role is null and distance_km < 1),
                   'public group listed near user');
select tests.check(exists (select 1 from public.nearby_groups(43.6645, -79.4205) where id = tests.get('req')::uuid),
                   'request group listed');
select tests.check(not exists (select 1 from public.nearby_groups(43.6645, -79.4205) where id = tests.get('inv')::uuid),
                   'invite group never listed');
select tests.check(not exists (select 1 from public.nearby_groups(p_city => 'Toronto') where id = tests.get('inv')::uuid),
                   'invite group never listed by city');
select tests.check(not exists (select 1 from public.nearby_groups(43.6645, -79.4205) where id = tests.get('age30')::uuid),
                   'group above caller age not listed');
select tests.check(not exists (select 1 from public.nearby_groups(43.6645, -79.4205) where id = tests.get('wnb')::uuid),
                   'women_nb group not listed for men');
select tests.check(exists (select 1 from public.nearby_groups(p_city => 'Toronto') where id = tests.get('pub')::uuid
                           and distance_km is null),
                   'nearby_groups by city');
select tests.check(not exists (select 1 from public.nearby_groups(49.2827, -123.1207) where id = tests.get('pub')::uuid),
                   'in_person group outside its radius not listed');
select tests.check(exists (select 1 from public.nearby_groups(49.2827, -123.1207, 'Toronto') where id = tests.get('remote')::uuid),
                   'remote group in same city listed with coords');
select tests.check(not exists (select 1 from public.nearby_groups(43.6645, -79.4205, 'Ottawa') where id = tests.get('remote')::uuid),
                   'remote group in other city not listed');
select tests.check(not exists (select 1 from public.nearby_groups(43.6645, -79.4205, 'Toronto', 'basketball')
                               where sport <> 'basketball'),
                   'nearby_groups sport filter');
select tests.throws($q$select * from public.group_detail(tests.get('inv')::uuid)$q$, 'Group not found',
                    'invite group detail hidden from non-members');
select tests.check((select join_code is null and jsonb_array_length(members) = 0
                    from public.group_detail(tests.get('pub')::uuid)),
                   'non-member sees no code and no members');

-- Invite and min_age enforcement.
select tests.throws($q$select public.join_group(tests.get('inv')::uuid)$q$, 'This group is invite-only', 'invite group join rejected');
select tests.throws($q$select public.join_group(tests.get('age30')::uuid)$q$, 'aged 30', 'min_age enforced on join');
select tests.throws($q$select public.join_group_by_code(tests.get('age30code'))$q$, 'aged 30', 'min_age enforced on code join');
select tests.throws($q$select public.join_group(tests.get('wnb')::uuid)$q$, 'women and non-binary', 'gender rule enforced on join');
select tests.throws($q$select public.join_group_by_code('ABCDEF')$q$, 'Invalid code', 'bad group code rejected');
select tests.eq(public.join_group_by_code(lower(tests.get('invcode'))), tests.get('inv')::uuid, 'invite group joinable by code');
select tests.check(exists (select 1 from public.my_groups() where id = tests.get('inv')::uuid and my_role = 'member'),
                   'my_groups includes code-joined group');
select tests.check((select join_code is null and jsonb_array_length(members) = 2
                    from public.group_detail(tests.get('inv')::uuid)),
                   'member sees members but not join_code');
select tests.eq(public.join_group(tests.get('pub')::uuid), 'joined', 'public join returns joined');
select tests.eq(public.join_group(tests.get('pub')::uuid), 'joined', 'public join idempotent');

-- Request / approve / decline.
select tests.eq(public.join_group(tests.get('req')::uuid), 'requested', 'request group returns requested');
select tests.check((select has_requested and not is_member from public.nearby_groups(43.6645, -79.4205)
                    where id = tests.get('req')::uuid), 'has_requested flag');
select tests.eq((select count(*)::int from public.group_requests), 1, 'requester sees own request');
select tests.as_user('cara');
select tests.eq((select count(*)::int from public.group_requests), 0, 'others cannot see the request');
select tests.throws($q$select public.approve_request(tests.get('req')::uuid, tests.uid('bob'))$q$,
                    'Only the host or a cohost', 'non-admin cannot approve');
select tests.eq(public.join_group(tests.get('req')::uuid), 'requested', 'cara requests');
select tests.as_user('alice');
select tests.eq((select count(*)::int from public.group_requests where group_id = tests.get('req')::uuid), 2,
                'host sees requests for their group');
select tests.ok($q$select public.approve_request(tests.get('req')::uuid, tests.uid('bob'))$q$, 'host approves');
select tests.ok($q$select public.decline_request(tests.get('req')::uuid, tests.uid('cara'))$q$, 'host declines');
select tests.eq((select count(*)::int from public.group_requests where group_id = tests.get('req')::uuid), 0,
                'requests cleared');
select tests.throws($q$select public.approve_request(tests.get('req')::uuid, tests.uid('cara'))$q$,
                    'Request not found', 'cannot approve a declined request');
select tests.as_user('bob');
select tests.check((select is_member and my_role = 'member' from public.group_detail(tests.get('req')::uuid)),
                   'approved user is a member');

-- Remove bans rejoin; cohost limits.
select tests.as_user('alice');
select tests.ok($q$select public.remove_member(tests.get('pub')::uuid, tests.uid('bob'))$q$, 'host removes member');
select tests.throws($q$select public.remove_member(tests.get('pub')::uuid, tests.uid('alice'))$q$,
                    'leave group instead', 'host cannot remove self');
select tests.as_user('bob');
select tests.check(not exists (select 1 from public.my_groups() where id = tests.get('pub')::uuid), 'removed member gone');
select tests.throws($q$select public.join_group(tests.get('pub')::uuid)$q$, 'You cannot join this group', 'removed user banned from rejoining');
select tests.check(not exists (select 1 from public.nearby_groups(p_city => 'Toronto') where id = tests.get('pub')::uuid),
                   'banned user no longer sees group');
select tests.throws($q$select * from public.group_detail(tests.get('pub')::uuid)$q$, 'Group not found', 'banned user cannot view group');
select tests.as_user('alice');
select tests.set('pubcode', (select join_code from public.group_detail(tests.get('pub')::uuid)));
select tests.as_user('bob');
select tests.throws($q$select public.join_group_by_code(tests.get('pubcode'))$q$, 'You cannot join this group',
                    'removed user banned from code rejoin');
select tests.as_user('cara');
select public.join_group(tests.get('pub')::uuid);
select tests.as_user('dan');
select public.join_group(tests.get('pub')::uuid);
select tests.as_user('erin');
select public.join_group(tests.get('pub')::uuid);
reset role;
update public.group_members set role = 'cohost' where group_id = tests.get('pub')::uuid and user_id = tests.uid('cara');
update public.group_members set joined_at = now() - interval '1 day' where group_id = tests.get('pub')::uuid and user_id = tests.uid('dan');
select tests.as_user('cara');
select tests.check((select join_code is not null from public.group_detail(tests.get('pub')::uuid)), 'cohost sees join_code');
select tests.throws($q$select public.remove_member(tests.get('pub')::uuid, tests.uid('alice'))$q$,
                    'The host cannot be removed', 'cohost cannot remove host');
select tests.as_user('dan');
select tests.throws($q$select public.remove_member(tests.get('pub')::uuid, tests.uid('erin'))$q$,
                    'Only the host or a cohost', 'member cannot remove');

-- Host leaving transfers to oldest cohost, then oldest member, then archives.
select tests.as_user('alice');
select public.leave_group(tests.get('pub')::uuid);
reset role;
select tests.check((select host_id = tests.uid('cara') from public.groups where id = tests.get('pub')::uuid),
                   'host leave transfers to cohost');
select tests.as_user('cara');
select tests.eq((select my_role from public.group_detail(tests.get('pub')::uuid)), 'host', 'cohost became host');
select public.leave_group(tests.get('pub')::uuid);
select tests.as_user('dan');
select tests.eq((select my_role from public.group_detail(tests.get('pub')::uuid)), 'host', 'oldest member became host');
select public.leave_group(tests.get('pub')::uuid);
select tests.as_user('erin');
select public.leave_group(tests.get('pub')::uuid);
reset role;
select tests.eq((select status from public.groups where id = tests.get('pub')::uuid), 'archived', 'last member leaving archives group');
select tests.as_user('fred');
select tests.throws($q$select public.join_group(tests.get('pub')::uuid)$q$, 'Group not found', 'archived group not joinable');

-- Erin (46, woman) sees the restricted groups.
select tests.as_user('erin');
select tests.check(exists (select 1 from public.nearby_groups(43.6555, -79.4340) where id = tests.get('age30')::uuid),
                   'older user sees min_age group');
select tests.check(exists (select 1 from public.nearby_groups(43.6555, -79.4340) where id = tests.get('wnb')::uuid),
                   'woman sees women_nb group');
select tests.eq(public.join_group(tests.get('wnb')::uuid), 'joined', 'woman joins women_nb group');

-- Blocked host hides group.
select tests.as_user('fred');
insert into public.blocks (blocked_id) values (tests.uid('alice'));
select tests.check(not exists (select 1 from public.nearby_groups(p_city => 'Toronto') where id = tests.get('req')::uuid),
                   'groups of blocked hosts not listed');
select tests.throws($q$select public.join_group(tests.get('req')::uuid)$q$, 'You cannot join this group', 'cannot join blocked host group');
rollback;

-- 200 member cap.
begin;
select tests.as_user('alice');
select tests.set('big', public.create_group('Big Group', 'soccer', 'remote', 'Toronto')::text);
reset role;
insert into auth.users (email, raw_user_meta_data)
select 'bulk' || i || '@test.local',
       '{"display_name":"Bulk Player","birth_date":"1990-01-01","terms_version":"2026-10-04"}'::jsonb
from generate_series(1, 199) i;
insert into public.group_members (group_id, user_id)
select tests.get('big')::uuid, u.id from auth.users u where u.email like 'bulk%';
select tests.as_user('bob');
select tests.throws($q$select public.join_group(tests.get('big')::uuid)$q$, 'This group is full', '200 member cap enforced');
rollback;
