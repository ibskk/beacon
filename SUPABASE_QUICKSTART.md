# Beacon: Supabase Setup Quickstart (30 minutes)

**Goal:** Get backend live and connected to app.jsx

---

## Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. **Name:** `beacon-prod`
4. **Password:** Generate strong password (save to 1Password or .env.local)
5. **Region:** `us-east-1` (or `ca-central-1` for Toronto)
6. Click **"Create new project"** (wait ~2 min)

---

## Step 2: Get API Keys (2 min)

Once dashboard loads:

1. Left sidebar → **Settings** → **API**
2. Copy these two values:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Save to `.env` in your Beacon folder:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## Step 3: Enable PostGIS (1 min)

1. Left sidebar → **SQL Editor**
2. Click **"New query"**
3. Paste:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
4. Click **"Run"**

---

## Step 4: Create Database Tables (20 min)

In **SQL Editor**, run each block one by one (copy → paste → click **"Run"**):

### Users Table
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

CREATE POLICY users_self_select ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_self_update ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Games Table
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

CREATE POLICY games_select_public ON games
  FOR SELECT USING (visibility = 'public');

CREATE POLICY games_select_self ON games
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY games_insert ON games
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY games_update ON games
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY games_delete ON games
  FOR DELETE USING (auth.uid() = host_id);

CREATE INDEX idx_games_location ON games USING GIST (location);
CREATE INDEX idx_games_city ON games(city);
```

### Players Table
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

CREATE POLICY players_select ON players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY players_insert ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY players_update ON players
  FOR UPDATE USING (auth.uid() = user_id);
```

### Groups Table
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

CREATE INDEX idx_groups_area ON groups USING GIST (area);
```

### Group Members Table
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

CREATE POLICY group_members_select ON group_members
  FOR SELECT USING (auth.uid() = user_id);
```

### Group Messages Table
```sql
CREATE TABLE group_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_messages_select ON group_messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY group_messages_insert ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );
```

---

## Step 5: Test Connection (2 min)

In SQL Editor, run:
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM games;
```

**Both should return `0` (empty tables).** ✅

---

## You're Done ✅

Backend is live. Now:

1. **Update `.env`** with your Supabase URL and key
2. **Start app:** `npx expo start`
3. **Test on device:** Scan QR → open in Expo Go
4. **Verify:** MapScreen should fetch games (currently shows 0, which is correct)

**Next:** Host signup → create first game → see it on map

---

## Troubleshooting

**Q: SQL queries timing out?**
A: Check RLS policies. Try with Supabase's private key in anon key field temporarily (dev only).

**Q: "relation does not exist"?**
A: Paste schema blocks one at a time, wait for each to finish before next.

**Q: App won't connect?**
A: Verify `.env` has exact URL/key from API settings (no extra spaces).

---

**Time to live backend: ~30 minutes.** Start at https://supabase.com/dashboard
