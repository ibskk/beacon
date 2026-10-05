import { Alert, Share, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

import { Button } from './Button';

type Props = {
  title: string;
  code: string;
  shareMessage: string;
  hint: string;
};

export function CodeShareCard({ title, code, shareMessage, hint }: Props) {
  const share = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      Alert.alert('Could not open share sheet', `Your code is ${code}.`);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={type.label}>{title}</Text>
      <Text style={styles.code} selectable accessibilityLabel={`Code ${code.split('').join(' ')}`}>
        {code}
      </Text>
      <Text style={type.caption}>{hint}</Text>
      <Button title="Share code" icon="share-outline" variant="dark" compact onPress={share} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  code: { fontSize: 28, fontWeight: '700', letterSpacing: 6, color: colors.ink },
});
