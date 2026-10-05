# Beacon API Contract (v1, store submission build)

Single source of truth between `supabase/` (backend) and `mobile/` (Expo app). Both sides implement exactly this. All RPCs are Postgres functions in schema `public`, called with `supabase.rpc(name, args)`. Arg names are prefixed `p_`.

## Product scope for v1 (what ships, nothing else)

- Email + password auth. No third-party login (so Sign in with Apple is not required).
- Signup collects display name, date of birth (must be 18+, enforced server-side), optional gender, and explicit acceptance of Terms (zero tolerance for objectionable content and abusive users).
- Map + list of open games and public groups near the user. Location is used for the query only and never stored for users. If location is denied or the user is outside 50 km of any game, browse by city (default Toronto).
- Games: create, join (seat-locked), leave, cancel (host), check in (within 500 m of venue, 30 min before start until end; reviewer accounts bypass distance).
- Groups: create (host settings: radius 1-25 km, format in_person/remote, min age 18/21/25/30/35/40, visibility public/request/invite, gender rule), join, request, join by 6-char code, leave, group chat (text only, realtime), host approve/remove.
- Safety: report message/user/game/group, block user (hides their messages, games and groups from you), server content filter, auto-hide message at 3 reports, new-member limits.
- Account: edit display name, blocked list, delete account (in-app, permanent), sign out. Links to Privacy, Terms, Community Guidelines, Support.
- Not in v1: DMs, calls, push, payments, images, people on the map, presence. Do not show any of these, not even "coming soon".

## Enums

| Name | Values |
|---|---|
| sport | `soccer`, `basketball`, `pickleball` |
| tag (max 3) | `beginner`, `intermediate`, `competitive`, `5v5`, `7v7`, `11v11`, `3v3`, `doubles`, `after_work`, `early_morning`, `weekend`, `coed`, `indoor`, `outdoor` |
| level | `any`, `beginner`, `intermediate`, `advanced` |
| gender_rule | `open`, `women_nb` (women and non-binary) |
| gender (optional, private) | `woman`, `man`, `non_binary`, `prefer_not` |
| game visibility | `public`, `code` |
| group format | `in_person`, `remote` |
| group visibility | `public`, `request`, `invite` |
| member role | `host`, `cohost`, `member` |
| report target_type | `message`, `user`, `game`, `group` |
| report reason | `spam`, `harassment`, `hate`, `sexual`, `violence`, `scam`, `underage`, `other` |

## Signup

`supabase.auth.signUp({ email, password, options: { data: { display_name, birth_date: 'YYYY-MM-DD', gender?: string, terms_version: '2026-10-04' } } })`

A trigger on `auth.users` creates `public.profiles`. It raises an exception (signup fails with message containing `must be 18`) if birth_date is missing or under 18, and fails if `terms_version` is missing. The app must surface the error text.

## Tables the client touches directly

| Table | Client may | Notes |
|---|---|---|
| `profiles` | select own row, update own `display_name`, `gender`, `city` | columns: id, display_name, birth_date, gender, city, terms_version, terms_accepted_at, is_reviewer, created_at. Other users' rows not readable. |
| `public_profiles` (view) | select | id, display_name only. |
| `group_messages` | select (members only, blocked senders and hidden rows excluded), insert `{ group_id, body }` | columns: id (bigint), group_id, sender_id, sender_name, body, created_at. sender_id/sender_name/created_at set by server. Realtime enabled (INSERT events). |
| `blocks` | select own, insert `{ blocked_id }`, delete own | columns: blocker_id, blocked_id, created_at. |
| `reports` | insert `{ target_type, target_id, reason, details? }` | target_id is text (uuid or message id as string). No select. |
| `group_requests` | select (own rows, or rows for groups you host/cohost) | columns: group_id, user_id, created_at. |

Insert errors on `group_messages` raise with readable messages: `Message blocked by content filter`, `New members cannot post links or phone numbers for 7 days`, `Slow down: 10 messages per minute`, `You are muted in this group`.

## RPCs

All return JSON-friendly rows. Coordinates are `lat`/`lng` float8. Times are timestamptz ISO strings.

### Games

`nearby_games(p_lat float8 = null, p_lng float8 = null, p_radius_km int = 25, p_city text = 'Toronto', p_sport text = null)`
returns setof: `id uuid, sport text, tags text[], level text, venue_name text, city text, lat float8, lng float8, starts_at timestamptz, duration_min int, spots_total int, spots_taken int, gender_rule text, host_id uuid, host_name text, distance_km float8 (null when no coords), is_joined bool, is_host bool`
Rules: status open, visibility public, not ended (starts_at + duration > now()), host not blocked by caller. With coords: within radius, ordered by distance. Without coords: city match, ordered by starts_at. Limit 100.

`game_detail(p_game_id uuid)` returns one row: all nearby_games fields plus `join_code text (host only, else null), status text, checked_in bool, roster jsonb` (array of `{user_id, display_name, checked_in}`; visible to host and joined players, else `[]`).

`create_game(p_sport, p_venue_name, p_lat, p_lng, p_starts_at timestamptz, p_duration_min int, p_spots_total int, p_level text = 'any', p_tags text[] = '{}', p_gender_rule text = 'open', p_visibility text = 'public', p_city text = 'Toronto')` returns uuid. Host auto-joins. Validates: starts_at in the future and within 30 days, duration 30-240, spots 2-40, tags valid and max 3.

`join_game(p_game_id uuid)` returns void. Row-locks the game; raises `Game is full`, `Game has ended`, `Game was cancelled`, `This game is for women and non-binary players`, `You are blocked from this game`. Idempotent if already joined.

`join_game_by_code(p_code text)` returns uuid (game id).

`my_games()` returns setof the same shape as `nearby_games` (`distance_km` always null): games the caller hosts or has joined, any visibility, status open or cancelled, not ended more than 24 h ago. Ordered by starts_at.

`leave_game(p_game_id uuid)` returns void. Host cannot leave (must cancel).

`cancel_game(p_game_id uuid)` returns void. Host only.

`check_in(p_game_id uuid, p_lat float8, p_lng float8)` returns void. Raises `Check-in opens 30 minutes before start`, `You need to be within 500 m of the venue`, `Join the game first`. Reviewer accounts (`profiles.is_reviewer`) skip the distance and time checks.

### Groups

`nearby_groups(p_lat float8 = null, p_lng float8 = null, p_city text = 'Toronto', p_sport text = null)`
returns setof: `id uuid, name text, sport text, tags text[], city text, lat float8, lng float8 (null for remote), radius_km int, format text, min_age int, visibility text, gender_rule text, member_count int, games_this_week int, distance_km float8, is_member bool, my_role text, has_requested bool`
Rules: visibility public or request (never invite), status active, caller age >= min_age, gender rule matches, host not blocked. With coords: in_person groups where distance <= radius_km, plus remote groups in the same city. Without coords: city match.

`my_groups()` returns setof the same shape, groups the caller belongs to.

`group_detail(p_group_id uuid)` returns one row: same shape plus `join_code text (host/cohost only), members jsonb` (array of `{user_id, display_name, role}`, members only, else `[]`).

`create_group(p_name text, p_sport text, p_format text, p_city text, p_lat float8 = null, p_lng float8 = null, p_radius_km int = 5, p_min_age int = 18, p_visibility text = 'public', p_gender_rule text = 'open', p_tags text[] = '{}')` returns uuid. Area rounded to 0.01 degrees. Host added as role host. 6-char join code generated (A-Z, 2-9, no 0/O/1/I).

`join_group(p_group_id uuid)` returns text: `joined` (public) or `requested` (request). Checks age, gender, 200 member cap, bans. Invite groups raise `This group is invite-only`.

`join_group_by_code(p_code text)` returns uuid. Same checks except radius and visibility.

`leave_group(p_group_id uuid)` returns void. Host leaving transfers to oldest cohost, else oldest member, else archives the group.

`approve_request(p_group_id uuid, p_user_id uuid)`, `decline_request(p_group_id uuid, p_user_id uuid)` return void. Host or cohost.

`remove_member(p_group_id uuid, p_user_id uuid)` returns void. Host or cohost; removed users are banned from rejoining.

### Account

`delete_my_account()` returns void. Deletes the auth user; every owned row cascades (profile, memberships, messages, games hosted, groups hosted, blocks). Reports the user filed are kept but anonymised (reporter_id set to null); reports about the user are kept. Client then calls `supabase.auth.signOut()`.

## Errors

RPCs raise `exception` with a short human-readable message (no SQL detail). The app shows `error.message` directly.

## Reviewer / demo

`supabase/seed_demo.sql` defines `seed_demo(p_reviewer_email text, p_host_email text)`: marks the reviewer `is_reviewer = true` and creates 6 Toronto games (soccer, basketball, pickleball across Christie Pits, Trinity Bellwoods, Dufferin Grove, Regent Park) starting 2 hours to 6 days from now, hosted by the host account with the reviewer joined to one, plus 3 public groups with seeded messages. Re-runnable (deletes the previous demo rows first).
