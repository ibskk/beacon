import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

import { colors } from '@/theme';

export async function openInAppBrowser(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      controlsColor: colors.ink,
      toolbarColor: colors.card,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch {
    Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
  }
}

/** Opens turn-by-turn directions in Apple Maps on iOS and Google Maps elsewhere. */
export async function openDirections(lat: number, lng: number, label: string): Promise<void> {
  const name = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${lat},${lng}&q=${name}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open maps', 'No maps app is available on this device.');
  }
}
