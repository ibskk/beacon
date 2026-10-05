#!/usr/bin/env bash
# Runs the Beacon database tests against a throwaway local Postgres 16 + PostGIS cluster
# with a small Supabase shim (auth schema, roles, realtime publication).
#
#   supabase/tests/run.sh
#
# Exits non-zero on the first failing assertion.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPABASE_DIR="$(cd "$HERE/.." && pwd)"
MIGRATION="${MIGRATION_FILE:-$SUPABASE_DIR/migrations/20261004000000_beacon_v1.sql}"
SEED="$SUPABASE_DIR/seed_demo.sql"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${PGPORT_TEST:-54329}"

if [[ ! -f /usr/share/postgresql/16/extension/postgis.control ]]; then
  echo "Installing PostGIS for Postgres 16..."
  apt-get install -y postgresql-16-postgis-3 >/dev/null 2>&1 \
    || { apt-get update >/dev/null 2>&1 && apt-get install -y postgresql-16-postgis-3 >/dev/null; }
fi

WORK="$(mktemp -d -t beacon-pgtest-XXXXXX)"
LOG="$WORK/out.log"
chmod 755 "$WORK"

# Postgres refuses to run as root; use the postgres OS user when we are root.
if [[ "$(id -u)" == "0" ]]; then
  chown postgres "$WORK"
  AS_PG=(runuser -u postgres --)
else
  AS_PG=()
fi

cleanup() {
  "${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"${AS_PG[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -l "$WORK/server.log" -w \
  -o "-p $PORT -k $WORK -c listen_addresses='' -c timezone=UTC" start >/dev/null

psql_run() {
  "${AS_PG[@]}" "$PGBIN/psql" -h "$WORK" -p "$PORT" -U postgres -d postgres \
    -X -q -v ON_ERROR_STOP=1 "$@"
}

run_file() {
  local label="$1" file="$2"
  echo "== $label"
  if ! psql_run -f "$file" >>"$LOG" 2>&1; then
    grep -E "PASS:|FAIL|ERROR|denied" "$LOG" | tail -n 15 || true
    echo "FAILED in $label (full log above)"
    exit 1
  fi
}

: >"$LOG"
run_file "supabase shim" "$HERE/shim.sql"
run_file "migration" "$MIGRATION"
run_file "migration (second apply)" "$MIGRATION"
run_file "test helpers" "$HERE/helpers.sql"
run_file "signup and users" "$HERE/00_users.sql"
run_file "privileges and RLS" "$HERE/01_privileges.sql"
run_file "games" "$HERE/02_games.sql"
run_file "groups" "$HERE/03_groups.sql"
run_file "group chat" "$HERE/04_chat.sql"
run_file "account deletion" "$HERE/05_account.sql"
run_file "seed_demo definition" "$SEED"
run_file "seed_demo" "$HERE/06_seed.sql"

# Concurrency: two players race for the last spot. With the row lock in join_game the
# second transaction waits, then sees the game full.
echo "== concurrent join_game"
GAME_ID="$(psql_run -At -c "
  begin;
  select tests.as_user('alice');
  select public.create_game('soccer', 'Race Park', 43.66, -79.42, now() + interval '1 day', 60, 2);
  commit;" | grep -E '^[0-9a-f-]{36}$')"
racer() {
  psql_run -At -c "
    begin;
    select tests.as_user('$1');
    select public.join_game('$GAME_ID');
    select pg_sleep(1);
    commit;" >"$WORK/race_$1.out" 2>&1
}
racer bob & P1=$!
racer cara & P2=$!
RC1=0; RC2=0
wait $P1 || RC1=$?
wait $P2 || RC2=$?
PLAYERS="$(psql_run -At -c "select count(*) from public.game_players where game_id = '$GAME_ID'")"
FULL_ERRORS="$(cat "$WORK"/race_*.out | grep -c 'Game is full' || true)"
if [[ "$PLAYERS" == "2" && "$FULL_ERRORS" == "1" && $((RC1 + RC2)) -ne 0 ]]; then
  echo "NOTICE:  PASS: concurrent joins cannot overbook (one winner, one 'Game is full')" >>"$LOG"
else
  cat "$WORK"/race_*.out
  echo "FAIL: concurrent join produced $PLAYERS players and $FULL_ERRORS full errors"
  exit 1
fi

# Leftover failure markers would indicate a swallowed assertion.
if grep -q "FAIL" "$LOG"; then
  grep "FAIL" "$LOG"
  exit 1
fi

PASSED="$(grep -c "PASS:" "$LOG")"
echo
echo "All tests passed: $PASSED assertions."
