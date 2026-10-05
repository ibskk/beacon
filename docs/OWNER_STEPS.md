# Owner Steps: from repo to approved

Everything that can be done without your accounts is done. These steps need you (logins, payments, legal identity). Follow in order. Total hands-on time is about 3 to 4 hours, plus store waiting periods.

## Decide first (blocks submission)
1. **Name.** The app and site say Beacon; the brand assets say OpenField. Pick one and run a trademark search (CIPO and USPTO, classes 9 and 41). App Store names must be unique, so check availability by creating the app record in App Store Connect (step 6). If you switch to OpenField, change `name` in `mobile/app.config.ts`, the store copy in `STORE_SUBMISSION.md`, and the site text.
2. **Legal identity.** Register a sole proprietorship or corporation (Ontario Business Registry) and get a mailing address (a PO box is fine). Add both where the HTML comment marks the spot at the top of `web/privacy/index.html` and `web/terms/index.html`. CASL requires them in every marketing email too.
3. **Lawyer review** of privacy, terms and referral rules (not legal advice; a one-hour review is enough).

## Accounts (costs)
4. Apple Developer Program: USD 99/year (enrol as an organization if you incorporate; needs a D-U-N-S number). Google Play Console: USD 25 one-time. Expo account: free.

## Backend (45 min)
5. Create a Supabase project (region: Canada Central if offered, else US East). Then follow `supabase/README.md`:
   - SQL Editor: run `supabase/migrations/20261004000000_beacon_v1.sql`, then `supabase/seed_demo.sql`.
   - Authentication settings: email confirmations on, minimum password 8, Site URL `https://openfieldwaitlist.netlify.app/auth/confirmed/`.
   - Create the three demo accounts as the README describes (reviewer, host "Jordan", second host "Sam"), then `select seed_demo('reviewer@yourdomain', 'host@yourdomain', 'host2@yourdomain');`. The second host matters: review notes tell the reviewer to block Sam, and the app must still have content afterwards.
   - Put the Supabase region in the privacy policy where it says "region chosen at setup".
   - Re-run `seed_demo` the same day you press Submit for Review (and before every resubmission). The reviewer is joined to games 1 to 3 days out, so the seed must be fresh.

## App build (1 hour)
6. In `mobile/`: copy `.env.example` to `.env`, fill the Supabase URL and anon key. `npm install`, `npx expo start`, test on your phone with Expo Go: sign up, join a game, chat, report, block, delete a throwaway account. Deleting on the real project is the one path the local tests cannot prove (it removes the row from Supabase's `auth.users`), so do it once before submitting.
7. Android map: create a Google Maps SDK for Android key (Google Cloud Console, restrict it to package `com.beaconpickup.app`) and set it as an EAS environment variable `GOOGLE_MAPS_ANDROID_API_KEY`. Without it, Android shows the list view only (still functional, not a rejection).
8. Set the Supabase variables in EAS too (`eas env:create` for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, environment production).
9. `npm i -g eas-cli && eas login && eas init`, then `eas build -p ios --profile production` and `eas build -p android --profile production`.

## Store submission
10. iOS: `eas submit -p ios`. In App Store Connect fill every field from `STORE_SUBMISSION.md` section 2, attach screenshots (6.9" iPhone), add the demo login and review notes, submit. Test the build in TestFlight first.
11. Android: create the app, fill App content from section 3, upload with `eas submit -p android` to a **closed testing** track, add 12+ testers, keep them opted in for 14 days, then apply for production.

## Operations you commit to (reviewers check these)
- Check Netlify Forms (support, deletion-request) and Supabase `reports` table daily. Act on safety reports within 24 hours: delete content, delete or ban the account.
- Deletion requests from the web form: delete the user in Supabase Authentication within 30 days (everything cascades), and remove them from the email list.
- Add moderators' blocked terms in the `blocked_terms` table as needed.

## After approval
Re-run `seed_demo` only for future review submissions; real users replace demo content. Keep the demo accounts for future reviews.
