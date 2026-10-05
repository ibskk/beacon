# Beacon: 7-Day Pre-Launch Checklist (Oct 4-11)

**Status:** Waitlist live ✅ | Backend docs done ✅ | App scaffold done ✅ | Next: Build backend → launch by Oct 19

---

## TODAY (Friday, Oct 4) — 2 hours

- [ ] **BACKEND SETUP** → Use SUPABASE_QUICKSTART.md
  - Create project at supabase.com
  - Copy API keys to `.env`
  - Run 7-table SQL schema (copy/paste each block in SQL Editor)
  - Test: `SELECT COUNT(*) FROM users;` returns 0 ✅

- [ ] **VERIFY APP CONNECTION**
  - `npx expo start`
  - Scan QR code → open Expo Go
  - Verify no errors in console
  - Games list shows 0 (correct, no data yet)

**Deliverable:** Backend live, app talking to Supabase ✅

---

## SATURDAY (Oct 5) — 3 hours

### Instrumentation & Marketing Setup

- [ ] **Add UTM Tracking to Netlify Form** (MARKETING_WEEK1-4.md, Week 1 → Task 1)
  - Edit `index.html`
  - Add hidden fields: utm_source, utm_medium, utm_campaign, referred_by
  - Add JavaScript to capture URL params
  - Deploy: `git push origin main` (auto-deploys in 2 min)

- [ ] **Test UTM Tracking**
  - Visit: `https://openfieldwaitlist.netlify.app?utm_source=test&utm_campaign=test_run`
  - Fill form with test email
  - Check Netlify dashboard → Forms tab → see submission with UTM values ✅

- [ ] **Mailchimp Setup**
  - Create free account at mailchimp.com
  - Create audience: name "Beacon Waitlist"
  - Add fields: first_name, email, city, sports, referral_code, utm_source
  - Generate API key for weekly syncs

**Deliverable:** Form tracking live, Mailchimp ready ✅

---

## SUNDAY (Oct 6) — 2 hours

### Host Recruitment Campaign

- [ ] **Prepare Host List**
  - Compile 40 contacts from test cohort + friends
  - Prioritize: Sam, Jay, Kofi, Rui, Mia (+ 35 others)
  - Create spreadsheet: Name | Sport | Status | Code | Signups

- [ ] **Send Host DMs** (MARKETING_WEEK1-4.md, Week 1 → message template)
  - Use template: "Hi [Name], We built Beacon... early access + referral code"
  - Add unique ref code per host: ?ref=HOST_[UNIQUE_CODE]
  - Target: 5 hosts signed by Friday

- [ ] **Track Responses**
  - Update spreadsheet as hosts reply
  - Record signup counts via their referral codes

**Deliverable:** 5+ host DMs sent ✅

---

## MONDAY-THURSDAY (Oct 7-10) — Ongoing

### Weekly Activities (parallel track)

**Daily:**
- Monitor Netlify form submissions (dashboard)
- Track host recruitment responses

**Wednesday:**
- Pull Netlify form data (exported as CSV)
- Count: total signups, sports mix, referral share
- Identify top 3 converting channels

**Friday:** (See below)

---

## FRIDAY (Oct 11) — 1 hour

### Weekly Report & Planning

- [ ] **Pull Week 1 Report** (MARKETING_WEEK1-4.md, Week 1 → Friday)
  - Total signups (target: 50)
  - Hosts signed (target: 5)
  - Top referral codes
  - Sports breakdown
  - UTM breakdown (should be ~90% organic/direct)

- [ ] **Evaluate Week 1 Results**
  - Did we hit 50 signups? 5 hosts?
  - Which channels worked (organic > paid)?
  - Any kill rules triggered (paid >$3 CPS)?

- [ ] **Plan Week 2** (MARKETING_WEEK1-4.md, Week 2)
  - **Flyers:** Design 4"x6" postcard, print 150 units ($65)
  - **Parks:** 6 locations + unique QR codes per park
  - **Social:** Reddit/Facebook posts (organic, mod approval first)
  - **In-person:** Weekend park visits (9-11am, hand flyers)

**Deliverable:** Week 1 report + Week 2 plan ready ✅

---

## Parallel Work: App Development (as time allows)

**Optional — can start Oct 7:**
- [ ] Clone Expo template or start from existing app.jsx
- [ ] Install dependencies: `npm install @react-navigation/native ...`
- [ ] Test MapScreen locally (may need Mapbox API key)
- [ ] Create mock first game in Supabase directly (SQL INSERT)
- [ ] Verify game appears in app list

**Not critical yet:** Supabase + app connection is priority. Mapbox/advanced features come after MVP works.

---

## Critical Path Summary

```
Oct 4:  Supabase live + app connection ✅
Oct 5:  UTM tracking + Mailchimp ✅
Oct 6:  Host recruitment campaign ✅
Oct 11: Week 1 report + Week 2 planning ✅

Oct 12-18: Week 2 execution (flyers, organic social, parks)
Oct 19-25: Week 3 & launch (videos, paid ads, top 100 referrers)
Oct 26:    GO/NO-GO decision (500 signups? 25 hosts?)
```

---

## Files Ready to Use

| File | Phase | Time |
|------|-------|------|
| SUPABASE_QUICKSTART.md | Backend setup | ~30 min |
| MARKETING_WEEK1-4.md | GTM execution | Ongoing |
| app.jsx | React Native scaffold | Ready to run |
| DEPLOYMENT_GUIDE.md | Full production checklist | Reference |

---

## Success Criteria (End of Week 1, Oct 11)

- ✅ 50+ signups on waitlist
- ✅ 5+ hosts signed up (their own referral codes working)
- ✅ 2+ sports above 15% each
- ✅ $0.80 CPS or lower (cost per signup)
- ✅ Supabase backend live and tested
- ✅ App connecting to backend (zero signup flow works end-to-end)

---

**Start with SUPABASE_QUICKSTART.md now.** 30 min to backend live. 🚀
