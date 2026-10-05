# Beacon: Complete Deployment Guide

**Status:** ✅ Waitlist live | 🔨 Backend ready | 🚀 App ready to build

---

## **PART 1: SUPABASE BACKEND SETUP (2 hours)**

### Step 1: Create Supabase Project

1. Go to **https://supabase.com**
2. Click **"New Project"**
3. Name: `beacon-prod`
4. Database password: (save securely)
5. Region: `us-east-1` (or closest to Toronto: `ca-central-1`)
6. Click **"Create New Project"** (waits ~2 min)

### Step 2: Get API Keys

Once project loads:
1. Go to **Settings → API**
2. Copy these values to `.env`:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon public key)

Example:
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Step 3: Enable PostGIS Extension

In **Supabase Dashboard → SQL Editor:**
1. Click **"New Query"**
2. Paste:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
3. Click **"Run"**

### Step 4: Create Database Schema

Copy each SQL block into **SQL Editor** and run:

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  city TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  referral_code TEXT UNIQUE DEFAULT (gen_random_uuid()::text),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_self_select ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_self_update ON users
  FOR UPDATE USING (auth.uid() = id);
```

**Games Table:**
```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  city TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  spots_total INT NOT NULL,
  level TEXT DEFAULT 'any',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  visibility TEXT DEFAULT 'public',
  gender_rule TEXT DEFAULT 'open',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Anyone can view public games
CREATE POLICY games_select_public ON games
  FOR SELECT USING (visibility = 'public');

-- Host can view their own games
CREATE POLICY games_select_self ON games
  FOR SELECT USING (auth.uid() = host_id);

-- Only host can insert/update/delete
CREATE POLICY games_insert ON games
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY games_update ON games
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY games_delete ON games
  FOR DELETE USING (auth.uid() = host_id);

-- Index for proximity searches
CREATE INDEX idx_games_location ON games USING GIST (location);
CREATE INDEX idx_games_city ON games(city);
```

**Players Table:**
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'joined',
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Users can only see their own player records
CREATE POLICY players_select ON players
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own join
CREATE POLICY players_insert ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can check in
CREATE POLICY players_update ON players
  FOR UPDATE USING (auth.uid() = user_id);
```

**Groups Table:**
```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  city TEXT NOT NULL,
  area GEOGRAPHY(POINT, 4326),
  radius_km INT DEFAULT 5,
  format TEXT DEFAULT 'in_person',
  min_age INT DEFAULT 18,
  visibility TEXT DEFAULT 'public',
  gender_rule TEXT DEFAULT 'open',
  join_code TEXT UNIQUE,
  member_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY groups_select_public ON groups
  FOR SELECT USING (visibility = 'public');

CREATE POLICY groups_select_member ON groups
  FOR SELECT USING (id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  ));

-- Index for proximity
CREATE INDEX idx_groups_area ON groups USING GIST (area);
```

**Group Members Table:**
```sql
CREATE TABLE group_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own memberships
CREATE POLICY group_members_select ON group_members
  FOR SELECT USING (auth.uid() = user_id);
```

**Group Messages Table:**
```sql
CREATE TABLE group_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Only group members can read messages
CREATE POLICY group_messages_select ON group_messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Members can insert messages
CREATE POLICY group_messages_insert ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );
```

---

## **PART 2: REACT NATIVE APP SETUP (1-2 hours)**

### Step 1: Create Expo Project

```bash
# Create new Expo project
npx create-expo-app Beacon

# Navigate to project
cd Beacon

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @react-navigation/native-stack
npm install expo-location expo-constants
npm install @supabase/supabase-js
npm install zustand
npm install axios

# Install dev dependencies
npm install --save-dev @babel/preset-env
```

### Step 2: Create .env File

```bash
# In root of Beacon folder
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
EOF
```

### Step 3: Create Folder Structure

```bash
mkdir -p app lib components
```

### Step 4: Copy App Files

Copy the `app.jsx` from this repo into the `Beacon` folder

### Step 5: Create lib/supabase.js

```bash
cat > lib/supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
EOF
```

### Step 6: Create app.json

```bash
cat > app.json << 'EOF'
{
  "expo": {
    "name": "Beacon",
    "slug": "beacon-sports",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to find games near you",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to find games near you"
      }
    },
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    },
    "plugins": ["expo-location"],
    "scheme": "beacon"
  }
}
EOF
```

### Step 7: Test Locally

```bash
# Start Expo server
npx expo start

# On iPhone: Scan QR code with Camera app → open in Expo Go
# On Android: Open Expo Go app → Scan QR code
```

---

## **PART 3: DEPLOYMENT (App Stores)**

### iOS (TestFlight)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
eas login

# Create build profile
eas build --platform ios --profile preview

# Once built, submit to TestFlight
eas submit --platform ios --latest
```

### Android (Google Play)

```bash
# Create keystore (one time)
eas build --platform android --profile preview

# Submit
eas submit --platform android --latest
```

---

## **PART 4: NETLIFY LANDING PAGE UPDATES**

### Update Form with Hidden Fields

In `index.html`, add after `<form>`:

```html
<input type="hidden" id="utm_source" name="utm_source" value="">
<input type="hidden" id="utm_medium" name="utm_medium" value="">
<input type="hidden" id="utm_campaign" name="utm_campaign" value="">
<input type="hidden" id="referred_by" name="referred_by" value="">
```

### Add Script to Capture URL Params

```javascript
<script>
const params = new URLSearchParams(window.location.search);
document.getElementById('utm_source').value = params.get('utm_source') || 'organic';
document.getElementById('utm_medium').value = params.get('utm_medium') || 'direct';
document.getElementById('utm_campaign').value = params.get('utm_campaign') || 'waitlist';
document.getElementById('referred_by').value = params.get('ref') || '';
</script>
```

### Commit & Deploy

```bash
cd beacon (Netlify repo)
git add .
git commit -m "Add UTM and referral tracking to form"
git push origin main
# Netlify auto-deploys in 2 min
```

---

## **PART 5: LAUNCH CHECKLIST**

### Backend ✅
- [ ] Supabase project created
- [ ] PostGIS extension enabled
- [ ] All 7 tables created with RLS
- [ ] API keys in `.env`
- [ ] Test query runs successfully

### App ✅
- [ ] Expo project created
- [ ] Dependencies installed
- [ ] App code copied
- [ ] Supabase client configured
- [ ] Tests locally on iOS/Android

### Marketing ✅
- [ ] Netlify form has UTM fields
- [ ] Week 1 host outreach list ready
- [ ] Flyer template designed ($65 budget)
- [ ] Reddit/Facebook posts drafted
- [ ] Mailchimp audience created

### Deployment ✅
- [ ] iOS build submitted to TestFlight
- [ ] Android build ready for Play Store
- [ ] Landing page updated
- [ ] Analytics installed
- [ ] Moderation plan drafted

---

## **LIVE COMMANDS**

### Day 1 (Oct 5)
```bash
# Check Netlify form submissions
# URL: https://app.netlify.com → Forms tab

# Check analytics
# URL: https://openfieldwaitlist.netlify.app → Netlify Analytics

# Pull weekly report
# Query Supabase directly or export Netlify form CSV
```

### Weekly (Every Friday)
```bash
# Export Netlify form data as CSV
# Analyze: Total, Sources, Top referrers, Sports mix
# Update spreadsheet
# Send report email to team
```

### Launch Day (Oct 19)
```bash
# Verify app on TestFlight
# Push "Download" link to top 100 referrers
# Monitor analytics & error logs
# Be ready for support questions
```

---

## **Success Metrics (Week 1-4)**

| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| Signups | 500 | 50 | 160 | 310 | 500 |
| Hosts | 25 | 5 | 11 | 18 | 25 |
| Referral % | 20% | 10% | 15% | 18% | 20%+ |
| Sports mix | 3 | 2 | 2+ | 3 | 3 |
| CPS | <$2 | Free | Free | <$3 | <$2 |

---

## **Troubleshooting**

**Q: Supabase queries timing out?**
A: Check RLS policies - they might be too restrictive. Test with anon key.

**Q: App won't connect to Supabase?**
A: Verify `.env` values exactly. Check Supabase firewall rules (should be open).

**Q: Form not submitting?**
A: Check browser console. Verify netlify attribute on form tag.

**Q: Flyers have low conversion?**
A: Try different parks. Some locations better than others. Track with unique UTMs.

---

**Ready to ship? Start with Part 1 (Supabase setup) — it's the critical path.** ✅

