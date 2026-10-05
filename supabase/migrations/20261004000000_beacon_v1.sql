-- Beacon v1 schema (store submission build).
-- Implements docs/API_CONTRACT.md. Safe to run on a fresh Supabase project; re-running
-- is tolerated (create-if-not-exists / create-or-replace / drop-if-exists throughout).
--
-- Layout:
--   1. Extensions
--   2. Pure helpers needed by CHECK constraints
--   3. Tables (dependency order)
--   4. Indexes
--   5. Internal helper functions (RLS helpers, validation, codes)
--   6. Triggers
--   7. Row level security and policies
--   8. Views
--   9. RPCs
--  10. Grants
--  11. Realtime publication

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists postgis with schema extensions;

-- Session search path for the DDL below. Every function also pins its own search_path.
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- 2. Pure helpers used in CHECK constraints
-- ---------------------------------------------------------------------------
create or replace function public.valid_tags(p_tags text[])
returns boolean
language sql
immutable
set search_path = public, extensions
as $$
  select p_tags is not null
     and cardinality(p_tags) <= 3
     and array_position(p_tags, null) is null
     and p_tags <@ array[
       'beginner', 'intermediate', 'competitive', '5v5', '7v7', '11v11', '3v3',
       'doubles', 'after_work', 'early_morning', 'weekend', 'coed', 'indoor', 'outdoor'
     ]::text[]
     and cardinality(p_tags) = (select count(distinct t) from unnest(p_tags) as t);
$$;

-- ---------------------------------------------------------------------------
-- 3. Tables
-- ---------------------------------------------------------------------------

-- One row per auth user. Created only by the auth.users trigger.
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  display_name      text not null
                    check (char_length(display_name) between 2 and 40 and display_name = btrim(display_name)),
  birth_date        date not null check (birth_date >= date '1900-01-01'),
  gender            text check (gender in ('woman', 'man', 'non_binary', 'prefer_not')),
  city              text not null default 'Toronto' check (char_length(city) between 1 and 60),
  terms_version     text not null check (char_length(terms_version) between 1 and 40),
  terms_accepted_at timestamptz not null default now(),
  is_reviewer       boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Moderator-extensible word list for the content filter. Whole-word, case-insensitive.
create table if not exists public.blocked_terms (
  term       text primary key check (term ~ '^[a-z]+( [a-z]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references public.profiles (id) on delete cascade,
  sport        text not null check (sport in ('soccer', 'basketball', 'pickleball')),
  tags         text[] not null default '{}' check (public.valid_tags(tags)),
  level        text not null default 'any' check (level in ('any', 'beginner', 'intermediate', 'advanced')),
  venue_name   text not null check (char_length(venue_name) between 2 and 80),
  city         text not null default 'Toronto' check (char_length(city) between 1 and 60),
  location     extensions.geography(Point, 4326) not null,
  starts_at    timestamptz not null,
  duration_min int not null check (duration_min between 30 and 240),
  spots_total  int not null check (spots_total between 2 and 40),
  gender_rule  text not null default 'open' check (gender_rule in ('open', 'women_nb')),
  visibility   text not null default 'public' check (visibility in ('public', 'code')),
  join_code    text not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  status       text not null default 'open' check (status in ('open', 'cancelled')),
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.game_players (
  game_id       uuid not null references public.games (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  checked_in_at timestamptz,
  primary key (game_id, user_id)
);

-- Group areas are stored rounded to 0.01 degrees (about 1 km); remote groups have no area.
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 3 and 60 and name = btrim(name)),
  sport       text not null check (sport in ('soccer', 'basketball', 'pickleball')),
  tags        text[] not null default '{}' check (public.valid_tags(tags)),
  city        text not null default 'Toronto' check (char_length(city) between 1 and 60),
  format      text not null check (format in ('in_person', 'remote')),
  lat         float8,
  lng         float8,
  area        extensions.geography(Point, 4326),
  radius_km   int not null default 5 check (radius_km between 1 and 25),
  min_age     int not null default 18 check (min_age in (18, 21, 25, 30, 35, 40)),
  visibility  text not null default 'public' check (visibility in ('public', 'request', 'invite')),
  gender_rule text not null default 'open' check (gender_rule in ('open', 'women_nb')),
  join_code   text not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  status      text not null default 'active' check (status in ('active', 'archived')),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  check (
    (format = 'in_person' and area is not null and lat is not null and lng is not null)
    or (format = 'remote' and area is null and lat is null and lng is null)
  )
);

create table if not exists public.group_members (
  group_id    uuid not null references public.groups (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null default 'member' check (role in ('host', 'cohost', 'member')),
  joined_at   timestamptz not null default now(),
  muted_until timestamptz,
  primary key (group_id, user_id)
);

create table if not exists public.group_requests (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_bans (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  banned_by  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_messages (
  id          bigint generated always as identity primary key,
  group_id    uuid not null references public.groups (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null,
  body        text not null check (char_length(body) between 1 and 1000),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  -- Nullable: when the reporter deletes their account the report is kept, anonymised.
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('message', 'user', 'game', 'group')),
  target_id   text not null check (char_length(target_id) between 1 and 64),
  reason      text not null
              check (reason in ('spam', 'harassment', 'hate', 'sexual', 'violence', 'scam', 'underage', 'other')),
  details     text check (char_length(details) <= 1000),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
create index if not exists games_location_gix        on public.games using gist (location);
create index if not exists games_starts_at_idx       on public.games (starts_at);
create index if not exists games_host_id_idx         on public.games (host_id);
create index if not exists games_city_idx            on public.games (lower(city));
create index if not exists game_players_user_id_idx  on public.game_players (user_id);
create index if not exists groups_area_gix           on public.groups using gist (area);
create index if not exists groups_host_id_idx        on public.groups (host_id);
create index if not exists groups_city_idx           on public.groups (lower(city));
create index if not exists group_members_user_id_idx on public.group_members (user_id);
create unique index if not exists group_members_one_host_idx
  on public.group_members (group_id) where role = 'host';
create index if not exists group_requests_user_id_idx on public.group_requests (user_id);
create index if not exists group_bans_user_id_idx     on public.group_bans (user_id);
create index if not exists group_bans_banned_by_idx   on public.group_bans (banned_by);
create index if not exists group_messages_group_created_idx
  on public.group_messages (group_id, created_at desc);
create index if not exists group_messages_sender_created_idx
  on public.group_messages (sender_id, group_id, created_at desc);
create index if not exists blocks_blocked_id_idx      on public.blocks (blocked_id);
create index if not exists reports_target_idx         on public.reports (target_type, target_id);

-- Starter content filter. Kept deliberately short; moderators extend it with
-- insert into public.blocked_terms(term) values (...).
insert into public.blocked_terms (term) values
  ('nigger'), ('nigga'), ('faggot'), ('fag'), ('kike'), ('spic'), ('chink'),
  ('tranny'), ('retard'), ('cunt'), ('whore'), ('slut'),
  ('kill yourself'), ('kys')
on conflict (term) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Internal helper functions
-- ---------------------------------------------------------------------------

-- Role claimed by the caller's JWT ('anon', 'authenticated', 'service_role'), or null
-- for direct database sessions such as the SQL editor.
create or replace function public.request_role()
returns text
language sql
stable
set search_path = public, extensions
as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
$$;

-- Current user id, or raise if the caller is not a signed-in user with a profile.
create or replace function public.require_uid()
returns uuid
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Not signed in';
  end if;
  return v_uid;
end;
$$;

create or replace function public.contains_blocked_term(p_text text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1
    from public.blocked_terms t
    where p_text ~* ('\m' || t.term || 's?\M')
  );
$$;

-- Links, email addresses and phone numbers (7+ digits, separators allowed).
create or replace function public.contains_contact_info(p_text text)
returns boolean
language sql
immutable
set search_path = public, extensions
as $$
  select p_text ~* '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|ca|io|co|app|ly|me|gg|xyz|info|biz|link|site|online|us|uk|tv)\M)'
      or p_text ~* '[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}'
      or p_text ~ '\d([\s().-]*\d){6,}';
$$;

create or replace function public.geo_point(p_lat float8, p_lng float8)
returns extensions.geography
language plpgsql
immutable
set search_path = public, extensions
as $$
begin
  if p_lat is null or p_lng is null then
    return null;
  end if;
  if not (p_lat between -90 and 90) or not (p_lng between -180 and 180) then
    raise exception 'Invalid location';
  end if;
  return st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography;
end;
$$;

-- 6 characters from A-Z and 2-9 without the look-alikes 0, O, 1, I (32 symbols).
-- Uses gen_random_uuid() as the randomness source; 256 is divisible by 32 so no bias.
create or replace function public.gen_join_code()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := uuid_send(gen_random_uuid());
  v_code text := '';
begin
  for i in 0..5 loop
    v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 32), 1);
  end loop;
  return v_code;
end;
$$;

create or replace function public.user_age(p_uid uuid)
returns int
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select extract(year from age(current_date, birth_date))::int from public.profiles where id = p_uid;
$$;

create or replace function public.gender_allowed(p_rule text, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select p_rule = 'open'
      or exists (select 1 from public.profiles where id = p_uid and gender in ('woman', 'non_binary'));
$$;

-- True when either user has blocked the other.
create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

-- RLS helpers. Security definer so policies can consult membership tables without
-- recursing into their own policies.
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.group_members where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role in ('host', 'cohost')
  );
$$;

create or replace function public.is_game_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.game_players where game_id = p_game_id and user_id = auth.uid()
  );
$$;

-- True when the current user has blocked p_user_id.
create or replace function public.has_blocked(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1 from public.blocks where blocker_id = auth.uid() and blocked_id = p_user_id
  );
$$;

-- Whether a non-member may discover/view this group.
create or replace function public.group_discoverable(p_group_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.status = 'active'
      and g.visibility in ('public', 'request')
      and coalesce(public.user_age(p_uid), 0) >= g.min_age
      and public.gender_allowed(g.gender_rule, p_uid)
      and not public.is_blocked_between(p_uid, g.host_id)
      and not exists (select 1 from public.group_bans b where b.group_id = g.id and b.user_id = p_uid)
  );
$$;

-- Raise a readable error if p_uid may not become a member of p_group.
create or replace function public.assert_group_eligible(p_group public.groups, p_uid uuid)
returns void
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if p_group.status <> 'active' then
    raise exception 'Group not found';
  end if;
  if exists (select 1 from public.group_bans where group_id = p_group.id and user_id = p_uid)
     or public.is_blocked_between(p_uid, p_group.host_id) then
    raise exception 'You cannot join this group';
  end if;
  if coalesce(public.user_age(p_uid), 0) < p_group.min_age then
    raise exception 'This group is for members aged % and over', p_group.min_age;
  end if;
  if not public.gender_allowed(p_group.gender_rule, p_uid) then
    raise exception 'This group is for women and non-binary players';
  end if;
  if (select count(*) from public.group_members where group_id = p_group.id) >= 200 then
    raise exception 'This group is full';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Triggers
-- ---------------------------------------------------------------------------

-- Create the profile at signup. Any exception here aborts the signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name   text  := btrim(coalesce(v_meta ->> 'display_name', ''));
  v_terms  text  := btrim(coalesce(v_meta ->> 'terms_version', ''));
  v_gender text  := nullif(btrim(coalesce(v_meta ->> 'gender', '')), '');
  v_birth  date;
begin
  begin
    v_birth := nullif(btrim(coalesce(v_meta ->> 'birth_date', '')), '')::date;
  exception when others then
    v_birth := null;
  end;

  if v_birth is null or v_birth < date '1900-01-01' or v_birth > (current_date - interval '18 years')::date then
    raise exception 'You must be 18 or older to use Beacon';
  end if;
  if v_terms = '' then
    raise exception 'You must accept the Terms of Use to create an account';
  end if;
  if char_length(v_name) not between 2 and 40 then
    raise exception 'Display name must be 2 to 40 characters';
  end if;
  if public.contains_blocked_term(v_name) then
    raise exception 'Display name is not allowed';
  end if;
  if v_gender is not null and v_gender not in ('woman', 'man', 'non_binary', 'prefer_not') then
    v_gender := null;
  end if;

  insert into public.profiles (id, display_name, birth_date, gender, terms_version, terms_accepted_at)
  values (new.id, v_name, v_birth, v_gender, left(v_terms, 40), now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Readable validation for client profile edits (column grants limit what can change).
create or replace function public.profiles_before_update()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if new.display_name is distinct from old.display_name then
    new.display_name := btrim(coalesce(new.display_name, ''));
    if char_length(new.display_name) not between 2 and 40 then
      raise exception 'Display name must be 2 to 40 characters';
    end if;
    if public.contains_blocked_term(new.display_name) then
      raise exception 'Display name is not allowed';
    end if;
  end if;
  if new.city is distinct from old.city then
    new.city := btrim(coalesce(new.city, ''));
    if char_length(new.city) not between 1 and 60 then
      raise exception 'City must be 1 to 60 characters';
    end if;
  end if;
  if new.gender is distinct from old.gender
     and new.gender is not null and new.gender not in ('woman', 'man', 'non_binary', 'prefer_not') then
    raise exception 'Invalid gender';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_before_update on public.profiles;
create trigger profiles_before_update
  before update on public.profiles
  for each row execute function public.profiles_before_update();

-- Server-owned fields and safety rules for chat messages.
create or replace function public.group_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_member public.group_members%rowtype;
begin
  if v_uid is null then
    -- Only trusted server-side sessions (SQL editor, service role, seed_demo) get here.
    if coalesce(public.request_role(), '') in ('anon', 'authenticated') or new.sender_id is null then
      raise exception 'Not signed in';
    end if;
    new.created_at := coalesce(new.created_at, now());
  else
    new.sender_id := v_uid;
    new.created_at := now();

    select * into v_member
    from public.group_members
    where group_id = new.group_id and user_id = v_uid;
    if not found then
      raise exception 'You are not a member of this group';
    end if;
    if v_member.muted_until is not null and v_member.muted_until > now() then
      raise exception 'You are muted in this group';
    end if;

    -- Serialise a sender's inserts per group so the rate limit cannot be raced.
    perform pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || new.group_id::text, 0));
    if (select count(*) from public.group_messages
        where group_id = new.group_id and sender_id = v_uid
          and created_at > now() - interval '1 minute') >= 10 then
      raise exception 'Slow down: 10 messages per minute';
    end if;
  end if;

  new.body := btrim(coalesce(new.body, ''));
  if char_length(new.body) = 0 then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(new.body) > 1000 then
    raise exception 'Message is too long (1000 characters max)';
  end if;
  if public.contains_blocked_term(new.body) then
    raise exception 'Message blocked by content filter';
  end if;
  if v_uid is not null
     and v_member.joined_at > now() - interval '7 days'
     and public.contains_contact_info(new.body) then
    raise exception 'New members cannot post links or phone numbers for 7 days';
  end if;

  select display_name into new.sender_name from public.profiles where id = new.sender_id;
  if new.sender_name is null then
    raise exception 'Not signed in';
  end if;
  new.hidden := false;
  return new;
end;
$$;

drop trigger if exists group_messages_before_insert on public.group_messages;
create trigger group_messages_before_insert
  before insert on public.group_messages
  for each row execute function public.group_messages_before_insert();

-- Normalise reports; a repeat report of the same target is silently ignored.
create or replace function public.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
begin
  if v_uid is not null then
    new.reporter_id := v_uid;
  end if;
  if new.reporter_id is null then
    raise exception 'Not signed in';
  end if;
  if new.target_type is null or new.target_type not in ('message', 'user', 'game', 'group') then
    raise exception 'Invalid report target';
  end if;
  if new.reason is null
     or new.reason not in ('spam', 'harassment', 'hate', 'sexual', 'violence', 'scam', 'underage', 'other') then
    raise exception 'Invalid report reason';
  end if;

  new.target_id := btrim(coalesce(new.target_id, ''));
  if new.target_type = 'message' then
    if new.target_id !~ '^[0-9]{1,18}$' then
      raise exception 'Invalid report target';
    end if;
    -- Only people who could see the message may report it, so outsiders cannot
    -- hide messages by guessing ids.
    select group_id into v_group_id from public.group_messages where id = new.target_id::bigint;
    if v_group_id is null
       or (v_uid is not null and not exists (
             select 1 from public.group_members where group_id = v_group_id and user_id = v_uid)) then
      raise exception 'Invalid report target';
    end if;
  elsif new.target_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Invalid report target';
  else
    new.target_id := lower(new.target_id);
  end if;

  new.details := nullif(btrim(coalesce(new.details, '')), '');
  if char_length(new.details) > 1000 then
    new.details := left(new.details, 1000);
  end if;
  new.created_at := now();

  if exists (select 1 from public.reports
             where reporter_id = new.reporter_id and target_type = new.target_type
               and target_id = new.target_id) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_before_insert on public.reports;
create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();

-- Auto-hide a message once 3 distinct people have reported it.
create or replace function public.reports_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if new.target_type = 'message'
     -- Anonymised reports (reporter deleted their account) still count, one each.
     and (select count(distinct reporter_id) + count(*) filter (where reporter_id is null)
          from public.reports
          where target_type = 'message' and target_id = new.target_id) >= 3 then
    update public.group_messages set hidden = true
    where id = new.target_id::bigint and not hidden;
  end if;
  return null;
end;
$$;

drop trigger if exists reports_after_insert on public.reports;
create trigger reports_after_insert
  after insert on public.reports
  for each row execute function public.reports_after_insert();

-- Blocks: owner is always the caller; duplicates are a no-op.
create or replace function public.blocks_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is not null then
    new.blocker_id := v_uid;
  end if;
  if new.blocker_id is null then
    raise exception 'Not signed in';
  end if;
  if new.blocked_id is null or new.blocked_id = new.blocker_id then
    raise exception 'You cannot block yourself';
  end if;
  new.created_at := now();
  if exists (select 1 from public.blocks where blocker_id = new.blocker_id and blocked_id = new.blocked_id) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists blocks_before_insert on public.blocks;
create trigger blocks_before_insert
  before insert on public.blocks
  for each row execute function public.blocks_before_insert();

-- ---------------------------------------------------------------------------
-- 7. Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.blocked_terms  enable row level security;
alter table public.games          enable row level security;
alter table public.game_players   enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.group_requests enable row level security;
alter table public.group_bans     enable row level security;
alter table public.group_messages enable row level security;
alter table public.blocks         enable row level security;
alter table public.reports        enable row level security;

-- games, game_players, groups, group_members, group_bans, blocked_terms: no policies.
-- Clients reach them only through the security definer RPCs below.

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists group_messages_select_member on public.group_messages;
create policy group_messages_select_member on public.group_messages
  for select to authenticated
  using (
    not hidden
    and public.is_group_member(group_id)
    and not public.has_blocked(sender_id)
  );

drop policy if exists group_messages_insert_member on public.group_messages;
create policy group_messages_insert_member on public.group_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select to authenticated
  using (blocker_id = auth.uid());

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own on public.blocks
  for insert to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own on public.blocks
  for delete to authenticated
  using (blocker_id = auth.uid());

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists group_requests_select on public.group_requests;
create policy group_requests_select on public.group_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_group_admin(group_id));

-- ---------------------------------------------------------------------------
-- 8. Views
-- ---------------------------------------------------------------------------
-- Runs with the owner's rights on purpose: exposes only id and display_name of every
-- profile, while the profiles table itself stays own-row only.
create or replace view public.public_profiles as
  select id, display_name from public.profiles;

-- ---------------------------------------------------------------------------
-- 9. RPCs
-- ---------------------------------------------------------------------------

-- Shared row shape for game lists.
create or replace function public.game_card(p_game_id uuid, p_uid uuid, p_point extensions.geography)
returns table (
  id uuid, sport text, tags text[], level text, venue_name text, city text,
  lat float8, lng float8, starts_at timestamptz, duration_min int, spots_total int,
  spots_taken int, gender_rule text, host_id uuid, host_name text, distance_km float8,
  is_joined boolean, is_host boolean
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select g.id, g.sport, g.tags, g.level, g.venue_name, g.city,
         st_y(g.location::geometry), st_x(g.location::geometry),
         g.starts_at, g.duration_min, g.spots_total,
         (select count(*)::int from public.game_players gp where gp.game_id = g.id),
         g.gender_rule, g.host_id, hp.display_name,
         case when p_point is null then null
              else round((st_distance(g.location, p_point) / 1000.0)::numeric, 2)::float8 end,
         exists (select 1 from public.game_players gp where gp.game_id = g.id and gp.user_id = p_uid),
         g.host_id = p_uid
  from public.games g
  join public.profiles hp on hp.id = g.host_id
  where g.id = p_game_id;
$$;

create or replace function public.nearby_games(
  p_lat float8 default null,
  p_lng float8 default null,
  p_radius_km int default 25,
  p_city text default 'Toronto',
  p_sport text default null
)
returns table (
  id uuid, sport text, tags text[], level text, venue_name text, city text,
  lat float8, lng float8, starts_at timestamptz, duration_min int, spots_total int,
  spots_taken int, gender_rule text, host_id uuid, host_name text, distance_km float8,
  is_joined boolean, is_host boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid    uuid := public.require_uid();
  v_point  extensions.geography := public.geo_point(p_lat, p_lng);
  v_meters float8 := least(greatest(coalesce(p_radius_km, 25), 1), 100) * 1000.0;
  v_city   text := lower(btrim(coalesce(nullif(btrim(p_city), ''), 'Toronto')));
begin
  return query
  select c.*
  from public.games g
  cross join lateral public.game_card(g.id, v_uid, v_point) c
  where g.status = 'open'
    and g.visibility = 'public'
    and g.starts_at + make_interval(mins => g.duration_min) > now()
    and (p_sport is null or g.sport = p_sport)
    and not public.is_blocked_between(v_uid, g.host_id)
    and (case when v_point is null then lower(g.city) = v_city
              else st_dwithin(g.location, v_point, v_meters) end)
  order by c.distance_km nulls last, c.starts_at
  limit 100;
end;
$$;

create or replace function public.game_detail(p_game_id uuid)
returns table (
  id uuid, sport text, tags text[], level text, venue_name text, city text,
  lat float8, lng float8, starts_at timestamptz, duration_min int, spots_total int,
  spots_taken int, gender_rule text, host_id uuid, host_name text, distance_km float8,
  is_joined boolean, is_host boolean,
  join_code text, status text, checked_in boolean, roster jsonb
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid    uuid := public.require_uid();
  v_game   public.games%rowtype;
  v_member boolean;
begin
  select * into v_game from public.games where id = p_game_id;
  if not found then
    raise exception 'Game not found';
  end if;
  v_member := public.is_game_member(p_game_id);
  if not v_member and (v_game.visibility <> 'public' or public.is_blocked_between(v_uid, v_game.host_id)) then
    raise exception 'Game not found';
  end if;

  return query
  select c.*,
         case when v_game.host_id = v_uid then v_game.join_code end,
         v_game.status,
         coalesce((select gp.checked_in_at is not null from public.game_players gp
                   where gp.game_id = p_game_id and gp.user_id = v_uid), false),
         case when v_member then
           coalesce((select jsonb_agg(jsonb_build_object(
                              'user_id', gp.user_id,
                              'display_name', p.display_name,
                              'checked_in', gp.checked_in_at is not null)
                            order by gp.joined_at)
                     from public.game_players gp
                     join public.profiles p on p.id = gp.user_id
                     where gp.game_id = p_game_id
                       -- People the viewer blocked disappear from rosters too.
                       and not exists (select 1 from public.blocks b
                                       where b.blocker_id = v_uid and b.blocked_id = gp.user_id)), '[]'::jsonb)
         else '[]'::jsonb end
  from public.game_card(p_game_id, v_uid, null) c;
end;
$$;

create or replace function public.create_game(
  p_sport text,
  p_venue_name text,
  p_lat float8,
  p_lng float8,
  p_starts_at timestamptz,
  p_duration_min int,
  p_spots_total int,
  p_level text default 'any',
  p_tags text[] default '{}',
  p_gender_rule text default 'open',
  p_visibility text default 'public',
  p_city text default 'Toronto'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid   uuid := public.require_uid();
  v_venue text := btrim(coalesce(p_venue_name, ''));
  v_city  text := btrim(coalesce(nullif(btrim(p_city), ''), 'Toronto'));
  v_tags  text[];
  v_point extensions.geography;
  v_code  text;
  v_id    uuid;
begin
  if p_sport is null or p_sport not in ('soccer', 'basketball', 'pickleball') then
    raise exception 'Choose a sport';
  end if;
  if char_length(v_venue) not between 2 and 80 then
    raise exception 'Venue name must be 2 to 80 characters';
  end if;
  if public.contains_blocked_term(v_venue) then
    raise exception 'Venue name is not allowed';
  end if;
  if p_lat is null or p_lng is null then
    raise exception 'Choose a location';
  end if;
  v_point := public.geo_point(p_lat, p_lng);
  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'Start time must be in the future';
  end if;
  if p_starts_at > now() + interval '30 days' then
    raise exception 'Start time must be within 30 days';
  end if;
  if p_duration_min is null or p_duration_min not between 30 and 240 then
    raise exception 'Duration must be 30 to 240 minutes';
  end if;
  if p_spots_total is null or p_spots_total not between 2 and 40 then
    raise exception 'Spots must be between 2 and 40';
  end if;
  if coalesce(p_level, 'any') not in ('any', 'beginner', 'intermediate', 'advanced') then
    raise exception 'Invalid level';
  end if;
  select coalesce(array_agg(distinct t), '{}') into v_tags from unnest(coalesce(p_tags, '{}')) as t;
  if cardinality(v_tags) > 3 then
    raise exception 'Choose up to 3 tags';
  end if;
  if not public.valid_tags(v_tags) then
    raise exception 'Invalid tag';
  end if;
  if coalesce(p_gender_rule, 'open') not in ('open', 'women_nb') then
    raise exception 'Invalid gender rule';
  end if;
  if not public.gender_allowed(coalesce(p_gender_rule, 'open'), v_uid) then
    raise exception 'This game is for women and non-binary players';
  end if;
  if coalesce(p_visibility, 'public') not in ('public', 'code') then
    raise exception 'Invalid visibility';
  end if;
  if (select count(*) from public.games
      where host_id = v_uid and status = 'open' and starts_at > now()) >= 10 then
    raise exception 'You can host up to 10 upcoming games';
  end if;

  loop
    v_code := public.gen_join_code();
    exit when not exists (select 1 from public.games where join_code = v_code);
  end loop;

  insert into public.games (host_id, sport, tags, level, venue_name, city, location, starts_at,
                            duration_min, spots_total, gender_rule, visibility, join_code)
  values (v_uid, p_sport, v_tags, coalesce(p_level, 'any'), v_venue, v_city, v_point, p_starts_at,
          p_duration_min, p_spots_total, coalesce(p_gender_rule, 'open'),
          coalesce(p_visibility, 'public'), v_code)
  returning id into v_id;

  insert into public.game_players (game_id, user_id) values (v_id, v_uid);
  return v_id;
end;
$$;

-- Games the caller hosts or has joined (any visibility), open or cancelled, ending no
-- more than 24 hours ago.
create or replace function public.my_games()
returns table (
  id uuid, sport text, tags text[], level text, venue_name text, city text,
  lat float8, lng float8, starts_at timestamptz, duration_min int, spots_total int,
  spots_taken int, gender_rule text, host_id uuid, host_name text, distance_km float8,
  is_joined boolean, is_host boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := public.require_uid();
begin
  return query
  select c.*
  from public.games g
  cross join lateral public.game_card(g.id, v_uid, null) c
  where (g.host_id = v_uid
         or exists (select 1 from public.game_players gp where gp.game_id = g.id and gp.user_id = v_uid))
    and g.status in ('open', 'cancelled')
    and g.starts_at + make_interval(mins => g.duration_min) > now() - interval '24 hours'
  order by c.starts_at, c.id;
end;
$$;

-- Shared join logic. The game row is locked so concurrent joins cannot overbook.
create or replace function public.join_game_internal(p_game_id uuid, p_uid uuid, p_via_code boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_game public.games%rowtype;
begin
  select * into v_game from public.games where id = p_game_id for update;
  if not found then
    raise exception 'Game not found';
  end if;
  if exists (select 1 from public.game_players where game_id = p_game_id and user_id = p_uid) then
    return;
  end if;
  if v_game.visibility = 'code' and not p_via_code then
    raise exception 'Game not found';
  end if;
  if v_game.status = 'cancelled' then
    raise exception 'Game was cancelled';
  end if;
  if v_game.starts_at + make_interval(mins => v_game.duration_min) <= now() then
    raise exception 'Game has ended';
  end if;
  if public.is_blocked_between(p_uid, v_game.host_id) then
    raise exception 'You are blocked from this game';
  end if;
  if not public.gender_allowed(v_game.gender_rule, p_uid) then
    raise exception 'This game is for women and non-binary players';
  end if;
  if (select count(*) from public.game_players where game_id = p_game_id) >= v_game.spots_total then
    raise exception 'Game is full';
  end if;
  insert into public.game_players (game_id, user_id) values (p_game_id, p_uid);
end;
$$;

create or replace function public.join_game(p_game_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  perform public.join_game_internal(p_game_id, public.require_uid(), false);
end;
$$;

create or replace function public.join_game_by_code(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := public.require_uid();
  v_id  uuid;
begin
  select id into v_id from public.games where join_code = upper(btrim(coalesce(p_code, '')));
  if v_id is null then
    raise exception 'Invalid code';
  end if;
  perform public.join_game_internal(v_id, v_uid, true);
  return v_id;
end;
$$;

create or replace function public.leave_game(p_game_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid  uuid := public.require_uid();
  v_host uuid;
begin
  select host_id into v_host from public.games where id = p_game_id;
  if v_host is null then
    raise exception 'Game not found';
  end if;
  if v_host = v_uid then
    raise exception 'The host cannot leave; cancel the game instead';
  end if;
  delete from public.game_players where game_id = p_game_id and user_id = v_uid;
end;
$$;

create or replace function public.cancel_game(p_game_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid  uuid := public.require_uid();
  v_host uuid;
begin
  select host_id into v_host from public.games where id = p_game_id for update;
  if v_host is null then
    raise exception 'Game not found';
  end if;
  if v_host <> v_uid then
    raise exception 'Only the host can cancel this game';
  end if;
  update public.games set status = 'cancelled' where id = p_game_id;
end;
$$;

create or replace function public.check_in(p_game_id uuid, p_lat float8, p_lng float8)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid      uuid := public.require_uid();
  v_game     public.games%rowtype;
  v_reviewer boolean;
  v_point    extensions.geography;
begin
  select * into v_game from public.games where id = p_game_id;
  if not found then
    raise exception 'Game not found';
  end if;
  if not exists (select 1 from public.game_players where game_id = p_game_id and user_id = v_uid) then
    raise exception 'Join the game first';
  end if;
  if v_game.status = 'cancelled' then
    raise exception 'Game was cancelled';
  end if;

  select coalesce(is_reviewer, false) into v_reviewer from public.profiles where id = v_uid;
  if not coalesce(v_reviewer, false) then
    if now() < v_game.starts_at - interval '30 minutes' then
      raise exception 'Check-in opens 30 minutes before start';
    end if;
    if now() > v_game.starts_at + make_interval(mins => v_game.duration_min) then
      raise exception 'Game has ended';
    end if;
    v_point := public.geo_point(p_lat, p_lng);
    if v_point is null or not st_dwithin(v_game.location, v_point, 500) then
      raise exception 'You need to be within 500 m of the venue';
    end if;
  end if;

  update public.game_players
  set checked_in_at = coalesce(checked_in_at, now())
  where game_id = p_game_id and user_id = v_uid;
end;
$$;

-- Shared row shape for group lists.
create or replace function public.group_card(p_group_id uuid, p_uid uuid, p_point extensions.geography)
returns table (
  id uuid, name text, sport text, tags text[], city text, lat float8, lng float8,
  radius_km int, format text, min_age int, visibility text, gender_rule text,
  member_count int, games_this_week int, distance_km float8,
  is_member boolean, my_role text, has_requested boolean
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select g.id, g.name, g.sport, g.tags, g.city, g.lat, g.lng,
         g.radius_km, g.format, g.min_age, g.visibility, g.gender_rule,
         (select count(*)::int from public.group_members m where m.group_id = g.id),
         -- Open public games of the group's sport in its area (or city, for remote groups)
         -- starting within the next 7 days.
         (select count(*)::int from public.games x
          where x.status = 'open' and x.visibility = 'public' and x.sport = g.sport
            and x.starts_at >= now() and x.starts_at < now() + interval '7 days'
            and case when g.format = 'in_person'
                     then st_dwithin(x.location, g.area, g.radius_km * 1000.0)
                     else lower(x.city) = lower(g.city) end),
         case when p_point is null or g.area is null then null
              else round((st_distance(g.area, p_point) / 1000.0)::numeric, 2)::float8 end,
         me.user_id is not null,
         me.role,
         exists (select 1 from public.group_requests r where r.group_id = g.id and r.user_id = p_uid)
  from public.groups g
  left join public.group_members me on me.group_id = g.id and me.user_id = p_uid
  where g.id = p_group_id;
$$;

create or replace function public.nearby_groups(
  p_lat float8 default null,
  p_lng float8 default null,
  p_city text default 'Toronto',
  p_sport text default null
)
returns table (
  id uuid, name text, sport text, tags text[], city text, lat float8, lng float8,
  radius_km int, format text, min_age int, visibility text, gender_rule text,
  member_count int, games_this_week int, distance_km float8,
  is_member boolean, my_role text, has_requested boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid   uuid := public.require_uid();
  v_point extensions.geography := public.geo_point(p_lat, p_lng);
  v_city  text := lower(btrim(coalesce(nullif(btrim(p_city), ''), 'Toronto')));
begin
  return query
  select c.*
  from public.groups g
  cross join lateral public.group_card(g.id, v_uid, v_point) c
  where (p_sport is null or g.sport = p_sport)
    and (case when v_point is null then lower(g.city) = v_city
              else (g.format = 'in_person' and st_dwithin(g.area, v_point, g.radius_km * 1000.0))
                or (g.format = 'remote' and lower(g.city) = v_city) end)
    and public.group_discoverable(g.id, v_uid)
  order by c.distance_km nulls last, c.member_count desc, c.name
  limit 100;
end;
$$;

create or replace function public.my_groups()
returns table (
  id uuid, name text, sport text, tags text[], city text, lat float8, lng float8,
  radius_km int, format text, min_age int, visibility text, gender_rule text,
  member_count int, games_this_week int, distance_km float8,
  is_member boolean, my_role text, has_requested boolean
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid uuid := public.require_uid();
begin
  return query
  select c.*
  from public.group_members m
  join public.groups g on g.id = m.group_id and g.status = 'active'
  cross join lateral public.group_card(g.id, v_uid, null) c
  where m.user_id = v_uid
  order by c.name;
end;
$$;

create or replace function public.group_detail(p_group_id uuid)
returns table (
  id uuid, name text, sport text, tags text[], city text, lat float8, lng float8,
  radius_km int, format text, min_age int, visibility text, gender_rule text,
  member_count int, games_this_week int, distance_km float8,
  is_member boolean, my_role text, has_requested boolean,
  join_code text, members jsonb
)
language plpgsql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_column
declare
  v_uid  uuid := public.require_uid();
  v_role text;
begin
  select role into v_role from public.group_members where group_id = p_group_id and user_id = v_uid;
  if v_role is null and not public.group_discoverable(p_group_id, v_uid) then
    raise exception 'Group not found';
  end if;

  return query
  select c.*,
         case when v_role in ('host', 'cohost') then g.join_code end,
         case when v_role is not null then
           coalesce((select jsonb_agg(jsonb_build_object(
                              'user_id', m.user_id,
                              'display_name', p.display_name,
                              'role', m.role)
                            order by case m.role when 'host' then 0 when 'cohost' then 1 else 2 end,
                                     m.joined_at)
                     from public.group_members m
                     join public.profiles p on p.id = m.user_id
                     where m.group_id = p_group_id
                       and not exists (select 1 from public.blocks b
                                       where b.blocker_id = v_uid and b.blocked_id = m.user_id)), '[]'::jsonb)
         else '[]'::jsonb end
  from public.groups g
  cross join lateral public.group_card(g.id, v_uid, null) c
  where g.id = p_group_id;
end;
$$;

create or replace function public.create_group(
  p_name text,
  p_sport text,
  p_format text,
  p_city text,
  p_lat float8 default null,
  p_lng float8 default null,
  p_radius_km int default 5,
  p_min_age int default 18,
  p_visibility text default 'public',
  p_gender_rule text default 'open',
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid  uuid := public.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_tags text[];
  v_lat  float8;
  v_lng  float8;
  v_code text;
  v_id   uuid;
begin
  if char_length(v_name) not between 3 and 60 then
    raise exception 'Group name must be 3 to 60 characters';
  end if;
  if public.contains_blocked_term(v_name) then
    raise exception 'Group name is not allowed';
  end if;
  if p_sport is null or p_sport not in ('soccer', 'basketball', 'pickleball') then
    raise exception 'Choose a sport';
  end if;
  if p_format is null or p_format not in ('in_person', 'remote') then
    raise exception 'Choose in person or remote';
  end if;
  if char_length(v_city) not between 1 and 60 then
    raise exception 'Choose a city';
  end if;
  if p_format = 'in_person' then
    if p_lat is null or p_lng is null then
      raise exception 'Choose a location';
    end if;
    perform public.geo_point(p_lat, p_lng);
    -- Store only an approximate area (0.01 degrees, about 1 km).
    v_lat := round(p_lat::numeric, 2)::float8;
    v_lng := round(p_lng::numeric, 2)::float8;
  end if;
  if p_radius_km is null or p_radius_km not between 1 and 25 then
    raise exception 'Radius must be 1 to 25 km';
  end if;
  if p_min_age is null or p_min_age not in (18, 21, 25, 30, 35, 40) then
    raise exception 'Invalid minimum age';
  end if;
  if coalesce(public.user_age(v_uid), 0) < p_min_age then
    raise exception 'This group is for members aged % and over', p_min_age;
  end if;
  if coalesce(p_visibility, 'public') not in ('public', 'request', 'invite') then
    raise exception 'Invalid visibility';
  end if;
  if coalesce(p_gender_rule, 'open') not in ('open', 'women_nb') then
    raise exception 'Invalid gender rule';
  end if;
  if not public.gender_allowed(coalesce(p_gender_rule, 'open'), v_uid) then
    raise exception 'This group is for women and non-binary players';
  end if;
  select coalesce(array_agg(distinct t), '{}') into v_tags from unnest(coalesce(p_tags, '{}')) as t;
  if cardinality(v_tags) > 3 then
    raise exception 'Choose up to 3 tags';
  end if;
  if not public.valid_tags(v_tags) then
    raise exception 'Invalid tag';
  end if;
  if (select count(*) from public.groups where host_id = v_uid and status = 'active') >= 10 then
    raise exception 'You can host up to 10 groups';
  end if;

  loop
    v_code := public.gen_join_code();
    exit when not exists (select 1 from public.groups where join_code = v_code);
  end loop;

  insert into public.groups (host_id, name, sport, tags, city, format, lat, lng, area,
                             radius_km, min_age, visibility, gender_rule, join_code)
  values (v_uid, v_name, p_sport, v_tags, v_city, p_format, v_lat, v_lng, public.geo_point(v_lat, v_lng),
          p_radius_km, p_min_age, coalesce(p_visibility, 'public'), coalesce(p_gender_rule, 'open'), v_code)
  returning id into v_id;

  insert into public.group_members (group_id, user_id, role) values (v_id, v_uid, 'host');
  return v_id;
end;
$$;

create or replace function public.join_group(p_group_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid   uuid := public.require_uid();
  v_group public.groups%rowtype;
begin
  -- Lock the group so the 200 member cap holds under concurrent joins.
  select * into v_group from public.groups where id = p_group_id for update;
  if not found or v_group.status <> 'active' then
    raise exception 'Group not found';
  end if;
  if exists (select 1 from public.group_members where group_id = p_group_id and user_id = v_uid) then
    return 'joined';
  end if;
  if v_group.visibility = 'invite' then
    raise exception 'This group is invite-only';
  end if;
  perform public.assert_group_eligible(v_group, v_uid);

  if v_group.visibility = 'request' then
    insert into public.group_requests (group_id, user_id) values (p_group_id, v_uid)
    on conflict do nothing;
    return 'requested';
  end if;

  insert into public.group_members (group_id, user_id, role) values (p_group_id, v_uid, 'member');
  return 'joined';
end;
$$;

create or replace function public.join_group_by_code(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid   uuid := public.require_uid();
  v_group public.groups%rowtype;
begin
  select * into v_group from public.groups
  where join_code = upper(btrim(coalesce(p_code, ''))) and status = 'active'
  for update;
  if not found then
    raise exception 'Invalid code';
  end if;
  if exists (select 1 from public.group_members where group_id = v_group.id and user_id = v_uid) then
    return v_group.id;
  end if;
  perform public.assert_group_eligible(v_group, v_uid);

  insert into public.group_members (group_id, user_id, role) values (v_group.id, v_uid, 'member');
  delete from public.group_requests where group_id = v_group.id and user_id = v_uid;
  return v_group.id;
end;
$$;

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid  uuid := public.require_uid();
  v_role text;
  v_next uuid;
begin
  perform 1 from public.groups where id = p_group_id for update;
  select role into v_role from public.group_members where group_id = p_group_id and user_id = v_uid;
  if v_role is null then
    -- Not a member: also withdraw any pending request.
    delete from public.group_requests where group_id = p_group_id and user_id = v_uid;
    return;
  end if;

  delete from public.group_members where group_id = p_group_id and user_id = v_uid;

  if v_role = 'host' then
    select user_id into v_next
    from public.group_members
    where group_id = p_group_id
    order by (role = 'cohost') desc, joined_at, user_id
    limit 1;

    if v_next is null then
      update public.groups set status = 'archived' where id = p_group_id;
      delete from public.group_requests where group_id = p_group_id;
    else
      update public.group_members set role = 'host' where group_id = p_group_id and user_id = v_next;
      update public.groups set host_id = v_next where id = p_group_id;
    end if;
  end if;
end;
$$;

create or replace function public.approve_request(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid   uuid := public.require_uid();
  v_group public.groups%rowtype;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Only the host or a cohost can do that';
  end if;
  select * into v_group from public.groups where id = p_group_id for update;
  if not exists (select 1 from public.group_requests where group_id = p_group_id and user_id = p_user_id) then
    raise exception 'Request not found';
  end if;
  perform public.assert_group_eligible(v_group, p_user_id);

  delete from public.group_requests where group_id = p_group_id and user_id = p_user_id;
  insert into public.group_members (group_id, user_id, role) values (p_group_id, p_user_id, 'member')
  on conflict do nothing;
end;
$$;

create or replace function public.decline_request(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := public.require_uid();
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Only the host or a cohost can do that';
  end if;
  delete from public.group_requests where group_id = p_group_id and user_id = p_user_id;
end;
$$;

create or replace function public.remove_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid         uuid := public.require_uid();
  v_my_role     text;
  v_target_role text;
begin
  select role into v_my_role from public.group_members where group_id = p_group_id and user_id = v_uid;
  if v_my_role is null or v_my_role not in ('host', 'cohost') then
    raise exception 'Only the host or a cohost can do that';
  end if;
  if p_user_id = v_uid then
    raise exception 'Use leave group instead';
  end if;
  select role into v_target_role from public.group_members where group_id = p_group_id and user_id = p_user_id;
  if v_target_role = 'host' then
    raise exception 'The host cannot be removed';
  end if;
  if v_target_role = 'cohost' and v_my_role <> 'host' then
    raise exception 'Only the host can remove a cohost';
  end if;

  delete from public.group_members where group_id = p_group_id and user_id = p_user_id;
  delete from public.group_requests where group_id = p_group_id and user_id = p_user_id;
  insert into public.group_bans (group_id, user_id, banned_by) values (p_group_id, p_user_id, v_uid)
  on conflict do nothing;
end;
$$;

-- Permanently deletes the caller's auth user; every owned row cascades from
-- auth.users -> profiles -> (games, game_players, groups, group_members,
-- group_requests, group_messages, blocks). Reports the user filed are kept with
-- reporter_id set to null (anonymised); bans they issued keep banned_by null.
-- Supabase grants the postgres role (the owner of this function) delete on auth.users.
-- If a project ever lacks that permission, replace this with an Edge Function that
-- verifies the caller's JWT and calls supabase.auth.admin.deleteUser(user.id) with the
-- service role key; the app contract stays the same.
create or replace function public.delete_my_account()
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Grants (least privilege; anon gets nothing)
-- ---------------------------------------------------------------------------
revoke all on table
  public.profiles, public.blocked_terms, public.games, public.game_players, public.groups,
  public.group_members, public.group_requests, public.group_bans, public.group_messages,
  public.blocks, public.reports, public.public_profiles
from public, anon, authenticated;

revoke all on all sequences in schema public from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, gender, city) on public.profiles to authenticated;
grant select on public.public_profiles to authenticated;
grant select on public.group_messages to authenticated;
grant insert (group_id, body) on public.group_messages to authenticated;
grant select, delete on public.blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.blocks to authenticated;
grant insert (reporter_id, target_type, target_id, reason, details) on public.reports to authenticated;
grant select on public.group_requests to authenticated;

revoke all on all functions in schema public from public, anon, authenticated;

-- RLS helpers must be executable by the querying role.
grant execute on function public.is_group_member(uuid)  to authenticated;
grant execute on function public.is_group_admin(uuid)   to authenticated;
grant execute on function public.is_game_member(uuid)   to authenticated;
grant execute on function public.has_blocked(uuid)      to authenticated;

-- Contract RPCs.
grant execute on function public.nearby_games(float8, float8, int, text, text) to authenticated;
grant execute on function public.game_detail(uuid) to authenticated;
grant execute on function public.create_game(text, text, float8, float8, timestamptz, int, int, text, text[], text, text, text) to authenticated;
grant execute on function public.join_game(uuid) to authenticated;
grant execute on function public.join_game_by_code(text) to authenticated;
grant execute on function public.my_games() to authenticated;
grant execute on function public.leave_game(uuid) to authenticated;
grant execute on function public.cancel_game(uuid) to authenticated;
grant execute on function public.check_in(uuid, float8, float8) to authenticated;
grant execute on function public.nearby_groups(float8, float8, text, text) to authenticated;
grant execute on function public.my_groups() to authenticated;
grant execute on function public.group_detail(uuid) to authenticated;
grant execute on function public.create_group(text, text, text, text, float8, float8, int, int, text, text, text[]) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.approve_request(uuid, uuid) to authenticated;
grant execute on function public.decline_request(uuid, uuid) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Realtime (INSERT events on group_messages; RLS still applies to subscribers)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages'
     ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end;
$$;
