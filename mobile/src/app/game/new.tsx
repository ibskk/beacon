import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { createGame } from '@/api/games';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ChipSelect, MultiChipSelect } from '@/components/ChipSelect';
import { CityPicker } from '@/components/CityPicker';
import { DateTimeField } from '@/components/DateTimeField';
import { Field } from '@/components/Field';
import { LocationPicker } from '@/components/LocationPicker';
import { SelectField } from '@/components/SelectField';
import { Stepper } from '@/components/Stepper';
import { TextField } from '@/components/TextField';
import { DEFAULT_CITY, findCity, nearestCity } from '@/constants/cities';
import {
  GAME_LIMITS,
  GAME_VISIBILITIES,
  GENDER_RULES,
  LEVELS,
  MAX_TAGS,
  SPORTS,
  TAGS,
  type GameVisibility,
  type GenderRule,
  type Level,
  type Sport,
  type Tag,
} from '@/constants/enums';
import { gameVisibilityLabels, genderRuleLabels, levelLabels, sportLabels, tagLabels } from '@/constants/labels';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { errorMessage } from '@/lib/errors';
import { formatDuration, formatGameTime } from '@/lib/format';
import type { Coords } from '@/lib/location';
import { validateGame, type FormErrors } from '@/lib/validation';
import { colors, spacing, sportColors, type } from '@/theme';

const DURATIONS = [30, 45, 60, 90, 120, 180, 240] as const;

function defaultStart(): Date {
  const d = new Date(Date.now() + 2 * 60 * 60_000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d;
}

export default function NewGameScreen() {
  const location = useDeviceLocation();

  const [sport, setSport] = useState<Sport>('soccer');
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState(DEFAULT_CITY.name);
  const [pin, setPin] = useState<Coords>({ lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng });
  const [centerKey, setCenterKey] = useState('initial');
  const [startsAt, setStartsAt] = useState<Date | null>(defaultStart);
  const [duration, setDuration] = useState<number>(90);
  const [spots, setSpots] = useState(10);
  const [level, setLevel] = useState<Level>('any');
  const [tags, setTags] = useState<Tag[]>([]);
  const [genderRule, setGenderRule] = useState<GenderRule>('open');
  const [visibility, setVisibility] = useState<GameVisibility>('public');
  const [pickingCity, setPickingCity] = useState(false);
  const [errors, setErrors] = useState<FormErrors<'venueName' | 'startsAt' | 'tags'>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The pin starts at the city centre. It moves to the user's position only when they tap
  // "Use current location", because the venue pin is stored and shown publicly.

  const maxDate = useMemo(() => new Date(Date.now() + GAME_LIMITS.maxDaysAhead * 24 * 60 * 60_000), []);
  const minDate = useMemo(() => new Date(), []);

  const useCurrent = async () => {
    const coords = location.permission === 'granted' ? await location.refresh() : await location.request();
    if (coords) {
      setPin(coords);
      setCity(nearestCity(coords.lat, coords.lng).name);
      setCenterKey(`gps-${Date.now()}`);
    }
  };

  const chooseCity = (name: string) => {
    const c = findCity(name);
    setCity(c.name);
    setPin({ lat: c.lat, lng: c.lng });
    setCenterKey(`city-${c.name}`);
  };

  const submit = async () => {
    if (submitting) return;
    const draft = {
      sport,
      venueName,
      lat: pin.lat,
      lng: pin.lng,
      startsAt,
      durationMin: duration,
      spotsTotal: spots,
      level,
      tags,
      genderRule,
      visibility,
      city,
    };
    const found = validateGame(draft);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0 || !startsAt) return;

    setSubmitting(true);
    try {
      const id = await createGame({ ...draft, startsAt });
      router.replace({ pathname: '/game/[id]', params: { id } });
    } catch (e) {
      setServerError(errorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Sport">
          <ChipSelect
            options={SPORTS.map((s) => ({ value: s, label: sportLabels[s], color: sportColors[s] }))}
            value={sport}
            onChange={setSport}
          />
        </Field>

        <TextField
          label="Venue name"
          value={venueName}
          onChangeText={setVenueName}
          placeholder="Christie Pits, north field"
          maxLength={80}
          error={errors.venueName}
        />

        <SelectField label="City" value={city} onPress={() => setPickingCity(true)} />

        <Field label="Meeting point" hint="This pin is shown to players on the map. Place it at the venue.">
          <LocationPicker
            value={pin}
            onChange={setPin}
            centerKey={centerKey}
            pinColor={sportColors[sport]}
            onUseCurrent={location.permission === 'denied' && !location.canAskAgain ? undefined : useCurrent}
            locating={location.locating}
          />
        </Field>

        <DateTimeField
          label="Starts"
          mode="datetime"
          value={startsAt}
          onChange={setStartsAt}
          placeholder="Choose a date and time"
          format={(d) => formatGameTime(d.toISOString())}
          minimumDate={minDate}
          maximumDate={maxDate}
          initialDate={defaultStart()}
          error={errors.startsAt}
        />

        <Field label={`Duration: ${formatDuration(duration)}`}>
          <ChipSelect options={DURATIONS.map((d) => ({ value: d, label: formatDuration(d) }))} value={duration} onChange={setDuration} />
        </Field>

        <Field label="Players needed, including you">
          <Stepper
            label="Players"
            value={spots}
            onChange={setSpots}
            min={GAME_LIMITS.spotsMin}
            max={GAME_LIMITS.spotsMax}
            format={(v) => `${v} players`}
          />
        </Field>

        <Field label="Level">
          <ChipSelect options={LEVELS.map((l) => ({ value: l, label: levelLabels[l] }))} value={level} onChange={setLevel} />
        </Field>

        <Field label={`Tags (up to ${MAX_TAGS})`}>
          <MultiChipSelect
            options={TAGS.map((t) => ({ value: t, label: tagLabels[t] }))}
            values={tags}
            onChange={setTags}
            max={MAX_TAGS}
          />
          {errors.tags ? <Text style={styles.error}>{errors.tags}</Text> : null}
        </Field>

        <Field label="Who can join">
          <ChipSelect
            options={GENDER_RULES.map((g) => ({ value: g, label: genderRuleLabels[g] }))}
            value={genderRule}
            onChange={setGenderRule}
          />
        </Field>

        <Field
          label="Visibility"
          hint={
            visibility === 'public'
              ? 'Anyone nearby can find and join this game.'
              : 'Hidden from Explore. Share the join code with your players.'
          }
        >
          <ChipSelect
            options={GAME_VISIBILITIES.map((v) => ({ value: v, label: gameVisibilityLabels[v] }))}
            value={visibility}
            onChange={setVisibility}
          />
        </Field>

        {serverError ? <Banner tone="error" message={serverError} /> : null}
        <Button title="Post game" onPress={submit} loading={submitting} />
        <Text style={type.caption}>
          By hosting you agree to keep the game safe and welcoming, as set out in the Community Guidelines.
        </Text>
      </ScrollView>
      <CityPicker visible={pickingCity} selected={city} onSelect={chooseCity} onClose={() => setPickingCity(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
  error: { color: colors.danger, fontSize: 13 },
});
