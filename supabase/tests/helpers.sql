-- Assertion and impersonation helpers. Each assertion raises on mismatch, which stops
-- psql (ON_ERROR_STOP) and fails the run.

create schema tests;
grant usage on schema tests to anon, authenticated;

-- Fixed ids for the test users, so tests read clearly.
create function tests.uid(p_name text) returns uuid
language sql immutable as $$
  select case p_name
    when 'alice' then '00000000-0000-0000-0000-00000000000a'
    when 'bob'   then '00000000-0000-0000-0000-00000000000b'
    when 'cara'  then '00000000-0000-0000-0000-00000000000c'
    when 'dan'   then '00000000-0000-0000-0000-00000000000d'
    when 'erin'  then '00000000-0000-0000-0000-00000000000e'
    when 'fred'  then '00000000-0000-0000-0000-00000000000f'
    when 'rev'   then '00000000-0000-0000-0000-000000000010'
    when 'host'  then '00000000-0000-0000-0000-000000000011'
    when 'gail'  then '00000000-0000-0000-0000-000000000012'
    when 'host2' then '00000000-0000-0000-0000-000000000013'
  end::uuid;
$$;

-- Become an authenticated user for the rest of the transaction.
create function tests.as_user(p_name text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
                     json_build_object('sub', tests.uid(p_name), 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function tests.as_anon() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

create function tests.pass(p_name text) returns void
language plpgsql as $$
begin
  raise notice 'PASS: %', p_name;
end;
$$;

create function tests.check(p_ok boolean, p_name text) returns void
language plpgsql as $$
begin
  if p_ok is distinct from true then
    raise exception 'FAIL: %', p_name;
  end if;
  raise notice 'PASS: %', p_name;
end;
$$;

create function tests.eq(p_actual anyelement, p_expected anyelement, p_name text) returns void
language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL: % (expected %, got %)', p_name, p_expected, p_actual;
  end if;
  raise notice 'PASS: %', p_name;
end;
$$;

-- Run p_sql and require it to raise an error whose message contains p_expected.
create function tests.throws(p_sql text, p_expected text, p_name text) returns void
language plpgsql as $$
declare
  v_msg text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_msg = message_text;
    if position(lower(p_expected) in lower(v_msg)) = 0 then
      raise exception 'FAIL: % (expected error containing "%", got "%")', p_name, p_expected, v_msg;
    end if;
    raise notice 'PASS: %', p_name;
    return;
  end;
  raise exception 'FAIL: % (expected error containing "%", but it succeeded)', p_name, p_expected;
end;
$$;

-- Run p_sql and require it to succeed.
create function tests.ok(p_sql text, p_name text) returns void
language plpgsql as $$
declare
  v_msg text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_msg = message_text;
    raise exception 'FAIL: % (unexpected error "%")', p_name, v_msg;
  end;
  raise notice 'PASS: %', p_name;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Shared scratch values (ids created in one statement and used in the next).
create table tests.vars (k text primary key, v text);
grant all on tests.vars to anon, authenticated;

create function tests.set(p_k text, p_v text) returns void
language sql as $$
  insert into tests.vars values (p_k, p_v) on conflict (k) do update set v = excluded.v;
$$;

create function tests.get(p_k text) returns text
language sql stable as $$ select v from tests.vars where k = p_k; $$;

grant execute on all functions in schema tests to anon, authenticated;
