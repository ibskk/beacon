# Beacon: Quick Start Execution Matrix

**Don't read everything. Just follow the row for today.** ⚡

---

## TODAY (Friday Oct 4) - 2 HOURS

| Task | Time | How | Success = |
|------|------|-----|-----------|
| **1. Setup Supabase** | 30 min | Open SUPABASE_QUICKSTART.md → follow every step | Backend live + test query returns 0 ✅ |
| **2. Verify App** | 30 min | `npx expo start` → scan QR → check console | MapScreen loads, 0 games shown, no errors ✅ |
| **3. Commit** | 5 min | `git push origin main` | All files in GitHub ✅ |

**Done?** You have a live backend + working app connection. Proceed to Saturday.

---

## SATURDAY (Oct 5) - 2 HOURS

| Task | Time | How | Success = |
|------|------|-----|-----------|
| **1. Add UTM tracking** | 45 min | Edit `index.html` + add hidden fields + JS | Form captures utm_source, utm_medium, utm_campaign ✅ |
| **2. Deploy** | 5 min | `git push origin main` | Netlify auto-deploys ✅ |
| **3. Test** | 10 min | Visit `https://openfieldwaitlist.netlify.app?utm_source=test` → fill form | Netlify Forms tab shows submission with UTM values ✅ |
| **4. Mailchimp** | 20 min | mailchimp.com → create audience + add fields | Free Mailchimp account ready ✅ |

**Done?** Form now tracks where signups come from. Proceed to Sunday.

---

## SUNDAY (Oct 6) - 2 HOURS

| Task | Time | How | Success = |
|------|------|-----|-----------|
| **1. Compile host list** | 20 min | Excel: Name \| Sport \| Status \| Code \| Signups | 40 contacts listed ✅ |
| **2. Generate ref codes** | 10 min | 5 codes: HOST_ABC123, HOST_DEF456... | Each host has unique code ✅ |
| **3. Send DMs** | 90 min | Use template from MARKETING_WEEK1-4.md | 40 DMs sent, 5+ replies by Friday ✅ |

**Done?** Hosts will start signing up. Track responses daily Mon-Fri.

---

## MONDAY-THURSDAY (Oct 7-10) - DAILY

| Task | Time | How | Daily? |
|------|------|-----|--------|
| **Check Netlify Forms** | 5 min | app.netlify.com → Forms tab | ✅ Every morning |
| **Track host responses** | 5 min | Update spreadsheet | ✅ As they reply |
| **Wednesday pull data** | 10 min | Export Netlify form CSV, analyze | ✅ Wednesday EOD |

**Parallel:** Can optionally clone/test app locally (optional, not blocking).

---

## FRIDAY (Oct 11) - 1 HOUR

| Task | Time | How | Success = |
|------|------|-----|-----------|
| **1. Pull report** | 20 min | Export Netlify Forms → count signups/hosts | 50 signups, 5 hosts, 2+ sports ✅ |
| **2. Analyze channels** | 10 min | Which UTMs drove most? Organic vs paid? | Know which channels work ✅ |
| **3. Plan Week 2** | 30 min | Read MARKETING_WEEK1-4.md Week 2 → commit to flyers + social | Week 2 budget + tactics locked ✅ |

**Done?** Ready to scale to Week 2.

---

## WEEK 2 (Oct 12-18) - IF WEEK 1 SUCCESS

If 50 signups + 5 hosts hit:

| Week 2 Tactic | Cost | Time | ROI |
|---|---|---|---|
| 150 flyers (6 parks) | $65 | 4 hrs | ~50 signups |
| Reddit posts (organic) | $0 | 2 hrs | ~20 signups |
| Facebook group posts | $0 | 2 hrs | ~10 signups |
| Weekend park visits | $0 | 4 hrs (hands out flyers) | ~30 signups |

**Target Week 2 EOD:** 160+ signups, 11 hosts, $0.80 CPS

---

## WEEK 3 (Oct 19-25) - IF WEEK 2 SUCCESS

If 160 signups + 11 hosts hit:

| Week 3 Tactic | Cost | Time | ROI |
|---|---|---|---|
| 3 short-form videos | $0 | 6 hrs | TikTok/Reels distribution |
| Meta ads (14 days, $10/day) | $140 | Setup only | ~100 signups |
| Reddit ads (5 days) | $55 | Setup only | ~30 signups |

**Target Week 3 EOD:** 310+ signups, 18 hosts, 2 partner groups committed

---

## WEEK 4 (Oct 26-Nov 1) - LAUNCH DECISION

| Decision Point | Metric | Target | Go? |
|---|---|---|---|
| Signups | 500+ | 500 | ✅ |
| Hosts | 25+ | 25 | ✅ |
| Referral % | 20%+ | 20% | ✅ |
| CPS | <$2 CAD | <$2 | ✅ |

**If all ✅:** Launch app to top 100 referrers on Oct 19
**If any ❌:** Extend Weeks 2-3 tactics, re-evaluate

---

## File Quick Reference

| When | Open This | Why |
|------|-----------|-----|
| Right now (TODAY) | SUPABASE_QUICKSTART.md | 30-min backend setup |
| This weekend | MARKETING_WEEK1-4.md | Week 1 tasks + templates |
| Each Friday | PRE_LAUNCH_7DAY.md | Weekly checklist |
| Deployment time (Oct 19+) | DEPLOYMENT_GUIDE.md | App store submission |
| Questions | README_CURRENT_STATUS.md | Full context + troubleshooting |

---

## One-Sentence Priorities

- **Oct 4:** Backend live + app connected
- **Oct 5:** Form tracking marketing data
- **Oct 6:** Host recruitment started
- **Oct 11:** 50 signups, 5 hosts, Week 2 plan locked
- **Oct 18:** 160 signups, 11 hosts, ready for launch push
- **Oct 25:** GO/NO-GO decision based on metrics

---

## Don't Skip

- ✅ Supabase setup (gates everything)
- ✅ UTM tracking (enables optimization)
- ✅ Host recruitment (builds social proof)
- ✅ Weekly reporting (shows what works)

---

**Start NOW:** SUPABASE_QUICKSTART.md (30 min) 🚀
