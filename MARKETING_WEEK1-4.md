# Beacon: Week 1-4 Marketing Execution Playbook

**Status:** Live at https://openfieldwaitlist.netlify.app | Target: 500 signups + 25 hosts by Oct 25

---

## **WEEK 1: SETUP & HOST RECRUITMENT (Sep 28 - Oct 4)**

### Monday: Instrument & Deploy Analytics

**Task 1: Add UTM tracking to form**
```html
<!-- In index.html, add hidden fields -->
<input type="hidden" id="utm_source" name="utm_source">
<input type="hidden" id="utm_medium" name="utm_medium">
<input type="hidden" id="utm_campaign" name="utm_campaign">

<script>
const url = new URL(window.location);
document.getElementById('utm_source').value = url.searchParams.get('utm_source') || 'organic';
document.getElementById('utm_medium').value = url.searchParams.get('utm_medium') || 'direct';
document.getElementById('utm_campaign').value = url.searchParams.get('utm_campaign') || 'waitlist';
</script>
```

**Task 2: Set up analytics**
- Enable Netlify Analytics (free, built-in)
- OR add Plausible (privacy-focused, $9/month): Insert script in `<head>`

**Task 3: Mailchimp setup**
1. Create free account at mailchimp.com
2. Create audience with fields: first_name, email, city, sports, referral_code, utm_source
3. Generate CSV export API key

**Task 4: Deploy**
```bash
git add .
git commit -m "Add UTM tracking and analytics"
git push origin main
# Netlify auto-deploys
```

**Deliverable:** Form now tracks source → Check Netlify dashboard for test submission with ?utm_source=test

---

### Tuesday-Friday: Host Recruitment (DMs)

**Target:** 5 hosts signed up

**Host List (40 people):**
```
Priority tier (repeat players from tests):
- Sam (soccer)
- Jay (basketball)  
- Kofi (basketball)
- Rui (soccer)
- Mia (pickleball)

Secondary (known Toronto sports enthusiasts):
- [Add 35 more from test cohort + friends]
```

**Message Template:**
```
Hi [Name],

We built Beacon - find pickup sports near you in 60 seconds.

We're in Toronto beta starting Oct 19, and we need 5 hosts to run the first games.

Early access + your own referral code. Top referrers get free premium.

In? → [openfieldwaitlist.netlify.app?ref=HOST_ABC123]

Thanks,
[Your name]
```

**Tracking:** Copy-paste this into a spreadsheet:
| Name | Sport | Status | Code | Signups |
|------|-------|--------|------|---------|

---

### Friday: Weekly Report

**Pull from Netlify Forms:**
1. Total submissions (target: 50)
2. Sports breakdown (aim for mix)
3. Top referral codes (should be the 5 host codes)
4. UTM breakdown (should be ~90% organic/direct)

**Template:**
```
Beacon Week 1 Report
━━━━━━━━━━━━━━━━━━
Signups: 50 (target: 50) ✅
Hosts signed: 5 (target: 5) ✅
Referral share: [X]%
Top codes: HOST_ABC123 (Y signups)
```

---

## **WEEK 2: GROUND GAME (Oct 5 - 11)**

### Flyer Printing & Distribution

**Design:** 4"x6" weatherproof postcard
```
🎯 FIND YOUR GAME IN 60 SECONDS

⚽ SOCCER  🏀 BASKETBALL  🎾 PICKLEBALL

See who's playing. Message them. Join.

[QR CODE] →
openfieldwaitlist.netlify.app

Top referrers get free premium year.
```

**Cost:** $65 for 150 flyers

**Parks (6 total):**
1. Christie Pits (soccer capital)
2. Trinity Bellwoods (mixed)
3. Dufferin Grove (basketball + soccer)
4. Regent Park (basketball)
5. Monarch Park (soccer)
6. Stan Wadlow (multi-sport)

**Each QR unique with UTM:**
```
Christie Pits: ?utm_source=flyer&utm_campaign=christie_pits
Trinity Bellwoods: ?utm_source=flyer&utm_campaign=trinity_bellwoods
[etc.]
```

### Social Media (Organic)

**Reddit:** Post in answer to pickup threads
- Subreddit: r/toronto, r/askTO
- Look for posts like "where to find pickup soccer"
- Respond genuinely, mention Beacon once

**Facebook Groups:** (Post with mod approval first)
- Toronto Pickup Soccer
- Toronto Basketball Runs
- Toronto Pickleball
- Join and comment authentically for 2-3 days before posting

**Saturday/Sunday In-Person Visits**
- 9am-11am at Christie Pits & Dufferin Grove
- Hand flyers to people actually playing
- "Hey! Building Beacon to connect you with more games. Join the waitlist!"

---

### Week 2 Exit Criteria
- ✅ 160 cumulative signups (city floor cleared)
- ✅ Flyers at 6 parks
- ✅ 11 hosts signed
- ✅ 2+ sports above 15% each

---

## **WEEK 3: AMPLIFY (Oct 12 - 18)**

### Video Content (3 short-form videos)

**Video 1: "The Problem" (15 sec)**
```
PAIN: Guy at park says "I wish I could find more people to play with"

CTA: Beacon - find your game in 60 seconds
```

**Video 2: "The Solution" (30 sec)**
```
DEMO: User opens app → sees soccer 2km away → taps → sees 4 players → messages → joins
CTA: Top 100 referrers get free premium
```

**Video 3: "Real Players" (15 sec)**
```
TESTIMONIAL: Quick clips of actual hosts from week 1-2 saying why they love it
CTA: Join the waitlist
```

**Post to:**
- TikTok (3 posts, native)
- Instagram Reels (3 posts)
- YouTube Shorts (3 posts)
- Rotate throughout the week

### Paid Ads ($195 total)

**Meta (Instagram/Facebook): $140**
- Daily budget: $10/day × 14 days
- Target: Toronto, 18-40, interested in sports/fitness
- A/B test: "Host angle" vs "Player angle"
- Measure: Cost per signup (kill if > $3)

**Reddit: $55**
- 5-day run in r/toronto
- Timing: Wednesday-Sunday (peak traffic)

### Partner Outreach (Email)

**Target:** 5-10 partners
- UofT Rec Club
- TMU Sports Club
- Pickleball Toronto
- Run Toronto
- 2 local sports bars

**Template:**
```
Hi [Partner name],

Beacon launches Oct 19 in Toronto. We're building a way to find pickup sports in 60 seconds.

Interested in running a named group at launch? [sport + day + time]

We'll give you a dedicated invite code for your community + free premium.

Interested? Reply here or join the waitlist: [link]

[Your name]
```

---

### Week 3 Exit Criteria
- ✅ 310 cumulative signups
- ✅ 3 videos shipped
- ✅ Paid ads running
- ✅ 18 hosts signed
- ✅ 2 partner groups committed

---

## **WEEK 4: REFERRAL PUSH & LAUNCH (Oct 19 - 25)**

### Email to Full List

**Subject:** "Top 100 Referrers Get Early Access — See Your Code"

```
Hi [Name],

You're in the Beacon waitlist. Here's the deal:

We're opening October 19 in Toronto.

Top 100 referrers get priority access + free premium for a year.

Your referral code: [BEACON_ABC123]

Share this link with your crew:
openfieldwaitlist.netlify.app?ref=BEACON_ABC123

Current count: X people

Let's go!
Beacon team
```

### Host Amplification

**For each of the 25 hosts:**
1. Send final recruitment email
2. Ask them to share their code in their group chat (WhatsApp, etc.)
3. Promise to feature top 5 referrers in the app

### Flyer Reprint

**Print 150 more of the top 2 converting parks**
- Keep what works
- Kill the rest

### Day 30 Report & Decision

**Go/No-Go Criteria:**
- ✅ 500 cumulative signups
- ✅ 25 hosts signed
- ✅ 20% referral share
- ✅ 60%+ from paid + organic (not brand new)

**If GO:** Launch app to top 100 referrers
**If NO-GO:** Extend week 2 + 3 tactics (flyers, social, partners)

---

## **Daily Messaging (Copy to Use)**

### Text: The Problem
"Finding pickup sports shouldn't be this hard."

### Text: The Solution
"Beacon: find your game in 60 seconds."

### Text: The Ask
"Join the waitlist. Top referrers get early access + free premium."

### Text: The Proof
"500+ Toronto players waiting. Soccer, basketball, pickleball."

---

## **Budget Tracker**

| Item | Budgeted | Actual | Status |
|------|----------|--------|--------|
| Flyer printing × 2 | $130 | | Pending |
| Meta ads | $140 | | Week 3 |
| Reddit ads | $55 | | Week 3 |
| Misc (tape, QR) | $40 | | Week 2 |
| **TOTAL** | **$300** | | |

---

## **Kill Rules**

- **Paid ads > $3 CPS after 5 days?** → Reallocate to flyers
- **Park flyers < 25 signups after 1 week?** → Pull and move elsewhere
- **Reddit > $5 CPS?** → Redirect budget to Meta or organic

---

## **Success Looks Like (Day 30)**

✅ 500 signups
✅ 25 hosts signed
✅ 20% referral rate
✅ 3 sports represented (15%+ each)
✅ $0.60 CPS average (under $2 CAD)
✅ Ready to launch app Oct 19

