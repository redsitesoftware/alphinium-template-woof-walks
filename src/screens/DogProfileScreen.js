import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

const TEMPERAMENT_OPTIONS = ['Calm', 'Energetic', 'Anxious'];

function PillSelector({ options, value, onChange }) {
  return (
    <View style={styles.pillsWrap}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            style={[styles.pill, selected ? styles.pillActive : null]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoComplete="off"
      />
    </View>
  );
}

export default function DogProfileScreen({ onSaved, onBack }) {
  const { addDog, dispatch } = useWoof();

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [temperament, setTemperament] = useState('Calm');
  const [onLeashOnly, setOnLeashOnly] = useState(false);
  const [vaccinationExpiry, setVaccinationExpiry] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handlePickPhoto() {
    // expo-image-picker is not yet installed — show a friendly notice
    Alert.alert(
      'Photo upload',
      'Photo upload requires expo-image-picker. Add it to package.json to enable.',
    );
  }

  async function handleSave() {
    if (!name.trim() || !breed.trim()) {
      setError('Dog name and breed are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addDog({
        name: name.trim(),
        breed: breed.trim(),
        age: age ? Number(age) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        temperament: temperament.toLowerCase(),
        on_leash_only: onLeashOnly,
        vaccination_expiry: vaccinationExpiry.trim() || null,
        vet_name: vetName.trim() || null,
        vet_phone: vetPhone.trim() || null,
        emergency_contact: emergencyContact.trim() || null,
        allergies: allergies.trim() || null,
        photo: null,
      });
      if (onSaved) {
        onSaved();
      } else {
        dispatch({ type: 'SET_PHASE', payload: 'home' });
      }
    } catch (err) {
      setError(err.message || 'Failed to save dog profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Add Dog Profile</Text>
        <Text style={styles.subtitle}>Tell your walker about your pup</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic info</Text>

        <Field label="Dog name *" value={name} onChangeText={setName} placeholder="Buddy" />
        <Field label="Breed *" value={breed} onChangeText={setBreed} placeholder="Cavoodle" />
        <Field label="Age (years)" value={age} onChangeText={setAge} placeholder="2" keyboardType="numeric" maxLength={3} />
        <Field label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} placeholder="8.5" keyboardType="decimal-pad" maxLength={5} />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Temperament</Text>
          <PillSelector options={TEMPERAMENT_OPTIONS} value={temperament} onChange={setTemperament} />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.fieldLabel}>On-leash only</Text>
          <Switch
            value={onLeashOnly}
            onValueChange={setOnLeashOnly}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health & safety</Text>

        <Field
          label="Vaccination expiry"
          value={vaccinationExpiry}
          onChangeText={setVaccinationExpiry}
          placeholder="DD/MM/YYYY"
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        />
        <Field label="Vet name" value={vetName} onChangeText={setVetName} placeholder="Dr Smith" />
        <Field label="Vet phone" value={vetPhone} onChangeText={setVetPhone} placeholder="0412 345 678" keyboardType="phone-pad" />
        <Field label="Emergency contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Name — 0400 123 456" />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Allergies / special notes</Text>
          <TextInput
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g. chicken allergy, no grains"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.notesInput]}
            multiline
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo</Text>
        <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
          <Text style={styles.photoButtonText}>📷  Add photo</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Dog Profile'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 0,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  photoButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  photoButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
