-- Signup trigger and the committed set of test users.

-- Rejected signups ----------------------------------------------------------
begin;
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('kid@test.local',
     jsonb_build_object('display_name', 'Kid', 'terms_version', '2026-10-04',
                        'birth_date', (current_date - interval '17 years')::date))$q$,
  'must be 18', 'signup under 18 fails');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('almost@test.local',
     jsonb_build_object('display_name', 'Almost', 'terms_version', '2026-10-04',
                        'birth_date', (current_date - interval '18 years' + interval '1 day')::date))$q$,
  'must be 18', 'signup one day short of 18 fails');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('nodob@test.local',
     '{"display_name":"No Dob","terms_version":"2026-10-04"}')$q$,
  'must be 18', 'signup without birth_date fails');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('baddob@test.local',
     '{"display_name":"Bad Dob","birth_date":"not-a-date","terms_version":"2026-10-04"}')$q$,
  'must be 18', 'signup with malformed birth_date fails');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('noterms@test.local',
     '{"display_name":"No Terms","birth_date":"1990-01-01"}')$q$,
  'Terms', 'signup without terms_version fails');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('noname@test.local',
     '{"birth_date":"1990-01-01","terms_version":"2026-10-04"}')$q$,
  'Display name', 'signup without display_name fails (no email fallback)');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('slur@test.local',
     '{"display_name":"retard","birth_date":"1990-01-01","terms_version":"2026-10-04"}')$q$,
  'not allowed', 'signup with blocked display name fails');
select tests.throws(
  $q$insert into auth.users (email, raw_user_meta_data) values ('nometa@test.local', null)$q$,
  'must be 18', 'signup without any metadata fails');
select tests.eq((select count(*) from public.profiles)::int, 0, 'no profiles created by failed signups');

-- Exactly 18 today is allowed.
insert into auth.users (email, raw_user_meta_data) values ('eighteen@test.local',
  jsonb_build_object('display_name', '  Just Eighteen  ', 'terms_version', '2026-10-04',
                     'birth_date', (current_date - interval '18 years')::date, 'gender', 'bogus'));
select tests.check(exists (select 1 from public.profiles p join auth.users u on u.id = p.id
                           where u.email = 'eighteen@test.local' and p.display_name = 'Just Eighteen'
                             and p.gender is null and p.terms_version = '2026-10-04'
                             and p.is_reviewer = false),
                   'signup at exactly 18 creates a trimmed profile, unknown gender dropped');
rollback;

-- Committed test users --------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  (tests.uid('alice'), 'alice@test.local',
   '{"display_name":"Alice","birth_date":"1994-03-01","gender":"woman","terms_version":"2026-10-04"}'),
  (tests.uid('bob'), 'bob@test.local',
   '{"display_name":"Bob","birth_date":"1999-06-15","gender":"man","terms_version":"2026-10-04"}'),
  (tests.uid('cara'), 'cara@test.local',
   '{"display_name":"Cara","birth_date":"2004-01-20","gender":"non_binary","terms_version":"2026-10-04"}'),
  (tests.uid('dan'), 'dan@test.local',
   jsonb_build_object('display_name', 'Dan', 'gender', 'man', 'terms_version', '2026-10-04',
                      'birth_date', (current_date - interval '19 years')::date)),
  (tests.uid('erin'), 'erin@test.local',
   '{"display_name":"Erin","birth_date":"1980-09-09","gender":"woman","terms_version":"2026-10-04"}'),
  (tests.uid('fred'), 'fred@test.local',
   '{"display_name":"Fred","birth_date":"1990-02-02","terms_version":"2026-10-04"}'),
  (tests.uid('rev'), 'reviewer@test.local',
   '{"display_name":"App Reviewer","birth_date":"1990-01-01","terms_version":"2026-10-04"}'),
  (tests.uid('host'), 'host@test.local',
   '{"display_name":"Jordan","birth_date":"1988-05-05","gender":"prefer_not","terms_version":"2026-10-04"}'),
  (tests.uid('gail'), 'gail@test.local',
   '{"display_name":"Gail","birth_date":"1992-07-07","gender":"woman","terms_version":"2026-10-04"}');

select tests.eq((select count(*) from public.profiles)::int, 9, 'test users created with profiles');
