import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { createGroup } from '@/api/groups';
import type { NewGroup } from '@/api/types';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ChipSelect, MultiChipSelect } from '@/components/ChipSelect';
import { CityPicker } from '@/components/CityPicker';
import { Field } from '@/components/Field';
import { SelectField } from '@/components/SelectField';
import { Stepper } from '@/components/Stepper';
import { TextField } from '@/components/TextField';
import { DEFAULT_CITY, findCity, nearestCity } from '@/constants/cities';
import {
  GENDER_RULES,
  GROUP_FORMATS,
  GROUP_LIMITS,
  GROUP_VISIBILITIES,
  MAX_TAGS,
  MIN_AGES,
  SPORTS,
  TAGS,
  type GenderRule,
  type GroupFormat,
  type GroupVisibility,
  type Sport,
  type Tag,
} from '@/constants/enums';
import { genderRuleLabels, groupFormatLabels, groupVisibilityLabels, sportLabels, tagLabels } from '@/constants/labels';
import { useDeviceLocation } from '@/hooks/useDeviceLocation';
import { errorMessage } from '@/lib/errors';
import { validateGroup, type FormErrors } from '@/lib/validation';
import { colors, spacing, sportColors, type } from '@/theme';

const visibilityHints: Record<GroupVisibility, string> = {
  public: 'Anyone who matches the settings can find and join.',
  request: 'People can find the group and ask to join. You or a co-host approve them.',
  invite: 'Hidden from Discover. People join only with your code.',
};

export default function NewGroupScreen() {
  const location = useDeviceLocation();
  const [name, setName] = useState('');
  const [sport, setSport] = useState<Sport>('soccer');
  const [format, setFormat] = useState<GroupFormat>('in_person');
  const [city, setCity] = useState(DEFAULT_CITY.name);
  const [radiusKm, setRadiusKm] = useState(5);
  const [minAge, setMinAge] = useState<number>(18);
  const [visibility, setVisibility] = useState<GroupVisibility>('public');
  const [genderRule, setGenderRule] = useState<GenderRule>('open');
  const [tags, setTags] = useState<Tag[]>([]);
  const [pickingCity, setPickingCity] = useState(false);
  const [errors, setErrors] = useState<FormErrors<'name' | 'tags'>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cityTouched = useRef(false);
  useEffect(() => {
    if (location.coords && !cityTouched.current) {
      setCity(nearestCity(location.coords.lat, location.coords.lng).name);
    }
  }, [location.coords]);

  // In-person groups are centred on the host's area (rounded by the server), or the
  // city centre when location is off or a different city was chosen.
  const area = () => {
    const chosen = findCity(city);
    const gps = location.coords;
    if (gps && nearestCity(gps.lat, gps.lng).name === chosen.name) return gps;
    return { lat: chosen.lat, lng: chosen.lng };
  };

  const submit = async () => {
    if (submitting) return;
    const center = area();
    const group: NewGroup = {
      name,
      sport,
      format,
      city,
      lat: format === 'in_person' ? center.lat : null,
      lng: format === 'in_person' ? center.lng : null,
      radiusKm,
      minAge,
      visibility,
      genderRule,
      tags,
    };
    const found = validateGroup(group);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const id = await createGroup(group);
      router.replace({ pathname: '/group/[id]', params: { id } });
    } catch (e) {
      setServerError(errorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Group name"
          value={name}
          onChangeText={setName}
          placeholder="West End Sunday Soccer"
          maxLength={60}
          error={errors.name}
        />

        <Field label="Sport">
          <ChipSelect
            options={SPORTS.map((s) => ({ value: s, label: sportLabels[s], color: sportColors[s] }))}
            value={sport}
            onChange={setSport}
          />
        </Field>

        <Field
          label="Format"
          hint={
            format === 'in_person'
              ? 'Shown to players within the radius below.'
              : 'For planning and chat. Shown to players in the same city.'
          }
        >
          <ChipSelect
            options={GROUP_FORMATS.map((f) => ({ value: f, label: groupFormatLabels[f] }))}
            value={format}
            onChange={setFormat}
          />
        </Field>

        <SelectField label="City" value={city} onPress={() => setPickingCity(true)} />

        {format === 'in_person' ? (
          <Field
            label="Visible within"
            hint={
              location.coords
                ? 'The group is placed on the map in your area, rounded to about 1 km. Your exact location is never shared.'
                : `Measured from the centre of ${city}.`
            }
          >
            <Stepper
              label="Radius"
              value={radiusKm}
              onChange={setRadiusKm}
              min={GROUP_LIMITS.radiusMin}
              max={GROUP_LIMITS.radiusMax}
              format={(v) => `${v} km`}
            />
          </Field>
        ) : null}

        <Field label="Minimum age">
          <ChipSelect options={MIN_AGES.map((a) => ({ value: a as number, label: `${a}+` }))} value={minAge} onChange={setMinAge} />
        </Field>

        <Field label="Who can join">
          <ChipSelect
            options={GENDER_RULES.map((g) => ({ value: g, label: genderRuleLabels[g] }))}
            value={genderRule}
            onChange={setGenderRule}
          />
        </Field>

        <Field label="Visibility" hint={visibilityHints[visibility]}>
          <ChipSelect
            options={GROUP_VISIBILITIES.map((v) => ({ value: v, label: groupVisibilityLabels[v] }))}
            value={visibility}
            onChange={setVisibility}
          />
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

        {serverError ? <Banner tone="error" message={serverError} /> : null}
        <Button title="Create group" onPress={submit} loading={submitting} />
        <Text style={type.caption}>
          As host you can approve requests, remove members, and share a join code. Keep the chat in line with the
          Community Guidelines.
        </Text>
      </ScrollView>
      <CityPicker
        visible={pickingCity}
        selected={city}
        onSelect={(c) => {
          cityTouched.current = true;
          setCity(c);
        }}
        onClose={() => setPickingCity(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
  error: { color: colors.danger, fontSize: 13 },
});
