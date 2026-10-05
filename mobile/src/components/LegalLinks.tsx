import { StyleSheet, Text } from 'react-native';

import { legal } from '@/lib/env';
import { openInAppBrowser } from '@/lib/links';
import { colors } from '@/theme';

/** Inline tappable link for use inside a Text block. */
export function InlineLink({ label, url }: { label: string; url: string }) {
  return (
    <Text
      style={styles.link}
      onPress={() => openInAppBrowser(url)}
      accessibilityRole="link"
      accessibilityHint="Opens in your browser"
      suppressHighlighting={false}
    >
      {label}
    </Text>
  );
}

export function LegalFooter() {
  return (
    <Text style={styles.footer}>
      <InlineLink label="Terms of Service" url={legal.terms} />
      {'   '}
      <InlineLink label="Privacy Policy" url={legal.privacy} />
      {'   '}
      <InlineLink label="Community Guidelines" url={legal.guidelines} />
    </Text>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.ink, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { textAlign: 'center', fontSize: 13, lineHeight: 22, color: colors.ink3 },
});
