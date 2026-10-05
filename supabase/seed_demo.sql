-- Beacon demo / App Review seed.
--
-- Usage (SQL editor, after the migration):
--   1. Create the reviewer and two host accounts (see supabase/README.md).
--   2. Run this file once to define seed_demo().
--   3. select seed_demo('reviewer@example.com', 'host@example.com', 'host2@example.com');
--
-- The second host is optional but strongly recommended for App Review: content is split
-- between two hosts, so a reviewer who tests Block on one of them still sees a full app.
-- Run it again shortly before each submission so the demo games are in the future.
--
-- Re-runnable: rows previously created by seed_demo (is_demo = true) are deleted first.
-- Not callable by app users; execute is revoked from anon and authenticated.

drop function if exists public.seed_demo(text, text);

create or replace function public.seed_demo(p_reviewer_email text, p_host_email text, p_host2_email text default null)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_reviewer uuid;
  v_host     uuid;
  v_host2    uuid;  -- falls back to v_host when no second host is given
  v_base     timestamptz := date_trunc('hour', now()) + interval '3 hours';  -- 2 to 3 hours out
  v_game     uuid;
  v_soccer   uuid;
  v_pickle   uuid;
  v_hoops    uuid;
begin
  select id into v_reviewer from auth.users where lower(email) = lower(btrim(p_reviewer_email));
  if v_reviewer is null then
    raise exception 'seed_demo: no auth user with email %. Create it first (see supabase/README.md).', p_reviewer_email;
  end if;
  select id into v_host from auth.users where lower(email) = lower(btrim(p_host_email));
  if v_host is null then
    raise exception 'seed_demo: no auth user with email %. Create it first (see supabase/README.md).', p_host_email;
  end if;
  if v_reviewer = v_host then
    raise exception 'seed_demo: reviewer and host must be different accounts';
  end if;
  if p_host2_email is not null then
    select id into v_host2 from auth.users where lower(email) = lower(btrim(p_host2_email));
    if v_host2 is null then
      raise exception 'seed_demo: no auth user with email %. Create it first (see supabase/README.md).', p_host2_email;
    end if;
    if v_host2 in (v_reviewer, v_host) then
      raise exception 'seed_demo: the second host must be a different account from the reviewer and the host';
    end if;
  else
    v_host2 := v_host;
  end if;
  if not exists (select 1 from public.profiles where id = v_reviewer)
     or not exists (select 1 from public.profiles where id = v_host)
     or not exists (select 1 from public.profiles where id = v_host2) then
    raise exception 'seed_demo: every account needs a profile (create them with display_name, birth_date and terms_version metadata)';
  end if;

  update public.profiles set is_reviewer = true where id = v_reviewer;

  -- Remove the previous demo data (cascades to players, members, requests and messages).
  delete from public.games  where is_demo;
  delete from public.groups where is_demo;

  -- Six games across four Toronto parks, 2 hours to 6 days out.
  insert into public.games (host_id, sport, tags, level, venue_name, city, location, starts_at,
                            duration_min, spots_total, gender_rule, visibility, join_code, is_demo)
  values (v_host, 'soccer', '{7v7,after_work,outdoor}', 'intermediate', 'Christie Pits', 'Toronto',
          public.geo_point(43.6645, -79.4205), v_base, 90, 14, 'open', 'public', public.gen_join_code(), true)
  returning id into v_game;
  insert into public.game_players (game_id, user_id) values (v_game, v_host);

  insert into public.games (host_id, sport, tags, level, venue_name, city, location, starts_at,
                            duration_min, spots_total, gender_rule, visibility, join_code, is_demo)
  values
    (v_host2, 'basketball', '{3v3,outdoor}', 'any', 'Regent Park Courts', 'Toronto',
     public.geo_point(43.6600, -79.3600), v_base + interval '1 day', 90, 10, 'open', 'public', public.gen_join_code(), true),
    (v_host, 'pickleball', '{doubles,beginner}', 'beginner', 'Trinity Bellwoods Park', 'Toronto',
     public.geo_point(43.6475, -79.4135), v_base + interval '2 days', 60, 8, 'open', 'public', public.gen_join_code(), true),
    (v_host, 'soccer', '{5v5,beginner,coed}', 'beginner', 'Dufferin Grove Park', 'Toronto',
     public.geo_point(43.6555, -79.4340), v_base + interval '3 days', 60, 12, 'open', 'public', public.gen_join_code(), true),
    (v_host2, 'basketball', '{5v5,weekend}', 'intermediate', 'Dufferin Grove Park', 'Toronto',
     public.geo_point(43.6555, -79.4340), v_base + interval '4 days', 90, 10, 'open', 'public', public.gen_join_code(), true),
    (v_host, 'pickleball', '{doubles,early_morning}', 'any', 'Regent Park', 'Toronto',
     public.geo_point(43.6600, -79.3600), v_base + interval '5 days 18 hours', 60, 8, 'open', 'public', public.gen_join_code(), true);

  insert into public.game_players (game_id, user_id)
  select id, host_id from public.games where is_demo
  on conflict do nothing;

  -- The reviewer is joined to the games 1, 2 and 3 days out, so a joined game is still upcoming
  -- whenever review happens (check-in and the roster can be tried on any of them). The soonest
  -- game and the last two stay open so Join can be tried too.
  insert into public.game_players (game_id, user_id)
  select id, v_reviewer from public.games
  where is_demo and starts_at between v_base + interval '1 day' and v_base + interval '3 days';

  -- Each host also plays in the other's games, so rosters show more than one person.
  insert into public.game_players (game_id, user_id)
  select id, case when host_id = v_host then v_host2 else v_host end
  from public.games where is_demo
  on conflict do nothing;

  -- Three public groups with a little friendly chat history.
  insert into public.groups (host_id, name, sport, tags, city, format, lat, lng, area, radius_km,
                             min_age, visibility, gender_rule, join_code, is_demo)
  values (v_host, 'Christie Pits Pickup Soccer', 'soccer', '{7v7,intermediate,after_work}', 'Toronto',
          'in_person', 43.66, -79.42, public.geo_point(43.66, -79.42), 5, 18, 'public', 'open',
          public.gen_join_code(), true)
  returning id into v_soccer;

  insert into public.groups (host_id, name, sport, tags, city, format, lat, lng, area, radius_km,
                             min_age, visibility, gender_rule, join_code, is_demo)
  values (v_host, 'West End Pickleball', 'pickleball', '{doubles,beginner}', 'Toronto',
          'in_person', 43.65, -79.41, public.geo_point(43.65, -79.41), 5, 18, 'public', 'open',
          public.gen_join_code(), true)
  returning id into v_pickle;

  insert into public.groups (host_id, name, sport, tags, city, format, lat, lng, area, radius_km,
                             min_age, visibility, gender_rule, join_code, is_demo)
  values (v_host2, 'Regent Park Hoops', 'basketball', '{3v3,outdoor}', 'Toronto',
          'in_person', 43.66, -79.36, public.geo_point(43.66, -79.36), 5, 18, 'public', 'open',
          public.gen_join_code(), true)
  returning id into v_hoops;

  insert into public.group_members (group_id, user_id, role, joined_at)
  values (v_soccer, v_host, 'host', now() - interval '30 days'),
         (v_pickle, v_host, 'host', now() - interval '30 days'),
         (v_hoops,  v_host2, 'host', now() - interval '30 days'),
         (v_soccer, v_reviewer, 'member', now());

  insert into public.group_members (group_id, user_id, role, joined_at)
  values (v_soccer, v_host2, 'member', now() - interval '20 days')
  on conflict do nothing;

  -- Inserted from a trusted session (no JWT), so the trigger keeps sender_id and created_at
  -- and skips the per-user rate and new-member limits; the content filter still applies.
  insert into public.group_messages (group_id, sender_id, body, created_at)
  values
    (v_soccer, v_host, 'Welcome! We play most weeknights around 6:30. Bring a light and a dark shirt.', now() - interval '2 days'),
    (v_soccer, v_host2, 'Field is in good shape this week. All levels welcome, we keep it friendly.', now() - interval '1 day'),
    (v_soccer, v_host, 'Game tonight is up on the map. See you there!', now() - interval '1 hour'),
    (v_pickle, v_host, 'Hi all, beginners very welcome. We have spare paddles if you need one.', now() - interval '3 days'),
    (v_pickle, v_host, 'Saturday doubles is on. We rotate partners every game.', now() - interval '5 hours'),
    (v_hoops,  v_host2, 'Runs start at the outdoor courts. First to 11, winners stay on.', now() - interval '2 days'),
    (v_hoops,  v_host2, 'Courts were busy yesterday, come a little early to get on.', now() - interval '3 hours');

  return 'Seeded 6 games and 3 groups';
end;
$$;

revoke all on function public.seed_demo(text, text, text) from public, anon, authenticated;
