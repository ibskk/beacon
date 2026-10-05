# web/ - public Beacon website

Netlify publishes this folder only (`publish = "web"` in `/netlify.toml`). Nothing outside `web/` is served. This README is blocked from being served by a forced 404 rule in `netlify.toml`.

## Pages

| URL | File | Purpose |
|---|---|---|
| `/` | `index.html` | Waitlist (CASL consent line, referral codes) |
| `/thanks/` | `thanks/index.html` | Waitlist no-JS fallback |
| `/privacy/` | `privacy/index.html` | Privacy Policy (waitlist + app) - App Store / Play privacy URL |
| `/terms/` | `terms/index.html` | Terms of Service and EULA, incl. referral rules (`#referral-rules`) |
| `/guidelines/` | `guidelines/index.html` | Community Guidelines |
| `/support/` | `support/index.html` | FAQ + support form - App Store support URL |
| `/support/thanks/` | `support/thanks/index.html` | Support form confirmation |
| `/delete-account/` | `delete-account/index.html` | Google Play account deletion URL |
| `/delete-account/thanks/` | `delete-account/thanks/index.html` | Deletion request confirmation |
| `/auth/confirmed/` | `auth/confirmed/index.html` | Supabase email-confirm redirect target |
| (any missing path) | `404.html` | Not found |

## Netlify Forms

Detected at deploy time from the static HTML. Each has `data-netlify="true"`, a hidden `form-name` input and a honeypot.

- `waitlist`: first_name, email, city, sports[], adult, my_code, referred_by, utm_source, utm_medium, utm_campaign (honeypot `company`). `referred_by` comes from `?ref=` (or `?referred_by=`); UTM fields from the matching URL params.
- `support`: name, email, topic, message (honeypot `website`)
- `deletion-request`: email, waitlist (optional), confirm (honeypot `website`)

Set up email notifications for `support` and `deletion-request` in Netlify (Forms > Notifications) so safety reports can be answered within 24 hours and deletions completed within 30 days. Delete processed submissions in Netlify to honour the retention periods in the Privacy Policy.

## Owner TODOs before app submission

- **Legal review.** These pages were drafted as a starting point and are not legal advice. Have a Canadian lawyer review the Privacy Policy, Terms/EULA and referral rules before submission.
- **Legal name and mailing address.** Add the legal business name (or your name if operating as a sole proprietor) and a mailing address where marked by the HTML comment at the top of `privacy/index.html` and `terms/index.html`. CASL requires a mailing address in every commercial email; Apple requires developer contact information.
- **Supabase region.** The Privacy Policy says Canada or United States. Once the project is created, state the actual region.
- **Email provider.** If you use an email service for waitlist updates, name it in Privacy section 9 and include an unsubscribe link and your mailing address in every email.
- **Account deletion vs. reports.** The policy and deletion page say reports filed about others may be kept up to 12 months in anonymised form. `docs/API_CONTRACT.md` currently cascades `reports filed` on account deletion. Either keep reports (with the reporter id nulled) to match the pages, or remove that sentence.
- **Quebec.** If you actively market to Quebec, French versions of the Terms and Privacy Policy are required under the Charter of the French Language.
- **Store forms.** Make the App Store privacy "nutrition label" and Google Play Data safety form match the Privacy Policy (no tracking, no ads, location used in-app only and not stored).
- **Supabase auth redirect.** Set the email-confirm redirect URL to `https://openfieldwaitlist.netlify.app/auth/confirmed/` (or the custom domain).
