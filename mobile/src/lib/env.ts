import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isBackendConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

type LegalLinks = {
  privacy: string;
  terms: string;
  guidelines: string;
  support: string;
  deleteAccount: string;
};

const FALLBACK_BASE = 'https://openfieldwaitlist.netlify.app';

export const legal: LegalLinks = {
  privacy: `${FALLBACK_BASE}/privacy/`,
  terms: `${FALLBACK_BASE}/terms/`,
  guidelines: `${FALLBACK_BASE}/guidelines/`,
  support: `${FALLBACK_BASE}/support/`,
  deleteAccount: `${FALLBACK_BASE}/delete-account/`,
  ...((Constants.expoConfig?.extra?.legal as Partial<LegalLinks> | undefined) ?? {}),
};

export const appVersion = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Google Maps on Android needs an API key baked into the native build. Without one the
 * map renders blank, so Explore falls back to the list view.
 */
export const isMapAvailable =
  Platform.OS !== 'android' || Boolean(Constants.expoConfig?.android?.config?.googleMaps?.apiKey);
