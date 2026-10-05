# Beacon: Current Status & Next Actions

**Updated:** Oct 4, 2026 | **Status:** ✅ Waitlist Live | 🔨 Backend Ready | 🚀 Launch Track On

---

## What's Done ✅

| Deliverable | Status | Link |
|---|---|---|
| **Waitlist Landing Page** | Live ✅ | https://openfieldwaitlist.netlify.app |
| **GitHub Repository** | Live ✅ | https://github.com/ibskk/beacon |
| **Brand Colors & UI** | Finalized ✅ | White (#fff) + Lime (#c2ff00) + Sport colors |
| **Supabase Schema** | Ready to deploy ✅ | 7 tables + RLS policies in SUPABASE_QUICKSTART.md |
| **React Native App Scaffold** | Ready to run ✅ | app-fixed.jsx (includes TextInput fix) |
| **Marketing Week 1-4 Plan** | Ready to execute ✅ | MARKETING_WEEK1-4.md |
| **Deployment Guide** | Complete ✅ | DEPLOYMENT_GUIDE.md |
| **7-Day Pre-Launch Checklist** | Ready ✅ | PRE_LAUNCH_7DAY.md |

---

## Critical Path: Next 7 Days (Oct 4-11)

### ⏱️ TODAY (Friday, Oct 4) — 2 hours

**Must Do:**
1. **Supabase Backend Setup** → Follow SUPABASE_QUICKSTART.md (30 min)
   - Create project at supabase.com
   - Copy API keys to `.env`
   - Run 7-table SQL schema in SQL Editor
   - Test: `SELECT COUNT(*) FROM users;` → should return 0 ✅

2. **Verify App Connection** (30 min)
   - Update `.env` with Supabase URL + key
   - Run `npx expo start`
   - Scan QR code → open Expo Go
   - Verify MapScreen loads (shows 0 games = correct)
   - No console errors ✅

**Deliverable:** Backend live + app talking to Supabase ✅

---

### 📊 SATURDAY (Oct 5) — 2 hours

**Must Do:**
1. Add UTM tracking to Netlify form (MARKETING_WEEK1-4.md, Week 1, Task 1)
   - Edit `index.html`
   - Add hidden fields: utm_source, utm_medium, utm_campaign, referred_by
   - Add JS to capture URL params
   - `git push origin main` (auto-deploys in 2 min)

2. Test tracking
   - Visit: `https://openfieldwaitlist.netlify.app?utm_source=test`
   - Fill form, verify submission appears in Netlify Forms tab ✅

**Deliverable:** UTM tracking live ✅

---

### 👥 SUNDAY (Oct 6) — 2 hours

**Must Do:**
1. Send host recruitment DMs to 40 contacts (MARKETING_WEEK1-4.md template)
   - Use template: "Hi [Name], We built Beacon...early access + referral code"
   - Each gets unique ref code: ?ref=HOST_XXXX
   - Track in spreadsheet: Name | Sport | Status | Code | Signups
   - Target: 5 hosts signed by Friday

**Deliverable:** 5+ host DMs sent ✅

---

### 📈 MONDAY-THURSDAY (Oct 7-10)

**Ongoing:**
- Check Netlify form submissions daily
- Update host recruitment spreadsheet
- Wednesday: Pull form data as CSV, analyze mix

---

### 📋 FRIDAY (Oct 11) — 1 hour

**Must Do:**
1. **Pull Week 1 Report** (MARKETING_WEEK1-4.md template)
   - Total signups (target: 50)
   - Hosts signed (target: 5)
   - Sports mix
   - UTM breakdown
   - Cost per signup

2. **Plan Week 2** (MARKETING_WEEK1-4.md, Week 2)
   - Flyers: Design + print 150 units ($65)
   - Parks: 6 locations + unique QR codes
   - Social: Reddit/Facebook organic posts

**Deliverable:** Week 1 report + Week 2 plan ready ✅

---

## Files Ready to Use

### Setup & Deployment
- **SUPABASE_QUICKSTART.md** — 30-minute backend setup (START HERE)
- **PRE_LAUNCH_7DAY.md** — Oct 4-11 execution checklist
- **DEPLOYMENT_GUIDE.md** — Full production deployment (reference)

### Code
- **app-fixed.jsx** — Complete React Native app scaffold (copy to `App.jsx`)
- **app.json** — Expo configuration with location permissions
- **lib/supabase.js** — Supabase client setup

### Marketing
- **MARKETING_WEEK1-4.md** — Full GTM plan with week-by-week tactics
- **netlify.toml** — Netlify deployment config
- **index.html** — Landing page with referral system

---

## Success Criteria (Oct 11)

By end of Week 1, you should have:

- ✅ Supabase backend live and tested
- ✅ React Native app connecting to Supabase
- ✅ Waitlist form tracking UTM + referrals
- ✅ 50+ signups on waitlist
- ✅ 5+ hosts signed up with referral codes
- ✅ 2+ sports represented (15%+ each)
- ✅ Cost per signup: ~$1 or lower

---

## Long-Term Timeline

| Phase | Duration | Target Date | Deliverable |
|---|---|---|---|
| **Week 1:** Backend + instrumentation | Oct 4-11 | Oct 11 | 50 signups, 5 hosts, backend live |
| **Week 2:** Ground game (flyers, organic social) | Oct 12-18 | Oct 18 | 160+ signups, 11 hosts |
| **Week 3:** Amplify (videos, paid ads) | Oct 19-25 | Oct 25 | 310+ signups, 18 hosts |
| **Week 4:** Referral push + launch | Oct 26-Nov 1 | Nov 1 | 500 signups, 25 hosts, GO/NO-GO decision |

---

## How to Use These Docs

1. **Right now:** Open SUPABASE_QUICKSTART.md → follow 30-min setup
2. **This weekend:** Use MARKETING_WEEK1-4.md Week 1 tasks
3. **Weekly:** Reference PRE_LAUNCH_7DAY.md for Friday checklists
4. **Deployment:** Use DEPLOYMENT_GUIDE.md for app store submission (Oct 19+)

---

## Git Workflow

All docs are in `/home/claude/beacon/` and pushed to GitHub:

```bash
cd /home/claude/beacon
git status                    # See all files
git log --oneline            # See commits
git push origin main         # Push changes
```

**Auto-deploy:** Any push to `main` branch auto-deploys to Netlify in ~2 min.

---

## Questions?

Each doc has a **Troubleshooting** section at the bottom.

**Most common issues:**
- "App won't connect" → Check `.env` has exact Supabase URL + key (no spaces)
- "Form not submitting" → Verify form has `name="waitlist"` and `netlify` attribute
- "Supabase queries timing out" → RLS policy too restrictive; test with test user

---

## What's Next After Oct 11

1. **Week 2 flyers:** Design + print, distribute to 6 parks
2. **Week 2 organic social:** Reddit + Facebook group posts (3 per channel)
3. **Week 2 in-person:** Saturday/Sunday at parks, hand flyers
4. **Week 3 video content:** 3 short-form videos for TikTok/Reels/YouTube Shorts
5. **Week 3 paid ads:** Meta $140 (14 days, 18-40 sports/fitness), Reddit $55 (5 days)
6. **Week 4:** Referral email blast to full waitlist, top 100 referrers get early access

---

## Current Metrics (Oct 4, 12 PM)

| Metric | Value | Target |
|---|---|---|
| Waitlist signups | ? | 500 by Oct 25 |
| Hosts signed | 0 | 25 by Oct 25 |
| Backend status | Ready to deploy | Live by Oct 4 EOD |
| App status | Scaffold ready | Live local testing by Oct 5 |
| Marketing UTM | Ready to deploy | Live by Oct 5 EOD |

---

**Ready? Start with SUPABASE_QUICKSTART.md. 30 minutes to backend live.** 🚀
