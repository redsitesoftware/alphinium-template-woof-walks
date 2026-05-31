import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

const SERVICES_OPTIONS = ['Solo walk', 'Group walk', 'Drop-in visit', 'Puppy visit', 'Training walk'];

const ABN_REGEX = /^\d{11}$/;
const PHONE_REGEX = /^[0-9+\s\-()]{7,15}$/;

function Field({ label, children, error }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function WalkerOnboardingScreen() {
  const { dispatch } = useWoof();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [suburb, setSuburb] = useState('');
  const [abnOrId, setAbnOrId] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [pricePerWalk, setPricePerWalk] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function toggleService(service) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function validate() {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (!PHONE_REGEX.test(phone.trim())) {
      errs.phone = 'Enter a valid phone number.';
    }
    if (!suburb.trim()) errs.suburb = 'Suburb is required.';
    if (!abnOrId.trim()) {
      errs.abnOrId = 'ABN or ID number is required.';
    } else if (ABN_REGEX.test(abnOrId.replace(/\s/g, '')) === false && abnOrId.trim().length < 4) {
      errs.abnOrId = 'Enter a valid ABN (11 digits) or ID number.';
    }
    if (selectedServices.length === 0) errs.services = 'Select at least one service.';
    const price = parseFloat(pricePerWalk);
    if (!pricePerWalk.trim()) {
      errs.pricePerWalk = 'Price per walk is required.';
    } else if (isNaN(price) || price <= 0) {
      errs.pricePerWalk = 'Enter a valid price (e.g. 25).';
    }
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    dispatch({
      type: 'REGISTER_WALKER',
      payload: {
        name: fullName.trim(),
        phone: phone.trim(),
        suburb: suburb.trim(),
        abnOrId: abnOrId.trim(),
        services: selectedServices,
        pricePerWalk: parseFloat(pricePerWalk),
        pricePer30: Math.round(parseFloat(pricePerWalk) * 0.6),
        distance: 0,
        emoji: '🐾',
      },
    });

    dispatch({
      type: 'SEND_CHAT',
      payload: `Welcome aboard, ${fullName.trim()}! Your walker profile has been submitted for verification. We'll review your details and be in touch soon. 🐾`,
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>🐾</Text>
        <Text style={styles.successTitle}>Application Submitted!</Text>
        <Text style={styles.successBody}>
          Thanks, {fullName}! Your walker profile is pending verification. We'll be in touch shortly.
        </Text>
        <Pressable style={styles.doneButton} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
          <Text style={styles.doneButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable style={styles.backRow} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.heading}>Become a Walker 🐾</Text>
      <Text style={styles.subheading}>
        Join WoofWalks and connect with local dog owners. Fill in your details below — verification takes 1–2 business days.
      </Text>

      <Field label="Full Name *" error={errors.fullName}>
        <TextInput
          style={[styles.input, errors.fullName ? styles.inputError : null]}
          value={fullName}
          onChangeText={(t) => { setFullName(t); setErrors((e) => ({ ...e, fullName: null })); }}
          placeholder="e.g. Jessica Park"
          placeholderTextColor={colors.textMuted}
        />
      </Field>

      <Field label="Phone Number *" error={errors.phone}>
        <TextInput
          style={[styles.input, errors.phone ? styles.inputError : null]}
          value={phone}
          onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: null })); }}
          placeholder="e.g. 0412 345 678"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />
      </Field>

      <Field label="Suburb *" error={errors.suburb}>
        <TextInput
          style={[styles.input, errors.suburb ? styles.inputError : null]}
          value={suburb}
          onChangeText={(t) => { setSuburb(t); setErrors((e) => ({ ...e, suburb: null })); }}
          placeholder="e.g. Surry Hills"
          placeholderTextColor={colors.textMuted}
        />
      </Field>

      <Field label="ABN or ID Number *" error={errors.abnOrId}>
        <TextInput
          style={[styles.input, errors.abnOrId ? styles.inputError : null]}
          value={abnOrId}
          onChangeText={(t) => { setAbnOrId(t); setErrors((e) => ({ ...e, abnOrId: null })); }}
          placeholder="11-digit ABN or government ID"
          placeholderTextColor={colors.textMuted}
          keyboardType="default"
        />
      </Field>

      <Field label="Services Offered *" error={errors.services}>
        <View style={styles.servicesGrid}>
          {SERVICES_OPTIONS.map((service) => {
            const active = selectedServices.includes(service);
            return (
              <Pressable
                key={service}
                style={[styles.servicePill, active ? styles.servicePillActive : null]}
                onPress={() => { toggleService(service); setErrors((e) => ({ ...e, services: null })); }}
              >
                <Text style={[styles.servicePillText, active ? styles.servicePillTextActive : null]}>
                  {service}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Price Per Walk (AUD) *" error={errors.pricePerWalk}>
        <TextInput
          style={[styles.input, errors.pricePerWalk ? styles.inputError : null]}
          value={pricePerWalk}
          onChangeText={(t) => { setPricePerWalk(t); setErrors((e) => ({ ...e, pricePerWalk: null })); }}
          placeholder="e.g. 28"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />
      </Field>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Application</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        By submitting, you agree to WoofWalks terms. Your details are used solely for verification purposes.
      </Text>
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
    paddingBottom: 120,
    gap: 20,
  },
  backRow: {
    marginTop: 20,
  },
  backText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  subheading: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 15,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  servicePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servicePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  servicePillText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  servicePillTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
