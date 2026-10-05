# Beacon backend (Supabase)

Implements `docs/API_CONTRACT.md`.

| Path | Purpose |
|---|---|
| `migrations/20261004000000_beacon_v1.sql` | Full v1 schema: tables, RLS, triggers, RPCs, grants, realtime |
| `seed_demo.sql` | Defines `seed_demo(reviewer_email, host_email, host2_email)` for App Review / demo data |
| `tests/run.sh` | Local test suite (throwaway Postgres 16 + PostGIS with a Supabase shim) |

## Apply to a Supabase project

1. **SQL editor**: paste and run `migrations/20261004000000_beacon_v1.sql` (or `supabase db push` with the CLI).
2. **Authentication > Sign In / Providers > Email**: enable email provider, turn **Confirm email** on, set **Minimum password length** to 8.
3. **Authentication > URL Configuration**: Site URL `https://openfieldwaitlist.netlify.app/auth/confirmed/` (add it to Redirect URLs as well).
4. **Create the reviewer and demo host accounts.** Signup is rejected unless the user metadata contains `display_name`, `birth_date` (18+) and `terms_version`. The dashboard "Add user" form cannot set metadata, so create both accounts with the Admin API (auto-confirmed):

   ```bash
   curl -X POST "https://<project-ref>.supabase.co/auth/v1/admin/users" \
     -H "apikey: <service_role_key>" -H "Authorization: Bearer <service_role_key>" \
     -H "Content-Type: application/json" \
     -d '{"email":"reviewer@yourdomain.com","password":"<8+ chars>","email_confirm":true,
          "user_metadata":{"display_name":"App Reviewer","birth_date":"1990-01-01","terms_version":"2026-10-04"}}'
   ```

   Repeat for the host account (`display_name` "Jordan") and a second host (`display_name` "Sam"). Alternatively sign both up through the app and confirm them under Authentication > Users. Never ship or commit the service role key.
5. **SQL editor**: run `seed_demo.sql`, then:

   ```sql
   select seed_demo('reviewer@yourdomain.com', 'host@yourdomain.com', 'host2@yourdomain.com');
   ```

   Safe to re-run; it replaces the previous demo rows and keeps games 2 hours to 6 days in the future. The reviewer is joined to the games 1 to 3 days out, so re-run it on the day you submit. Content is split between the two hosts so a reviewer who blocks one still sees a full app.
6. Give App Review the reviewer email and password. The reviewer account bypasses the check-in distance and time rules.

## Moderation

- Extend the chat filter: `insert into public.blocked_terms (term) values ('word');` (lowercase letters and spaces, whole-word match).
- Reports are in `public.reports` (read with the service role or the SQL editor). A message reported by 3 different members is hidden automatically.
- Mute a member: `update public.group_members set muted_until = now() + interval '7 days' where group_id = ... and user_id = ...;`

## Run the tests

```bash
supabase/tests/run.sh
```

Needs Postgres 16 at `/usr/lib/postgresql/16` (installs `postgresql-16-postgis-3` if missing). Creates a temporary cluster, applies the shim, the migration (twice, to check re-runs), the seed, and every test file, and removes the cluster on exit. Any failed assertion stops the run with a non-zero exit code.
