-- Games: create, discovery, joining, capacity, gender rule, leave/cancel, codes, check-in.

begin;
select tests.as_user('alice');
select tests.set('g1', public.create_game('soccer', 'Christie Pits', 43.6645, -79.4205,
                                          now() + interval '2 hours', 90, 3, 'intermediate',
                                          '{7v7,outdoor}', 'open', 'public', 'Toronto')::text);

-- Discovery with coordinates.
select tests.check(exists (select 1 from public.nearby_games(43.6650, -79.4200)
                           where id = tests.get('g1')::uuid and distance_km < 1 and is_host
                             and is_joined and spots_taken = 1 and host_name = 'Alice'
                             and abs(lat - 43.6645) < 1e-9 and abs(lng + 79.4205) < 1e-9),
                   'nearby_games with coords returns game with distance, host flags and lat/lng');
select tests.check(not exists (select 1 from public.nearby_games(49.2827, -123.1207)
                               where id = tests.get('g1')::uuid),
                   'nearby_games with far coords excludes game');
select tests.check(not exists (select 1 from public.nearby_games(43.6650, -79.4200, 25, 'Toronto', 'basketball')),
                   'nearby_games sport filter');
-- Discovery by city only.
select tests.check(exists (select 1 from public.nearby_games(p_city => 'toronto')
                           where id = tests.get('g1')::uuid and distance_km is null),
                   'nearby_games with city only matches case-insensitively, distance null');
select tests.check(not exists (select 1 from public.nearby_games(p_city => 'Montreal')),
                   'nearby_games city only excludes other cities');
select tests.throws('select * from public.nearby_games(95, 0)', 'Invalid location', 'nearby_games rejects bad coords');

-- Validation.
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() - interval '1 minute', 60, 10)$q$,
                    'Start time must be in the future', 'create_game rejects past start');
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() + interval '31 days', 60, 10)$q$,
                    'within 30 days', 'create_game rejects start beyond 30 days');
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() + interval '1 day', 20, 10)$q$,
                    'Duration', 'create_game rejects short duration');
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() + interval '1 day', 60, 41)$q$,
                    'Spots', 'create_game rejects too many spots');
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() + interval '1 day', 60, 10,
                       'any', '{beginner,5v5,coed,indoor}')$q$,
                    'up to 3 tags', 'create_game rejects 4 tags');
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() + interval '1 day', 60, 10,
                       'any', '{nightlife}')$q$,
                    'Invalid tag', 'create_game rejects unknown tag');
select tests.throws($q$select public.create_game('hockey', 'Park', 43.66, -79.42, now() + interval '1 day', 60, 10)$q$,
                    'Choose a sport', 'create_game rejects unknown sport');

-- Capacity (3 spots, host holds one).
select tests.as_user('bob');
select public.join_game(tests.get('g1')::uuid);
select tests.ok($q$select public.join_game(tests.get('g1')::uuid)$q$, 'join_game is idempotent');
select tests.as_user('cara');
select public.join_game(tests.get('g1')::uuid);
select tests.as_user('dan');
select tests.throws($q$select public.join_game(tests.get('g1')::uuid)$q$, 'Game is full', 'join_game blocks overbooking at capacity');
select tests.eq((select spots_taken from public.nearby_games(43.6650, -79.4200) where id = tests.get('g1')::uuid), 3,
                'spots_taken equals capacity');

-- Roster visibility.
select tests.eq((select jsonb_array_length(roster) from public.game_detail(tests.get('g1')::uuid)), 0,
                'non-joined user sees empty roster');
select tests.eq((select join_code from public.game_detail(tests.get('g1')::uuid)), null::text,
                'non-host does not see join_code');
select tests.as_user('bob');
select tests.eq((select jsonb_array_length(roster) from public.game_detail(tests.get('g1')::uuid)), 3,
                'joined player sees roster');
select tests.check((select is_joined and not is_host and join_code is null and status = 'open'
                    from public.game_detail(tests.get('g1')::uuid)), 'game_detail flags for player');

-- Leave / cancel permissions.
select tests.ok($q$select public.leave_game(tests.get('g1')::uuid)$q$, 'player can leave');
select tests.eq((select spots_taken from public.game_detail(tests.get('g1')::uuid)), 2, 'leave frees a spot');
select tests.throws($q$select public.cancel_game(tests.get('g1')::uuid)$q$, 'Only the host', 'non-host cannot cancel');
select tests.as_user('alice');
select tests.check((select join_code ~ '^[A-HJ-NP-Z2-9]{6}$' from public.game_detail(tests.get('g1')::uuid)),
                   'host sees a valid join_code');
select tests.throws($q$select public.leave_game(tests.get('g1')::uuid)$q$, 'host cannot leave', 'host cannot leave');
select tests.ok($q$select public.cancel_game(tests.get('g1')::uuid)$q$, 'host can cancel');
select tests.eq((select status from public.game_detail(tests.get('g1')::uuid)), 'cancelled', 'status is cancelled');
select tests.check(not exists (select 1 from public.nearby_games(43.6650, -79.4200) where id = tests.get('g1')::uuid),
                   'cancelled game not listed');
select tests.as_user('dan');
select tests.throws($q$select public.join_game(tests.get('g1')::uuid)$q$, 'Game was cancelled', 'cannot join cancelled game');
rollback;

-- women_nb rule.
begin;
select tests.as_user('alice');
select tests.set('g2', public.create_game('pickleball', 'Trinity Bellwoods', 43.6475, -79.4135,
                                          now() + interval '1 day', 60, 8, 'any', '{doubles}', 'women_nb')::text);
select tests.as_user('bob');
select tests.throws($q$select public.join_game(tests.get('g2')::uuid)$q$,
                    'This game is for women and non-binary players', 'man cannot join women_nb game');
select tests.as_user('fred');
select tests.throws($q$select public.join_game(tests.get('g2')::uuid)$q$,
                    'This game is for women and non-binary players', 'unspecified gender cannot join women_nb game');
select tests.throws($q$select public.create_game('soccer', 'Park', 43.66, -79.42, now() + interval '1 day', 60, 10,
                       'any', '{}', 'women_nb')$q$,
                    'women and non-binary', 'man cannot host women_nb game');
select tests.as_user('cara');
select tests.ok($q$select public.join_game(tests.get('g2')::uuid)$q$, 'non-binary player can join women_nb game');
select tests.as_user('erin');
select tests.ok($q$select public.join_game(tests.get('g2')::uuid)$q$, 'woman can join women_nb game');
rollback;

-- Blocks hide hosts and prevent joining; ended games.
begin;
select tests.as_user('alice');
select tests.set('g3', public.create_game('basketball', 'Regent Park', 43.6600, -79.3600,
                                          now() + interval '3 hours', 60, 10)::text);
select tests.as_user('bob');
insert into public.blocks (blocked_id) values (tests.uid('alice'));
select tests.check(not exists (select 1 from public.nearby_games(p_city => 'Toronto') where host_id = tests.uid('alice')),
                   'nearby_games excludes hosts the caller blocked');
select tests.throws($q$select public.join_game(tests.get('g3')::uuid)$q$, 'You are blocked from this game',
                    'cannot join game of blocked host');
select tests.throws($q$select * from public.game_detail(tests.get('g3')::uuid)$q$, 'Game not found',
                    'game_detail hidden for blocked host');
select tests.as_user('alice');
insert into public.blocks (blocked_id) values (tests.uid('dan'));
select tests.as_user('dan');
select tests.check(not exists (select 1 from public.nearby_games(p_city => 'Toronto') where host_id = tests.uid('alice')),
                   'nearby_games excludes hosts who blocked the caller');
select tests.throws($q$select public.join_game(tests.get('g3')::uuid)$q$, 'You are blocked from this game',
                    'blocked user cannot join host game');
reset role;
update public.games set starts_at = now() - interval '2 hours' where id = tests.get('g3')::uuid;
select tests.as_user('cara');
select tests.check(not exists (select 1 from public.nearby_games(p_city => 'Toronto') where id = tests.get('g3')::uuid),
                   'ended game not listed');
select tests.throws($q$select public.join_game(tests.get('g3')::uuid)$q$, 'Game has ended', 'cannot join ended game');
rollback;

-- Private (code) games.
begin;
select tests.as_user('alice');
select tests.set('g4', public.create_game('soccer', 'Dufferin Grove', 43.6555, -79.4340,
                                          now() + interval '1 day', 60, 10, 'any', '{}', 'open', 'code')::text);
select tests.set('g4code', (select join_code from public.game_detail(tests.get('g4')::uuid)));
select tests.as_user('bob');
select tests.check(not exists (select 1 from public.nearby_games(p_city => 'Toronto') where id = tests.get('g4')::uuid),
                   'code game not listed');
select tests.throws($q$select public.join_game(tests.get('g4')::uuid)$q$, 'Game not found', 'code game not joinable by id');
select tests.throws($q$select * from public.game_detail(tests.get('g4')::uuid)$q$, 'Game not found', 'code game detail hidden');
select tests.throws($q$select public.join_game_by_code('ZZZZZZ')$q$, 'Invalid code', 'bad game code rejected');
select tests.eq(public.join_game_by_code(lower(tests.get('g4code'))), tests.get('g4')::uuid,
                'join_game_by_code is case-insensitive and returns the game id');
select tests.check((select is_joined from public.game_detail(tests.get('g4')::uuid)), 'joined via code');
select tests.check(exists (select 1 from public.my_games() where id = tests.get('g4')::uuid
                           and is_joined and not is_host and distance_km is null),
                   'my_games includes code-only game joined via code');
select tests.as_user('dan');
select tests.check(not exists (select 1 from public.my_games() where id = tests.get('g4')::uuid),
                   'my_games excludes other users games');
select tests.as_user('alice');
select tests.set('g4b', public.create_game('basketball', 'Regent Park', 43.66, -79.36, now() + interval '2 days', 60, 10)::text);
select public.cancel_game(tests.get('g4b')::uuid);
select tests.check(exists (select 1 from public.my_games() where id = tests.get('g4')::uuid and is_host),
                   'my_games includes hosted code game');
select tests.check(exists (select 1 from public.my_games() where id = tests.get('g4b')::uuid),
                   'my_games includes cancelled games');
select tests.check((select bool_and(a.starts_at <= b.starts_at)
                    from (select starts_at, row_number() over () rn from public.my_games()) a
                    join (select starts_at, row_number() over () rn from public.my_games()) b on b.rn = a.rn + 1)
                   is not false, 'my_games ordered by starts_at');
reset role;
update public.games set starts_at = now() - interval '2 days' where id = tests.get('g4')::uuid;
update public.games set starts_at = now() - interval '20 hours' where id = tests.get('g4b')::uuid;
select tests.as_user('alice');
select tests.check(not exists (select 1 from public.my_games() where id = tests.get('g4')::uuid),
                   'my_games excludes games ended more than 24h ago');
select tests.check(exists (select 1 from public.my_games() where id = tests.get('g4b')::uuid),
                   'my_games keeps games ended within 24h');
select tests.as_anon();
select tests.throws('select * from public.my_games()', 'permission denied', 'anon cannot call my_games');
rollback;

-- Check-in.
begin;
select tests.as_user('alice');
select tests.set('g5', public.create_game('soccer', 'Christie Pits', 43.6645, -79.4205,
                                          now() + interval '2 hours', 90, 10)::text);
select tests.as_user('bob');
select public.join_game(tests.get('g5')::uuid);
select tests.throws($q$select public.check_in(tests.get('g5')::uuid, 43.6645, -79.4205)$q$,
                    'Check-in opens 30 minutes before start', 'check-in too early');
select tests.as_user('dan');
select tests.throws($q$select public.check_in(tests.get('g5')::uuid, 43.6645, -79.4205)$q$,
                    'Join the game first', 'check-in requires joining');
reset role;
update public.games set starts_at = now() + interval '10 minutes' where id = tests.get('g5')::uuid;
update public.profiles set is_reviewer = true where id = tests.uid('rev');
select tests.as_user('bob');
select tests.throws($q$select public.check_in(tests.get('g5')::uuid, 43.7000, -79.4205)$q$,
                    'You need to be within 500 m of the venue', 'check-in distance failure');
select tests.throws($q$select public.check_in(tests.get('g5')::uuid, null, null)$q$,
                    'within 500 m', 'check-in without location fails');
select tests.ok($q$select public.check_in(tests.get('g5')::uuid, 43.6660, -79.4210)$q$, 'check-in within 500 m succeeds');
select tests.check((select checked_in from public.game_detail(tests.get('g5')::uuid)), 'checked_in flag set');
select tests.check((select (r ->> 'checked_in')::boolean from public.game_detail(tests.get('g5')::uuid),
                           jsonb_array_elements(roster) r where r ->> 'user_id' = tests.uid('bob')::text),
                   'roster shows check-in');
-- Reviewer bypasses distance and time.
select tests.as_user('alice');
select tests.set('g6', public.create_game('basketball', 'Regent Park', 43.6600, -79.3600,
                                          now() + interval '3 days', 60, 10)::text);
select tests.as_user('rev');
select public.join_game(tests.get('g6')::uuid);
select tests.ok($q$select public.check_in(tests.get('g6')::uuid, 49.2827, -123.1207)$q$,
                'reviewer check-in bypasses distance and time');
reset role;
update public.games set starts_at = now() - interval '3 hours' where id = tests.get('g5')::uuid;
insert into public.game_players (game_id, user_id) values (tests.get('g5')::uuid, tests.uid('cara'));
select tests.as_user('cara');
select tests.throws($q$select public.check_in(tests.get('g5')::uuid, 43.6645, -79.4205)$q$,
                    'Game has ended', 'check-in after the game ends fails');
rollback;
