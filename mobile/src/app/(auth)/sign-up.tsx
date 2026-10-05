import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { Field } from '@/components/Field';
import { InlineLink } from '@/components/LegalLinks';
import { TextField } from '@/components/TextField';
import { GENDERS, MIN_SIGNUP_AGE, TERMS_VERSION, type Gender } from '@/constants/enums';
import { genderLabels } from '@/constants/labels';
import { legal } from '@/lib/env';
import { signUpErrorMessage } from '@/lib/errors';
import { ageOn, formatLongDate, toIsoDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, type } from '@/theme';

type Errors = Partial<Record<'displayName' | 'email' | 'password' | 'birthDate' | 'terms', string>>;

const MIN_PASSWORD = 8;

function validate(input: {
  displayName: string;
  email: string;
  password: string;
  birthDate: Date | null;
  agreed: boolean;
}): Errors {
  const errors: Errors = {};
  const name = input.displayName.trim();
  if (name.length < 2) errors.displayName = 'Enter a display name of at least 2 characters.';
  else if (name.length > 40) errors.displayName = 'Display name must be 40 characters or fewer.';
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.';
  if (input.password.length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters.`;
  if (!input.birthDate) errors.birthDate = 'Enter your date of birth.';
  else if (ageOn(input.birthDate) < MIN_SIGNUP_AGE) errors.birthDate = 'You must be 18 or older to use Beacon.';
  if (!input.agreed) errors.terms = 'You need to agree to the Terms and Community Guidelines to continue.';
  return errors;
}

export default function SignUpScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const today = useMemo(() => new Date(), []);
  const pickerStart = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  }, []);
  const oldest = useMemo(() => new Date(1900, 0, 1), []);

  const submit = async () => {
    if (submitting) return;
    const found = validate({ displayName, email, password, birthDate, agreed });
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0 || !birthDate) return;

    setSubmitting(true);
    const trimmedEmail = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          birth_date: toIsoDate(birthDate),
          ...(gender ? { gender } : {}),
          terms_version: TERMS_VERSION,
        },
      },
    });
    setSubmitting(false);

    if (error) {
      setServerError(signUpErrorMessage(error));
      return;
    }
    // With email confirmation off a session arrives immediately and the root layout
    // navigates into the app; otherwise ask the user to confirm first.
    if (!data.session) setSentTo(trimmedEmail);
  };

  if (sentTo) {
    return (
      <View style={styles.sent}>
        <View style={styles.sentIcon}>
          <Ionicons name="mail-unread-outline" size={30} color={colors.ink} />
        </View>
        <Text style={[type.title, styles.center]} accessibilityRole="header">
          Check your email to confirm, then sign in
        </Text>
        <Text style={[type.callout, styles.center]}>
          We sent a confirmation link to {sentTo}. Open it on this device, then come back and sign in.
        </Text>
        <Button title="Go to sign in" onPress={() => router.replace('/sign-in')} style={styles.stretch} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {serverError ? <Banner tone="error" message={serverError} /> : null}

        <TextField
          label="Display name"
          hint="Shown to other players in games and groups."
          value={displayName}
          onChangeText={setDisplayName}
          error={errors.displayName}
          autoComplete="name"
          textContentType="nickname"
          maxLength={40}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextField
          ref={emailRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          hint={`At least ${MIN_PASSWORD} characters.`}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <DateTimeField
          label="Date of birth"
          mode="date"
          value={birthDate}
          onChange={(d) => {
            setBirthDate(d);
            setErrors((e) => ({ ...e, birthDate: undefined }));
          }}
          placeholder="Select your date of birth"
          format={formatLongDate}
          minimumDate={oldest}
          maximumDate={today}
          initialDate={pickerStart}
          error={errors.birthDate}
        />
        <Text style={[type.caption, styles.note]}>
          You must be 18 or older. Your date of birth is private and only used to confirm your age and match age
          limits on groups.
        </Text>

        <Field label="Gender (optional)" hint="Private. Only used for women and non-binary games and groups.">
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <Chip
                key={g}
                label={genderLabels[g]}
                selected={gender === g}
                onPress={() => setGender((cur) => (cur === g ? null : g))}
              />
            ))}
          </View>
        </Field>

        <View style={styles.terms}>
          <Checkbox
            checked={agreed}
            onChange={(v) => {
              setAgreed(v);
              if (v) setErrors((e) => ({ ...e, terms: undefined }));
            }}
            accessibilityLabel="I agree to the Terms of Service and Community Guidelines. There is zero tolerance for objectionable content or abusive users."
          >
            <Text style={styles.termsText}>
              I agree to the <InlineLink label="Terms of Service" url={legal.terms} /> and{' '}
              <InlineLink label="Community Guidelines" url={legal.guidelines} />. There is zero tolerance for
              objectionable content or abusive users.
            </Text>
          </Checkbox>
          {errors.terms ? <Text style={styles.error}>{errors.terms}</Text> : null}
          <Text style={[type.caption, styles.privacy]}>
            Read how we handle your data in our <InlineLink label="Privacy Policy" url={legal.privacy} />.
          </Text>
        </View>

        <Button title="Create account" onPress={submit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },
  note: { marginTop: -spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  terms: {
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  termsText: { fontSize: 15, lineHeight: 21, color: colors.ink2 },
  error: { color: colors.danger, fontSize: 13 },
  privacy: { marginTop: spacing.xs },
  sent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  sentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: spacing.md },
});
