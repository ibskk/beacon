-- Group chat: membership, server-owned fields, blocks, filters, rate limit, mutes, reports.

begin;
select tests.as_user('alice');
select tests.set('grp', public.create_group('Chat Test FC', 'soccer', 'remote', 'Toronto')::text);
select tests.as_user('bob');
select public.join_group(tests.get('grp')::uuid);
select tests.as_user('dan');
select public.join_group(tests.get('grp')::uuid);
select tests.as_user('erin');
select public.join_group(tests.get('grp')::uuid);
reset role;
-- Bob, Dan, Erin are established members (joined over a week ago).
update public.group_members set joined_at = now() - interval '8 days'
where group_id = tests.get('grp')::uuid and user_id in (tests.uid('bob'), tests.uid('dan'), tests.uid('erin'));

-- Server-owned fields.
select tests.as_user('bob');
insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, '  Anyone up for Thursday?  ');
select tests.check((select sender_id = tests.uid('bob') and sender_name = 'Bob' and body = 'Anyone up for Thursday?'
                           and created_at = now() and not hidden
                    from public.group_messages where group_id = tests.get('grp')::uuid),
                   'sender_id, sender_name, created_at set by server; body trimmed');
select tests.set('m_bob', (select max(id)::text from public.group_messages));
select tests.throws($q$insert into public.group_messages (group_id, sender_id, body)
                       values (tests.get('grp')::uuid, tests.uid('alice'), 'spoof')$q$,
                    'permission denied', 'client cannot set sender_id');
select tests.throws($q$insert into public.group_messages (group_id, body, created_at)
                       values (tests.get('grp')::uuid, 'backdate', now() - interval '1 day')$q$,
                    'permission denied', 'client cannot set created_at');
select tests.throws($q$update public.group_messages set body = 'edited'$q$, 'permission denied', 'messages cannot be edited');
select tests.throws($q$delete from public.group_messages$q$, 'permission denied', 'messages cannot be deleted by clients');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, '   ')$q$,
                    'Message cannot be empty', 'empty message rejected');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, repeat('a', 1001))$q$,
                    'too long', 'message over 1000 chars rejected');

-- Non-members.
select tests.as_user('cara');
select tests.eq((select count(*)::int from public.group_messages where group_id = tests.get('grp')::uuid), 0,
                'non-member cannot read messages');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'hi')$q$,
                    'You are not a member of this group', 'non-member cannot post');

-- Members read; blocked senders hidden for the blocker only.
select tests.as_user('alice');
select tests.eq((select count(*)::int from public.group_messages where group_id = tests.get('grp')::uuid), 1, 'member reads messages');
insert into public.blocks (blocked_id) values (tests.uid('bob'));
insert into public.blocks (blocked_id) values (tests.uid('bob'));   -- duplicate is a no-op
select tests.eq((select count(*)::int from public.blocks), 1, 'block listed once');
select tests.throws($q$insert into public.blocks (blocked_id) values (auth.uid())$q$, 'cannot block yourself', 'self block rejected');
select tests.eq((select count(*)::int from public.group_messages where group_id = tests.get('grp')::uuid), 0,
                'blocked sender messages hidden');
select tests.as_user('dan');
select tests.eq((select count(*)::int from public.blocks), 0, 'blocks are private to the blocker');
select tests.eq((select count(*)::int from public.group_messages where group_id = tests.get('grp')::uuid), 1,
                'other members still see the message');
select tests.as_user('alice');
delete from public.blocks where blocked_id = tests.uid('bob');
select tests.eq((select count(*)::int from public.group_messages where group_id = tests.get('grp')::uuid), 1,
                'unblocking restores messages');

-- Content filter.
select tests.as_user('dan');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'you are a RETARD')$q$,
                    'Message blocked by content filter', 'slur blocked (case-insensitive)');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'just kill yourself')$q$,
                    'Message blocked by content filter', 'multi-word term blocked');
select tests.ok($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'Scunthorpe won 3-2 on Saturday')$q$,
                'word boundaries avoid false positives');
reset role;
insert into public.blocked_terms (term) values ('scammer');
select tests.as_user('dan');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'that guy is a scammer')$q$,
                    'Message blocked by content filter', 'moderator-added term blocked');

-- New-member link and phone limits.
select tests.as_user('cara');
select public.join_group(tests.get('grp')::uuid);
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'join us at https://example.com')$q$,
                    'New members cannot post links or phone numbers for 7 days', 'new member link blocked');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'see www.example.org')$q$,
                    'New members cannot post links', 'new member www link blocked');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'text me at 416-555-0199')$q$,
                    'New members cannot post links or phone numbers', 'new member phone number blocked');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'email me cara@mail.com')$q$,
                    'New members cannot post links or phone numbers', 'new member email blocked');
select tests.ok($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'I can make 7:30, 5v5 is fine. Back by 10.')$q$,
                'new member normal message with times and numbers allowed');
select tests.as_user('bob');
select tests.ok($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'Field map: https://example.com/map')$q$,
                'established member can post a link');

-- Mute.
reset role;
update public.group_members set muted_until = now() + interval '1 hour'
where group_id = tests.get('grp')::uuid and user_id = tests.uid('cara');
select tests.as_user('cara');
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'hello')$q$,
                    'You are muted in this group', 'muted member cannot post');

-- Rate limit: 10 per minute per sender per group.
select tests.as_user('erin');
do $$
begin
  for i in 1..10 loop
    insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'message ' || i);
  end loop;
end;
$$;
select tests.throws($q$insert into public.group_messages (group_id, body) values (tests.get('grp')::uuid, 'one more')$q$,
                    'Slow down: 10 messages per minute', 'rate limit at 11th message');

-- Reports: 3 distinct reporters hide a message.
select tests.as_user('alice');
insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_bob'), 'spam');
insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_bob'), 'spam');  -- ignored
select tests.as_user('dan');
insert into public.reports (target_type, target_id, reason, details) values ('message', tests.get('m_bob'), 'harassment', 'rude');
select tests.check(exists (select 1 from public.group_messages where id = tests.get('m_bob')::bigint),
                   'message still visible after 2 reporters (one duplicate)');
select tests.as_user('fred');
select tests.throws($q$insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_bob'), 'spam')$q$,
                    'Invalid report target', 'non-member cannot report a message');
select tests.throws($q$insert into public.reports (target_type, target_id, reason) values ('user', 'not-a-uuid', 'spam')$q$,
                    'Invalid report target', 'malformed target rejected');
select tests.throws($q$insert into public.reports (target_type, target_id, reason) values ('user', tests.uid('bob')::text, 'rude')$q$,
                    'Invalid report reason', 'invalid reason rejected');
select tests.ok($q$insert into public.reports (target_type, target_id, reason) values ('user', tests.uid('bob')::text, 'harassment')$q$,
                'user can report a user');
select tests.as_user('erin');
insert into public.reports (target_type, target_id, reason) values ('message', tests.get('m_bob'), 'hate');
select tests.check(not exists (select 1 from public.group_messages where id = tests.get('m_bob')::bigint),
                   'message hidden after 3 distinct reporters');
select tests.as_user('bob');
select tests.check(not exists (select 1 from public.group_messages where id = tests.get('m_bob')::bigint),
                   'hidden message hidden from its sender too');
reset role;
select tests.check((select hidden from public.group_messages where id = tests.get('m_bob')::bigint), 'hidden flag set');
select tests.eq((select count(*)::int from public.reports where target_type = 'message' and target_id = tests.get('m_bob')), 3,
                'duplicate report not stored');
select tests.check((select reporter_id = tests.uid('dan') from public.reports where details = 'rude'),
                   'reporter_id defaults to caller');
rollback;
