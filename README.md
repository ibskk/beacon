# Beacon Waitlist Landing Page

Pickup sports near you. Find your game in 60 seconds.

## 🚀 Quick Deploy

```bash
# 1. Clone/download this folder
# 2. Create GitHub repo and push:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/beacon-waitlist.git
git push -u origin main

# 3. Go to netlify.com → Connect GitHub repo
# 4. Netlify auto-deploys on every push ✅
```

**Live in 2 minutes.** No build process needed.

---

## 📋 File Overview

| File | Purpose |
|------|---------|
| `index.html` | Complete landing page (HTML + CSS + JS) |
| `netlify.toml` | Netlify configuration |
| `.gitignore` | Git ignore rules |
| `DEPLOYMENT.md` | Step-by-step deployment guide |
| `README.md` | This file |

---

## ✨ Features

- ✅ Waitlist email capture
- ✅ Unique referral codes per user
- ✅ Netlify forms (auto-email notifications)
- ✅ Responsive design (mobile-first)
- ✅ Dark mode support
- ✅ Social proof section
- ✅ Sports badges (Soccer, Basketball, Pickleball)
- ✅ Zero build dependencies

---

## 🎨 Design

- **Background:** Pure white (#ffffff)
- **Text:** Black (#000000)
- **Primary CTA:** Lime green (#c2ff00)
- **Secondary:** Teal badges (#1fb881), Orange badges (#ff8a3d)
- **Aesthetic:** Clean, minimal, Apple-meets-Crocs style

---

## 📊 Form Fields

Users enter:
1. **Name** — For personalization
2. **Email** — For waitlist + confirmations
3. **City** — Toronto, Mississauga, Ottawa, Montreal, Vancouver, Calgary, Other
4. **Referral Code** — Auto-generated, shareable (BEACON_XXXX format)

Submissions appear in **Netlify Forms dashboard** → receive email notifications.

---

## 🔧 Customization

### Change CTA color:
Find and replace `#c2ff00` with your color

### Change domain name:
Update in `index.html` line 5: `<meta name="og:title">`

### Add Google Analytics:
See `DEPLOYMENT.md` for GA4 setup

### Update referral program:
Edit the "Proof" section stats (line numbers 500+)

---

## 📈 Scale This

**Month 1:** Netlify forms (100 submissions/month free)
**Month 2+:** Integrate Supabase + SendGrid for:
- Custom confirmation emails
- Referral link tracking
- Player leaderboard
- Email sequences

See `../beacon-backend-setup.md` for instructions.

---

## 🎯 Launch Checklist

- [ ] Domain purchased ($0.88-$12/year)
- [ ] GitHub repo created
- [ ] Deployed to Netlify
- [ ] Custom domain DNS configured
- [ ] Form submissions tested
- [ ] Social media preview checked
- [ ] Mobile responsiveness verified
- [ ] Analytics installed (optional)
- [ ] Reddit/Twitter posts prepared
- [ ] Product Hunt submission ready

---

## 📞 Need Help?

1. **Deployment issues?** → See `DEPLOYMENT.md`
2. **Form not working?** → Check Netlify Forms tab
3. **Design tweaks?** → Edit CSS in `index.html` `<style>` tag
4. **Scaling to backend?** → See `../beacon-backend-setup.md`

---

## 📄 License

Private project — Beacon team only.

---

**Ready to deploy?** Follow `DEPLOYMENT.md` → You'll be live in under 5 minutes. 🎉
