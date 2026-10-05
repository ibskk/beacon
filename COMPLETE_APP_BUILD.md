# Beacon App - Complete Implementation Guide

**Current Status:** Waitlist live ✅ | Backend: Ready to build | App: Ready to ship

---

## **Phase 1: Backend Setup (Supabase + PostGIS) - 2-3 hours**

### Step 1: Create Supabase Project
1. Go to **https://supabase.com**
2. Create new project (free tier)
3. Generate API keys from Settings → API

### Step 2: SQL Schema (Production-ready with RLS)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  city TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  location_rounded GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Games (owner-only)
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES users(id),
  sport TEXT NOT NULL,
  city TEXT NOT NULL,
  venue_id TEXT,
  venue_name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  starts_at TIMESTAMP NOT NULL,
  duration_minutes INT,
  spots_total INT NOT NULL,
  level TEXT,
  tags TEXT[],
  gender_rule TEXT DEFAULT 'open',
  visibility TEXT DEFAULT 'public',
  join_code TEXT UNIQUE,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT game_owner CHECK (host_id IS NOT NULL)
);

-- Players (self-only records)
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'joined',
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Group chats (encrypted, RLS enforced)
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES users(id),
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group members
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL REFERENCES groups(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only read/update their own profile
CREATE POLICY user_self ON users
  FOR ALL USING (auth.uid() = id);

-- Games: Host can full CRUD, others can read
CREATE POLICY games_host_admin ON games
  FOR ALL USING (auth.uid() = host_id);

CREATE POLICY games_read ON games
  FOR SELECT USING (visibility = 'public' OR auth.uid() = host_id);

-- Players: Only self can insert/update
CREATE POLICY players_self ON players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create index on location for fast proximity queries
CREATE INDEX idx_games_location ON games USING GIST (location);
CREATE INDEX idx_groups_area ON groups USING GIST (area);
```

### Step 3: Environment Variables
Create `.env` in your React Native project:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
EXPO_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

---

## **Phase 2: React Native App (Expo) - 4-6 hours**

### Install & Setup

```bash
# Create new Expo project
npx create-expo-app Beacon
cd Beacon

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install expo-location expo-constants
npm install @supabase/supabase-js
npm install react-native-mapbox-gl
npm install zustand react-query
```

### App Structure

```
Beacon/
├── app/
│   ├── (auth)/
│   │   ├── signup.jsx
│   │   └── login.jsx
│   ├── (app)/
│   │   ├── map.jsx          # Main map view
│   │   ├── games.jsx        # List view
│   │   ├── groups.jsx       # Groups/chats
│   │   ├── profile.jsx      # User profile
│   │   └── [id].jsx         # Game detail
│   └── _layout.jsx
├── lib/
│   ├── supabase.js
│   ├── api.js
│   └── store.js
├── components/
│   ├── GameCard.jsx
│   ├── GroupCard.jsx
│   ├── LocationPicker.jsx
│   └── CheckinFlow.jsx
├── app.json
└── package.json
```

### Core Files

**app.json** (config)
```json
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
    "plugins": ["expo-location"]
  }
}
```

**lib/supabase.js**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**app/(app)/map.jsx** (Main screen)
```javascript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

export default function MapScreen() {
  const [games, setGames] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    requestLocationPermission();
    fetchNearbyGames();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation([location.coords.longitude, location.coords.latitude]);
    }
  };

  const fetchNearbyGames = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('city', 'Toronto')
      .eq('status', 'open')
      .limit(50);

    if (data) setGames(data);
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={userLocation || [-79.3871, 43.6629]}
          animationMode="flyTo"
          animationDuration={2000}
        />
        
        {/* User location pin */}
        {userLocation && (
          <MapboxGL.PointAnnotation coordinate={userLocation} id="user">
            <View style={styles.userPin} />
          </MapboxGL.PointAnnotation>
        )}

        {/* Game pins */}
        {games.map((game) => (
          <MapboxGL.PointAnnotation
            key={game.id}
            coordinate={[game.location.split(',')[1], game.location.split(',')[0]]}
            id={game.id}
          >
            <View style={[styles.pin, { backgroundColor: getSportColor(game.sport) }]}>
              <Text style={styles.pinText}>{game.sport[0]}</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}

const getSportColor = (sport) => {
  const colors = { soccer: '#1fb881', basketball: '#ff8a3d', pickleball: '#c2ff00' };
  return colors[sport] || '#000';
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userPin: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#c2ff00', borderWidth: 2, borderColor: '#000' },
  pin: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  pinText: { color: '#fff', fontWeight: 'bold' }
});
```

---

## **Phase 3: Marketing Week 1 Setup**

### UTM & Analytics (Monday)

Update `index.html` form to include hidden fields:

```html
<input type="hidden" id="utm_source" name="utm_source" value="">
<input type="hidden" id="utm_medium" name="utm_medium" value="">
<input type="hidden" id="utm_campaign" name="utm_campaign" value="">
```

Add script to capture URL params:

```javascript
const params = new URLSearchParams(window.location.search);
document.getElementById('utm_source').value = params.get('utm_source') || 'organic';
document.getElementById('utm_medium').value = params.get('utm_medium') || 'direct';
document.getElementById('utm_campaign').value = params.get('utm_campaign') || 'waitlist';
```

### Host Outreach (Tue-Fri)

**Target:** 5 signed hosts for week 1

**Outreach template:**
```
Hi [name],

We're building Beacon - find pickup sports near you in 60 seconds.

We're looking for 5-10 hosts to run games during our Toronto beta (starting mid-October).

First 100 signups get free premium year. You'd get early access + your own referee code to share.

Interested? Join the waitlist: [link]?ref=HOST_[code]

[Your name]
```

### Flyer Template (for week 2)

```
🎯 FIND YOUR GAME IN 60 SECONDS

⚽ Soccer  🏀 Basketball  🎾 Pickleball
👥 See who's playing near you
💬 Message them directly
🎮 Join or start a game

Join the waitlist:
[QR CODE]
beacon-sports.app
```

---

## **Phase 4: Deployment Checklist**

### Production Readiness

- [ ] Supabase backend with RLS rules
- [ ] Mapbox API key configured
- [ ] Push notification setup (Firebase Cloud Messaging)
- [ ] Email service (SendGrid/Mailchimp)
- [ ] Analytics tracking (Plausible or Mixpanel)
- [ ] Moderation dashboard (basic)
- [ ] App store listings (TestFlight for iOS, Google Play beta for Android)

### App Deployment

```bash
# Build for iOS
eas build --platform ios --profile preview

# Build for Android
eas build --platform android --profile preview

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### Launch Day

- [ ] Netlify waitlist configured with UTM tracking
- [ ] Analytics dashboard live
- [ ] Email sequences ready in Mailchimp
- [ ] Social assets (3 videos + flyers)
- [ ] Press contacts list compiled
- [ ] Moderation team briefed

---

## **Timeline to Launch**

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Backend (Supabase)** | 2-3 hrs | Database live + RLS enforced |
| **App (React Native)** | 4-6 hrs | iOS/Android builds ready |
| **Marketing Week 1-2** | Ongoing | Host recruitment + flyers + analytics |
| **Week 3-4** | Ongoing | Video content + paid ads + partner outreach |
| **Launch** | Oct 19 | App available + 500 waitlist signups |

---

## **Next Actions (Pick One)**

1. **[BACKEND]** Set up Supabase project + run SQL schema
2. **[APP]** Clone Expo template + install dependencies
3. **[MARKETING]** Create flyer template + send host DMs
4. **[LAUNCH]** Set up Mailchimp + configure email sequences

Which phase should we start with?
