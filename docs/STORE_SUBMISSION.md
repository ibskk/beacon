# Store Submission Package

Copy-paste answers for App Store Connect and Google Play Console. Every answer matches what the build and the privacy policy actually do. If the app changes, update this file first.

## 1. Listing copy

| Field | Value |
|---|---|
| App name (30 max) | Beacon: Pickup Sports |
| Fallback names if taken | Beacon Pickup, Beacon - Find Your Game |
| Subtitle (iOS, 30 max) | Find pickup games near you |
| Short description (Play, 80 max) | Find and host pickup soccer, basketball and pickleball games near you. |
| Category | Sports (secondary: Social Networking) |
| Keywords (iOS, 100 max) | pickup,soccer,basketball,pickleball,sports,games,teammates,league,run,court,field,toronto |
| Support URL | https://openfieldwaitlist.netlify.app/support/ |
| Marketing URL | https://openfieldwaitlist.netlify.app/ |
| Privacy Policy URL | https://openfieldwaitlist.netlify.app/privacy/ |
| Terms / EULA | https://openfieldwaitlist.netlify.app/terms/ (iOS: App Information > License Agreement > custom, paste or link) |
| Account deletion URL (Play) | https://openfieldwaitlist.netlify.app/delete-account/ |
| Price | Free. No in-app purchases. No ads. |

**Description**

> Beacon helps you find a pickup game in minutes.
>
> See open soccer, basketball and pickleball games near you on a map, check the level and how many spots are left, and join with one tap. Hosting is just as quick: pick a venue, a time and the number of players, and Beacon fills the spots.
>
> Join sport groups for your area to find your regulars, chat with members, and hear about the next game first. Hosts choose who can find and join: radius, minimum age, open or request-to-join, or invite code only.
>
> Built for safety:
> - The map shows games and groups, never people. Your live location is only used to find games near you and check you in; it is never stored or shown to anyone. Venue pins you place for a game or group are public.
> - Report any message, player, game or group. Our team reviews reports within 24 hours.
> - Block anyone, instantly. Their messages, games and groups disappear for you.
> - 18+ only.
>
> Now open in Toronto.

## 2. Apple App Store Connect

### App Review Information (biggest rejection risk: reviewer sees an empty app)
- Sign-in required: Yes
- Demo account: the reviewer account created in OWNER_STEPS step 4 (email + password)
- Notes (paste):

> Beacon is a pickup-sports app currently live in Toronto, Canada. The demo account is seeded with real Toronto games and groups.
>
> 1. Sign in with the demo account. If location is denied or you are outside Toronto, the app shows Toronto by default ("Showing games in Toronto"), so all content is visible from anywhere. Location permission is optional.
> 2. Explore tab: map and list of games and groups. Tap an open game to Join, then Leave, or use the ... menu to Report it.
> 3. Games tab: the demo account has already joined three upcoming games. Check-in normally requires being within 500 m of the venue at game time; the demo account is flagged as a reviewer, so Check in works from anywhere without location.
> 4. Groups tab: open "Christie Pits Pickup Soccer" to see the chat. Long-press a message from Sam to Report it or Block Sam. Blocking hides Sam's messages, games and groups; content from the other host stays, so the app remains usable. Unblock under Profile > Blocked users.
> 5. Profile tab: Blocked users, Terms, Privacy, Community Guidelines, Support, and Delete account (permanent, in-app). To test deletion, please sign up a new account (any email you can confirm, birth date 18+) rather than deleting the demo account, which other review steps rely on.
>
> User-generated content safeguards (Guideline 1.2): users accept the Terms (zero tolerance for objectionable content and abusive users) at signup; a server-side filter blocks objectionable terms, and new members cannot post links or phone numbers for 7 days; any user can report content or block users; 3 reports auto-hide a message; the team reviews reports within 24 hours and removes content and users. Contact: https://openfieldwaitlist.netlify.app/support/
>
> No payments, no ads, no tracking. Location is When In Use only.

### App Privacy (nutrition label)
Tracking: **No**. Data used to track you: **None**.

| Data type | Collected | Linked to user | Purpose |
|---|---|---|---|
| Contact Info > Email Address | Yes | Yes | App Functionality |
| Contact Info > Name (display name) | Yes | Yes | App Functionality |
| Identifiers > User ID | Yes | Yes | App Functionality |
| User Content > Other User Content (group messages, reports) | Yes | Yes | App Functionality |
| Other Data > Other Data Types (date of birth for 18+ check, optional gender for game rules) | Yes | Yes | App Functionality |
| Location > Precise Location | Yes (venue pin a host places for a game; shown publicly) | Yes | App Functionality |
| Location > Coarse Location | Yes (group area, rounded to about 1 km; shown publicly) | Yes | App Functionality |

Live device location is sent only with a nearby or check-in query and never stored; the stored location data is the pins people choose to publish.

Everything else: Not collected. This matches `ios.privacyManifests` in `mobile/app.config.ts`.

### Age rating
Answer the questionnaire truthfully: user-generated content Yes, messaging/chat Yes, unrestricted web access No, gambling/contests No, medical No, violence/sexual content None. Then set the age rating to **18+** (the app's own minimum age), using "override to higher rating" if the questionnaire lands lower.

### Other fields
| Field | Answer |
|---|---|
| Export compliance | Uses only standard HTTPS. `ITSAppUsesNonExemptEncryption = false` is in the build, so no question at upload. |
| Content rights | Does not contain third-party content requiring rights. |
| Sign in with Apple | Not required (email and password only, no third-party login). |
| iPad | Not supported (`supportsTablet: false`); runs in compatibility mode. |
| Devices for screenshots | 6.9" iPhone required (1320 x 2868). No iPad screenshots needed. |
| Copyright | 2026 Beacon |

## 3. Google Play Console

### Before production is possible
New **personal** developer accounts must run a **closed test with at least 12 testers opted in for 14 continuous days** before applying for production access. Start this the day the account is created (testers: the 5 priority hosts plus friends). Organization accounts (D-U-N-S number) are exempt.

### App content declarations
| Section | Answer |
|---|---|
| Privacy policy | https://openfieldwaitlist.netlify.app/privacy/ |
| App access | Restricted. Provide the same demo login and the review notes above. |
| Ads | No ads |
| Content rating (IARC) | Category: Social/Communication-style app with UGC. Users interact: Yes. Shares location with other users: Yes (hosts publish a venue pin, which may be where they are). Digital purchases: No. Expect Mature 17+ / PEGI 18 equivalents; accept the result. |
| Target audience | 18 and over only. Not designed for children. |
| News app | No |
| Government app | No |
| Financial features | None |
| Health | None |
| Data safety | See below |
| Account deletion | In-app (Profile > Delete account) and web URL above |
| Location permissions | Foreground only (ACCESS_FINE/COARSE). Background location is blocked in the manifest, so no background-location declaration. |
| User-generated content | Yes: report, block, filter, terms acceptance, 24 h moderation |

### Data safety form
- Data collected: Yes. Shared with third parties: **No** (Supabase, Netlify and maps providers are service providers, which Play does not count as sharing).
- Encrypted in transit: Yes. Users can request deletion: Yes.

| Category | Type | Collected | Optional | Purpose |
|---|---|---|---|---|
| Personal info | Name | Yes | No | App functionality, Account management |
| Personal info | Email address | Yes | No | App functionality, Account management |
| Personal info | User IDs | Yes | No | App functionality, Account management |
| Personal info | Other info (date of birth, gender) | Yes | Gender optional | App functionality |
| Messages | Other in-app messages | Yes | Yes | App functionality |
| Location | Approximate location | Yes (group area, rounded to about 1 km) | Yes | App functionality |
| Location | Precise location | Yes (venue pin a host places) | Yes | App functionality |

Do not mark location "processed ephemerally": live location is ephemeral, but venue pins and group areas are stored, so the accurate answer is "collected". Shared: No (pins are shown to other users of the app, which Play does not count as sharing with third parties).

### Store assets
Icon 512 x 512 (from `mobile/assets/icon.png`, resized), feature graphic 1024 x 500, 2 to 8 phone screenshots.

## 4. Screenshot rules (both stores)
Real UI from the current build, demo account, Toronto data. No people shown on the map, no invented stats or reviews, no store badges, no device frames with other apps' UI. Suggested set: Explore map, game detail with Join, group chat, host a game form, Profile safety section.

## 5. Common rejections and how this build answers them

| Guideline | Risk | Covered by |
|---|---|---|
| 2.1 App completeness | Empty app for reviewer, crashes, dead links | Demo account with seeded data, city fallback outside Toronto, reviewer check-in bypass, all legal links live |
| 2.1 / 4.2 Placeholders, minimum functionality | "Coming soon" tabs | None in build; DMs, payments, push not shown anywhere |
| 1.2 User-generated content | No report/block/filter/terms | All four, server-enforced |
| 5.1.1(v) Account deletion | Deactivate only | Permanent in-app deletion, cascades all data |
| 5.1.1 Permissions | Vague purpose string, background location | Specific When In Use string only; app works with location denied |
| 5.1.1 / 5.1.2 Privacy | Missing policy, label mismatch | Policy live; label and manifest match this file |
| 4.8 Login services | Third-party login without Apple | Email only |
| 2.3 Metadata | Name, keywords, screenshots misleading | Accurate copy above, real screenshots |
| 1.4 Physical harm | Meetups with strangers | 18+, public venues, safety guidelines, assumption-of-risk terms |
| Play: UGC policy | Same as 1.2 | Same |
| Play: Account deletion URL | Missing web route | /delete-account/ with request form |
| Play: 12 testers / 14 days | Production access denied | Closed test planned from day one |
