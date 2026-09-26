# Connect Beacon Waitlist to Netlify (2 minutes)

Your GitHub repo is live at: **https://github.com/ibskk/beacon**

All files pushed ✅

---

## Deploy to Netlify (Choose ONE method)

### **Method 1: Fastest - Netlify UI (Recommended)**

1. Go to **https://app.netlify.com**
2. Log in (or create free account)
3. Click **"Add new site"** → **"Import an existing project"**
4. Click **"GitHub"**
5. When prompted, authorize Netlify to access your GitHub account
6. Search for and select **`ibskk/beacon`**
7. Click **"Deploy site"**

**Settings auto-fill correctly:**
- Build command: *(leave empty)*
- Publish directory: `.`

**Done!** Your site goes live in ~2 minutes. ✅

**You'll get a URL like:** `https://your-site-name.netlify.app`

---

### **Method 2: Command Line (If you prefer)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy this repo
cd /home/claude/beacon
netlify deploy --prod
```

---

## Next: Add Your Domain

Once live on Netlify, add your custom domain:

### **In Netlify Dashboard:**
1. Go to **Site settings** → **Domain management**
2. Click **"Add domain"**
3. Enter your domain: `waitlist.beacon.app`
4. Netlify shows nameservers

### **At Your Domain Registrar** (Namecheap, Google Domains, etc.):
1. Log in to your registrar
2. Go to DNS settings for your domain
3. Update nameservers to Netlify's nameservers
4. Save

**Wait 24-48 hours for DNS propagation** → Domain is live!

---

## Verify It Works

Once deployed:

1. ✅ Visit your Netlify URL (from dashboard)
2. ✅ Fill out the waitlist form
3. ✅ Click "Join the Waitlist"
4. ✅ Should show success message
5. ✅ Check **Netlify dashboard → Forms** to see submission

**Tip:** Form submissions auto-appear in Netlify dashboard. No backend needed!

---

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Complete landing page (16KB, zero dependencies) |
| `netlify.toml` | Netlify configuration |
| `package.json` | Project metadata |
| `README.md` | Quick start guide |
| `DEPLOYMENT.md` | Detailed deployment steps |

---

## Troubleshooting

**Q: "Form not submitting?"**
A: Make sure form has `name="waitlist"` and `netlify` attribute. It's there. ✅

**Q: "Not seeing form submissions?"**
A: Check Netlify **Forms** tab → wait a few seconds → refresh

**Q: "Site not deploying?"**
A: Make sure you selected `ibskk/beacon` repo. Netlify auto-builds on every push.

**Q: "Domain not working?"**
A: DNS takes 24-48 hours. Use Netlify's `.netlify.app` URL for testing.

---

## Auto-Deploy on Every Push

After connecting to Netlify, every time you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

**Netlify auto-deploys in 2-3 minutes.** No extra steps needed! 🚀

---

## Next Steps (Week 1-2)

1. ✅ Deploy to Netlify (this page)
2. Add custom domain (optional but recommended)
3. Test form submissions
4. Set up Supabase + SendGrid for email sequences (see `../beacon-backend-setup.md`)
5. Launch Reddit/Twitter marketing campaign (see `../beacon-marketing-playbook.md`)

---

**Ready? Go to https://app.netlify.com and deploy!** 🎉

## Waitlist to email tool bridge

`netlify/functions/submission-created.mts` runs on every verified submission to the
`waitlist` form and pushes the signup to the email tool. No export, no Zapier.

It stays inert until credentials exist, so it is safe to deploy before the email
account is set up: with no provider configured it logs the signup and returns 200.
The Netlify submission record remains the source of truth either way.

### Configure (pick one)

Mailchimp:
| Variable | Where to find it |
|---|---|
| `MAILCHIMP_API_KEY` | Account > Extras > API keys. Must keep its `-usX` suffix. |
| `MAILCHIMP_LIST_ID` | Audience > Settings > Audience name and defaults > Audience ID |

Create these audience merge fields first, or the values arrive empty:
`FNAME`, `CITY`, `SPORTS`, `MYCODE`, `REFBY`.

ConvertKit:
| Variable | Where to find it |
|---|---|
| `CONVERTKIT_API_KEY` | Settings > Advanced > API key |
| `CONVERTKIT_FORM_ID` | The numeric id in the form's editor URL |

Set them in Netlify under Project configuration > Environment variables, scoped to
Functions, then redeploy. Mailchimp wins if both are set.

### Behaviour
- Upserts on Mailchimp via the subscriber hash, so a repeat signup updates rather than errors.
- Skips anyone who did not tick 18+. Required by the brief and by CASL.
- Normalizes `sports[]` to a comma-separated string and lowercases the email.
- Returns 502 on a provider error so the failure is visible in the function log;
  the submission is already stored by Netlify and can be replayed.

### Verify
Submit a real signup, then check Project > Logs > Functions for
`mailchimp: subscribed ...` or `convertkit: subscribed ...`.
