# Beacon

Pickup sports app (Toronto launch): find, host and join soccer, basketball and pickleball games; sport groups with chat. 18+.

| Path | What | Status |
|---|---|---|
| `web/` | Waitlist site + Privacy, Terms, Guidelines, Support, Delete account pages. Netlify publishes this folder. | Live on push to `main` |
| `mobile/` | Expo SDK 57 app (iOS + Android), TypeScript, expo-router | Typechecks, bundles for both platforms |
| `supabase/` | Database migration (tables, RLS, RPCs), App Review demo seed, test suite | 276 tests passing |
| `docs/OWNER_STEPS.md` | What only the owner can do (accounts, keys, legal name, submit) | Start here |
| `docs/STORE_SUBMISSION.md` | Copy-paste answers for App Store Connect and Play Console | Matches the build |
| `docs/API_CONTRACT.md` | RPCs the app calls | |
| `MARKETING_WEEK1-4.md` | 30-day go-to-market plan | |

Live site: https://openfieldwaitlist.netlify.app

## Checks

```bash
supabase/tests/run.sh                 # database: migration, RLS, seed, deletion
cd mobile && npm ci && npm run typecheck
npx expo export --platform ios --platform android   # full JS bundle for both stores
```
