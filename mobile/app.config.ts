import type { ConfigContext, ExpoConfig } from 'expo/config';

// Change the store identifier here only; iOS and Android both read it.
const BUNDLE_ID = 'com.beaconpickup.app';

const LOCATION_USAGE =
  'Beacon uses your location while the app is open to show games and groups near you, check you in at the venue, and place a game or group where you choose. Your live location is never shown to other players.';

const LEGAL_BASE = 'https://openfieldwaitlist.netlify.app';

const BRAND_LIME = '#B5F000';

const googleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

// A store build without the backend keys opens on a setup notice, which App Review rejects.
// Fail the build on the EAS worker instead (EAS_BUILD is only set there).
if (process.env.EAS_BUILD === 'true' && process.env.EAS_BUILD_PROFILE === 'production') {
  const missing = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'].filter(
    (name) => !process.env[name]?.trim() || process.env[name]?.includes('your-'),
  );
  if (missing.length > 0) {
    throw new Error(
      `Production build is missing ${missing.join(' and ')}. Add them with "eas env:create --environment production".`,
    );
  }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Beacon',
  slug: 'beacon',
  scheme: 'beacon',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
      // Live location is only sent with a query and never stored, but venue pins and group
      // areas a user places are stored with their account and shown publicly, so both
      // location types are declared.
      NSPrivacyCollectedDataTypes: [
        collected('NSPrivacyCollectedDataTypePreciseLocation'),
        collected('NSPrivacyCollectedDataTypeCoarseLocation'),
        collected('NSPrivacyCollectedDataTypeEmailAddress'),
        collected('NSPrivacyCollectedDataTypeName'),
        collected('NSPrivacyCollectedDataTypeUserID'),
        // Messages and reports written by the user.
        collected('NSPrivacyCollectedDataTypeOtherUserContent'),
        // Date of birth (age check) and optional gender (group gender rules).
        collected('NSPrivacyCollectedDataTypeOtherDataTypes'),
      ],
    },
  },
  android: {
    package: BUNDLE_ID,
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-icon-background.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: BRAND_LIME,
    },
    permissions: ['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'],
    // The template manifest and some libraries add extra permissions; strip everything
    // the app does not use so the Play listing only shows location (plus INTERNET).
    blockedPermissions: [
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
    ],
    ...(googleMapsApiKey ? { config: { googleMaps: { apiKey: googleMapsApiKey } } } : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_USAGE,
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        motionUsagePermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: BRAND_LIME,
      },
    ],
    '@react-native-community/datetimepicker',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    legal: {
      privacy: `${LEGAL_BASE}/privacy/`,
      terms: `${LEGAL_BASE}/terms/`,
      guidelines: `${LEGAL_BASE}/guidelines/`,
      support: `${LEGAL_BASE}/support/`,
      deleteAccount: `${LEGAL_BASE}/delete-account/`,
    },
  },
});

function collected(type: string) {
  return {
    NSPrivacyCollectedDataType: type,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
  };
}
