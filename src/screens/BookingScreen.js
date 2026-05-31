import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getWalkerPhoto, WOOF_IMAGES } from '../media';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

const sizes = ['Small', 'Medium', 'Large', 'XL'];
const services = ['Solo walk', 'Group walk', 'Drop-in'];
const recurringOptions = [
 { label: 'One-off', value: false },
 { label: 'Weekly', value: 'weekly' },
 { label: 'Daily', value: 'daily' },
];

function PillSelector({ options, value, onChange }) {
 return (
 <View style={styles.pillsWrap}>
 {options.map((option) => {
 const selected = option === value || option.value === value;
 const label = typeof option === 'string' ? option : option.label;
 const nextValue = typeof option === 'string' ? option : option.value;
 return (
 <Pressable
 key={label}
 style={[styles.pill, selected ? styles.pillActive : null]}
 onPress={() => onChange(nextValue)}
 >
 <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{label}</Text>
 </Pressable>
 );
 })}
 </View>
 );
}

function Field({ label, value, onChangeText, placeholder }) {
 return (
 <View style={styles.fieldBlock}>
 <Text style={styles.fieldLabel}>{label}</Text>
 <TextInput
 value={value}
 onChangeText={onChangeText}
 placeholder={placeholder}
 placeholderTextColor={colors.textMuted}
 style={styles.input}
 />
 </View>
 );
}

export default function BookingScreen() {
 const { state, dispatch } = useWoof();
 const walker = state.selectedWalker;
 const { bookingData, bookingStep } = state;

 if (!walker) {
 return null;
 }

 return (
 <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <Pressable onPress={() => dispatch({ type: 'SET_PHASE', payload: 'walker' })}>
 <Text style={styles.back}>← Back</Text>
 </Pressable>

 <View style={styles.headerCard}>
 <Image source={{ uri: WOOF_IMAGES.bookingDog }} style={styles.headerImage} />
 <View style={styles.headerBody}>
 <Image source={{ uri: getWalkerPhoto(walker.id) }} style={styles.walkerThumb} />
 <Text style={styles.eyebrow}>Booking with {walker.name}</Text>
 <Text style={styles.title}>Plan Buddy's next walk</Text>
 <Text style={styles.subtitle}>Step {bookingStep + 1} of 3</Text>
 </View>
 </View>

 {bookingStep === 0 ? (
 <View style={styles.section}>
 <Field label="Dog name" value={bookingData.dogName} onChangeText={(dogName) => dispatch({ type: 'SET_BOOKING_DATA', payload: { dogName } })} placeholder="Buddy" />
 <Field label="Breed" value={bookingData.breed} onChangeText={(breed) => dispatch({ type: 'SET_BOOKING_DATA', payload: { breed } })} placeholder="Cavoodle" />

 <Text style={styles.fieldLabel}>Size</Text>
 <PillSelector options={sizes} value={bookingData.size} onChange={(size) => dispatch({ type: 'SET_BOOKING_DATA', payload: { size } })} />

 <Text style={styles.fieldLabel}>Service type</Text>
 <PillSelector options={services} value={bookingData.serviceType} onChange={(serviceType) => dispatch({ type: 'SET_BOOKING_DATA', payload: { serviceType } })} />

 <Field label="Date" value={bookingData.date} onChangeText={(date) => dispatch({ type: 'SET_BOOKING_DATA', payload: { date } })} placeholder="Today" />
 <Field label="Time" value={bookingData.time} onChangeText={(time) => dispatch({ type: 'SET_BOOKING_DATA', payload: { time } })} placeholder="7:00 AM" />

 <Text style={styles.fieldLabel}>Recurring?</Text>
 <PillSelector options={recurringOptions} value={bookingData.recurring} onChange={(recurring) => dispatch({ type: 'SET_BOOKING_DATA', payload: { recurring } })} />

 <View style={styles.fieldBlock}>
 <Text style={styles.fieldLabel}>Notes</Text>
 <TextInput
 value={bookingData.notes}
 onChangeText={(notes) => dispatch({ type: 'SET_BOOKING_DATA', payload: { notes } })}
 placeholder="Anything your walker should know?"
 placeholderTextColor={colors.textMuted}
 style={[styles.input, styles.notesInput]}
 multiline
 />
 </View>

 <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'NEXT_BOOKING_STEP' })}>
 <Text style={styles.primaryButtonText}>Confirm Booking</Text>
 </Pressable>
 </View>
 ) : null}

 {bookingStep === 1 ? (
 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Booking summary</Text>
 <View style={styles.summaryCard}>
 <Text style={styles.summaryLine}> {bookingData.dogName} · {bookingData.breed} · {bookingData.size}</Text>
 <Text style={styles.summaryLine}> {bookingData.serviceType} with {walker.name}</Text>
 <Text style={styles.summaryLine}> {bookingData.date} at {bookingData.time}</Text>
 <Text style={styles.summaryLine}> {bookingData.recurring === false ? 'One-off walk' : `${bookingData.recurring} recurring`}</Text>
 <Text style={styles.summaryLine}> {bookingData.notes}</Text>
 <Text style={styles.priceTotal}>Total: ${bookingData.serviceType === 'Drop-in' ? walker.pricePer30 : walker.pricePerWalk}</Text>
 </View>

 <View style={styles.alphiniumCallout}>
 <Text style={styles.alphiniumTitle}>alphinium-booking</Text>
 <Text style={styles.alphiniumText}>Seamless checkout, saved cards, tipping, and invoicing for every walk.</Text>
 </View>

 <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'NEXT_BOOKING_STEP' })}>
 <Text style={styles.primaryButtonText}>Pay & Book</Text>
 </Pressable>
 </View>
 ) : null}

 {bookingStep === 2 ? (
 <View style={styles.section}>
 <Text style={styles.sectionTitle}> Walk booked!</Text>
 <Text style={styles.confirmText}>{bookingData.dogName} is booked with {walker.name} for {bookingData.date} at {bookingData.time}.</Text>
 <View style={styles.successCard}>
 <Text style={styles.successLine}> Walker confirmed instantly</Text>
 <Text style={styles.successLine}> Payment ready via alphinium-payments</Text>
 <Text style={styles.successLine}> Walk updates ready via alphinium-push</Text>
 </View>
 <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'START_TRACKING' })}>
 <Text style={styles.primaryButtonText}>Open Live Walk Demo</Text>
 </Pressable>
 <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
 <Text style={styles.secondaryButtonText}>Back to home</Text>
 </Pressable>
 </View>
 ) : null}
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
 paddingTop: 32,
 paddingBottom: 120,
 gap: 18,
 },
 back: {
 color: colors.primary,
 fontWeight: '800',
 },
 headerCard: {
 backgroundColor: colors.card,
 borderRadius: 26,
 overflow: 'hidden',
 borderWidth: 1,
 borderColor: colors.border,
 },
 headerImage: {
 width: '100%',
 height: 190,
 },
 headerBody: {
 backgroundColor: '#DCFCE7',
 padding: 20,
 gap: 6,
 },
 walkerThumb: {
 width: 56,
 height: 56,
 borderRadius: 999,
 marginBottom: 8,
 },
 eyebrow: {
 color: colors.primary,
 fontWeight: '800',
 },
 title: {
 fontSize: 28,
 fontWeight: '900',
 color: colors.text,
 },
 subtitle: {
 color: colors.textMuted,
 fontWeight: '700',
 },
 section: {
 backgroundColor: colors.card,
 borderRadius: 24,
 padding: 18,
 borderWidth: 1,
 borderColor: colors.border,
 gap: 14,
 },
 sectionTitle: {
 fontSize: 20,
 fontWeight: '900',
 color: colors.text,
 },
 fieldBlock: {
 gap: 8,
 },
 fieldLabel: {
 color: colors.text,
 fontWeight: '800',
 },
 input: {
 borderWidth: 1,
 borderColor: colors.border,
 borderRadius: 16,
 paddingHorizontal: 14,
 paddingVertical: 12,
 color: colors.text,
 },
 notesInput: {
 minHeight: 96,
 textAlignVertical: 'top',
 },
 pillsWrap: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 8,
 },
 pill: {
 borderRadius: 999,
 backgroundColor: '#ECFDF5',
 paddingHorizontal: 12,
 paddingVertical: 9,
 },
 pillActive: {
 backgroundColor: colors.primary,
 },
 pillText: {
 color: colors.text,
 fontWeight: '700',
 },
 pillTextActive: {
 color: '#FFFFFF',
 },
 primaryButton: {
 backgroundColor: colors.primary,
 borderRadius: 16,
 paddingVertical: 15,
 alignItems: 'center',
 marginTop: 6,
 },
 primaryButtonText: {
 color: '#FFFFFF',
 fontWeight: '900',
 fontSize: 16,
 },
 secondaryButton: {
 borderRadius: 16,
 paddingVertical: 15,
 alignItems: 'center',
 borderWidth: 1,
 borderColor: colors.border,
 },
 secondaryButtonText: {
 color: colors.text,
 fontWeight: '800',
 },
 summaryCard: {
 backgroundColor: '#F8FAFC',
 borderRadius: 18,
 padding: 16,
 gap: 10,
 },
 summaryLine: {
 color: colors.text,
 lineHeight: 20,
 },
 priceTotal: {
 color: colors.primary,
 fontWeight: '900',
 fontSize: 20,
 marginTop: 4,
 },
 alphiniumCallout: {
 backgroundColor: '#FEF3C7',
 borderRadius: 18,
 padding: 14,
 gap: 6,
 },
 alphiniumTitle: {
 color: '#92400E',
 fontWeight: '900',
 },
 alphiniumText: {
 color: '#92400E',
 lineHeight: 20,
 },
 confirmText: {
 color: colors.textMuted,
 lineHeight: 22,
 },
 successCard: {
 backgroundColor: '#DCFCE7',
 borderRadius: 18,
 padding: 16,
 gap: 8,
 },
 successLine: {
 color: colors.text,
 fontWeight: '700',
 },
});
