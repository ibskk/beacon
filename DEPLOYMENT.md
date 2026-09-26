# Beacon Waitlist - Netlify Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create GitHub Repository
```bash
cd beacon-netlify
git init
git add .
git commit -m "Initial Beacon waitlist setup"
```

Then create a new repo on GitHub:
1. Go to **github.com/new**
2. Name it: `beacon-waitlist`
3. Add description: "Beacon pickup sports waitlist page"
4. Click "Create repository"

Push your code:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/beacon-waitlist.git
git push -u origin main
```

### Step 2: Deploy to Netlify
1. Go to **app.netlify.com**
2. Click "New site from Git"
3. Select "GitHub"
4. Find and select `beacon-waitlist` repo
5. Settings:
   - Build command: leave empty (static site)
   - Publish directory: `.` (root)
6. Click "Deploy site"

**Status:** Live in ~2 minutes ✅

### Step 3: Add Custom Domain
1. In Netlify dashboard: **Domain settings**
2. Click "Add domain"
3. Enter your domain (e.g., `waitlist.beacon.app`)
4. Copy Netlify nameservers
5. Go to your registrar (Namecheap, Google Domains, etc.)
6. Update DNS nameservers
7. Wait 24-48 hours for propagation

### Step 4: Enable Form Submissions
Netlify form handling is **automatically enabled** with the `netlify` attribute on the form.

- Submissions appear in: **Netlify Dashboard → Forms**
- Email notifications sent to your Netlify account email
- No additional setup required

---

## File Structure

```
beacon-netlify/
├── index.html          # Main landing page (white/lime green aesthetic)
├── netlify.toml        # Netlify configuration
├── .gitignore          # Git ignore rules
└── DEPLOYMENT.md       # This file
```

---

## Features Included

✅ **Waitlist Form**
- Name, email, city fields
- Unique referral code per user (stored in localStorage)
- Copy-to-clipboard functionality
- Netlify form handling (auto-email notifications)

✅ **Design**
- White background with black text
- Lime green CTA buttons (#c2ff00)
- Responsive mobile-first design
- Dark mode support
- Clean Apple/Crocs aesthetic

✅ **Social Proof**
- Player count badge ("500+ players")
- Testimonials section
- Feature highlights
- Sports badges (Soccer, Basketball, Pickleball)

✅ **Performance**
- Minimal CSS/JS (no frameworks needed)
- No build step required
- Static site (fast CDN delivery)

---

## Environment Variables (Optional)

If you later add backend services, create a `.env` file (not committed to GitHub):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-public-anon-key
SENDGRID_API_KEY=your-sendgrid-key
```

For Netlify hosting, add these in:
**Settings → Environment → Variables**

---

## Form Submission Flow

### Current (Netlify Forms - No Backend)
1. User fills form → Clicks "Join the Waitlist"
2. Form submits to Netlify
3. Email notification sent to your email
4. Success message shown to user
5. Submissions visible in Netlify dashboard

### Later (Add Supabase for Referral Tracking)
See `../beacon-backend-setup.md` for integrating:
- Supabase database for storing emails + referral codes
- SendGrid for custom confirmation emails
- Referral link generation (`?ref=BEACON_XYZ1`)

---

## Monitoring & Analytics

**Built-in (Free):**
- Netlify Analytics: Page views, traffic sources
- Form submissions: Netlify dashboard

**Add Google Analytics:**
```html
<!-- Add to <head> in index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

Replace `GA_ID` with your Google Analytics property ID.

---

## Troubleshooting

**Form submissions not appearing?**
- Check Netlify dashboard → Forms
- Verify form has `name="waitlist"` and `netlify` attribute
- Check spam folder for Netlify notifications

**Domain not resolving?**
- DNS propagation takes 24-48 hours
- Verify nameservers in Netlify match registrar
- Use `nslookup your-domain.com` to check

**Not seeing referral code?**
- Clear browser localStorage and refresh
- Check browser console for JS errors

---

## Next Steps

1. **Week 1 (Launch):** Domain live + Reddit/Twitter posts
2. **Week 2:** Product Hunt submission
3. **Week 3:** Paid ads ($100-200 budget test)
4. **Week 4:** Public beta launch on app store

For full marketing strategy, see: `../beacon-marketing-playbook.md`

---

## Support

- Netlify docs: https://docs.netlify.com
- GitHub pages: https://docs.github.com/en/pages
- Netlify forms: https://docs.netlify.com/forms/setup/

Questions? Check the main Beacon project docs or contact team.
