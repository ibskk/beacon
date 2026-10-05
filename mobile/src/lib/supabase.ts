import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL, isBackendConfigured } from './env';

// A syntactically valid placeholder keeps createClient from throwing when env is missing;
// the root layout shows a configuration message instead of making requests.
export const supabase = createClient(
  isBackendConfigured ? SUPABASE_URL : 'https://not-configured.invalid',
  isBackendConfigured ? SUPABASE_ANON_KEY : 'not-configured',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh tokens only while the app is in the foreground (Supabase React Native guidance).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
