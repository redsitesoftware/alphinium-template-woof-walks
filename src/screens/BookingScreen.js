import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getWalkerPhoto, WOOF_IMAGES } from '../media';
import { checkout, getSavedCards, refund, submitTip, tokeniseCard } from '../services/payments';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

// ─── Booking step indices ────────────────────────────────────────────────────
// 0  Dog details
// 1  Booking summary
// 2  Payment (card input or saved card)
// 3  Tipping
// 4  Invoice / receipt
const TOTAL_STEPS = 5;

const sizes = ['Small', 'Medium', 'Large', 'XL'];
const services = ['Solo walk', 'Group walk', 'Drop-in'];
const recurringOptions = [
  { label: 'One-off', value: false },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Daily', value: 'daily' },
];
const TIP_OPTIONS = [
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: 'Custom', value: 'custom' },
  { label: 'No tip', value: 0 },
];

// ─── Shared sub-components ───────────────────────────────────────────────────

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

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, maxLength }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoComplete="off"
      />
    </View>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>⚠ {message}</Text>
    </View>
  );
}

// ─── Step 2: Payment ─────────────────────────────────────────────────────────

function PaymentStep({ walker, bookingData, dispatch, paymentStatus, paymentError, savedCards, selectedSavedCardId }) {
  const [useNewCard, setUseNewCard] = useState(savedCards.length === 0);
  // Local card input state — raw card fields live here only, never dispatched to store
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const amountCents = Math.round(
    (bookingData.serviceType === 'Drop-in' ? walker.pricePer30 : walker.pricePerWalk) * 100
  );

  async function handlePay() {
    dispatch({ type: 'SET_PAYMENT_STATUS', payload: 'processing' });
    try {
      let result;
      if (useNewCard) {
        // Tokenise locally — raw numbers never touch the store
        const { cardToken } = await tokeniseCard({ number: cardNumber, expiry, cvv });
        result = await checkout({ bookingDetails: bookingData, amountCents, cardToken });
      } else {
        result = await checkout({ bookingDetails: bookingData, amountCents, savedCardId: selectedSavedCardId });
      }

      // Save masked card list update
      if (result.savedCardId) {
        dispatch({
          type: 'SET_SAVED_CARDS',
          payload: [
            ...savedCards.filter((c) => c.id !== result.savedCardId),
            { id: result.savedCardId, last4: result.last4, brand: result.brand, expiry },
          ],
        });
      }

      // Store invoice (no raw card data)
      dispatch({
        type: 'SET_INVOICE',
        payload: {
          bookingReference: result.bookingReference,
          amountCents: result.amountCents,
          tipCents: 0,
          currency: result.currency || 'AUD',
          walkerName: walker.name,
          date: bookingData.date,
          time: bookingData.time,
          invoiceUrl: result.invoiceUrl,
          last4: result.last4,
          brand: result.brand,
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_PAYMENT_ERROR', payload: err.message });
    }
  }

  const isProcessing = paymentStatus === 'processing';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💳 Payment</Text>
      <Text style={styles.amountLabel}>
        Total: ${(amountCents / 100).toFixed(2)} AUD
      </Text>

      {savedCards.length > 0 && (
        <View style={styles.savedCardsBlock}>
          <Text style={styles.fieldLabel}>Saved cards</Text>
          {savedCards.map((card) => {
            const selected = !useNewCard && selectedSavedCardId === card.id;
            return (
              <Pressable
                key={card.id}
                style={[styles.savedCard, selected ? styles.savedCardActive : null]}
                onPress={() => {
                  dispatch({ type: 'SELECT_SAVED_CARD', payload: card.id });
                  setUseNewCard(false);
                }}
              >
                <Text style={[styles.savedCardText, selected ? styles.savedCardTextActive : null]}>
                  {card.brand} •••• {card.last4}   expires {card.expiry}
                </Text>
                {selected && <Text style={styles.savedCardCheck}>✓</Text>}
              </Pressable>
            );
          })}
          <Pressable onPress={() => setUseNewCard(true)}>
            <Text style={[styles.linkText, useNewCard ? styles.linkTextActive : null]}>
              + Use a different card
            </Text>
          </Pressable>
        </View>
      )}

      {useNewCard && (
        <View style={styles.cardForm}>
          <Text style={styles.fieldLabel}>Card details</Text>
          <Text style={styles.pciNote}>🔒 Card details are tokenised and never stored in this app.</Text>
          <Field
            label="Card number"
            value={cardNumber}
            onChangeText={(v) => setCardNumber(v.replace(/[^\d]/g, '').slice(0, 16))}
            placeholder="•••• •••• •••• ••••"
            keyboardType="numeric"
            maxLength={16}
          />
          <View style={styles.cardRow}>
            <View style={styles.cardRowItem}>
              <Field
                label="Expiry (MM/YY)"
                value={expiry}
                onChangeText={setExpiry}
                placeholder="MM/YY"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={styles.cardRowItem}>
              <Field
                label="CVV"
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/[^\d]/g, '').slice(0, 4))}
                placeholder="•••"
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </View>
      )}

      <ErrorBanner message={paymentError} />

      <Pressable
        style={[styles.primaryButton, isProcessing ? styles.buttonDisabled : null]}
        onPress={handlePay}
        disabled={isProcessing || (!useNewCard && !selectedSavedCardId)}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Pay & Book</Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Step 3: Tipping ─────────────────────────────────────────────────────────

function TippingStep({ walker, invoice, tipPercent, dispatch }) {
  const [customTip, setCustomTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const baseAmount = (invoice?.amountCents || 0) / 100;

  function calcTipCents(percent) {
    if (percent === 'custom') {
      return Math.round((parseFloat(customTip) || 0) * 100);
    }
    return Math.round(baseAmount * (percent / 100) * 100);
  }

  async function handleTip(percent) {
    dispatch({ type: 'SET_TIP_PERCENT', payload: percent });
    if (percent === 0) {
      dispatch({ type: 'NEXT_BOOKING_STEP' });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const tipCents = calcTipCents(percent === 'custom' ? 'custom' : percent);
      await submitTip({ bookingReference: invoice.bookingReference, tipCents });
      dispatch({
        type: 'SET_INVOICE',
        payload: { ...invoice, tipCents },
      });
      dispatch({ type: 'NEXT_BOOKING_STEP' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🐾 Leave a tip for {walker.name}?</Text>
      <Text style={styles.tipSubtitle}>
        Walk total: ${baseAmount.toFixed(2)} AUD
      </Text>

      <View style={styles.pillsWrap}>
        {TIP_OPTIONS.map((opt) => {
          const selected = tipPercent === opt.value;
          const tipDisplay =
            opt.value === 0 || opt.value === 'custom'
              ? opt.label
              : `${opt.label}  ($${((baseAmount * opt.value) / 100).toFixed(2)})`;
          return (
            <Pressable
              key={opt.label}
              style={[styles.pill, selected ? styles.pillActive : null]}
              onPress={() => dispatch({ type: 'SET_TIP_PERCENT', payload: opt.value })}
            >
              <Text style={[styles.pillText, selected ? styles.pillTextActive : null]}>{tipDisplay}</Text>
            </Pressable>
          );
        })}
      </View>

      {tipPercent === 'custom' && (
        <Field
          label="Custom tip amount ($)"
          value={customTip}
          onChangeText={setCustomTip}
          placeholder="e.g. 5.00"
          keyboardType="decimal-pad"
        />
      )}

      <ErrorBanner message={error} />

      <Pressable
        style={[styles.primaryButton, submitting ? styles.buttonDisabled : null]}
        onPress={() => handleTip(tipPercent ?? 0)}
        disabled={submitting || tipPercent === null}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {tipPercent === 0 ? 'Skip tip' : 'Confirm tip'}
          </Text>
        )}
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'NEXT_BOOKING_STEP' })}>
        <Text style={styles.secondaryButtonText}>Skip</Text>
      </Pressable>
    </View>
  );
}

// ─── Step 4: Invoice / receipt ────────────────────────────────────────────────

function InvoiceStep({ invoice, dispatch, walker }) {
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);
  const alreadyRefunded = invoice?.refundReference != null;

  async function handleRefund() {
    setRefunding(true);
    setRefundError(null);
    try {
      const result = await refund({ bookingReference: invoice.bookingReference });
      dispatch({ type: 'REFUND_BOOKING', payload: result });
    } catch (err) {
      setRefundError(err.message);
    } finally {
      setRefunding(false);
    }
  }

  if (!invoice) return null;

  const totalCents = (invoice.amountCents || 0) + (invoice.tipCents || 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🧾 {alreadyRefunded ? 'Refund issued' : 'Walk booked!'}</Text>

      <View style={styles.invoiceCard}>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Booking ref</Text>
          <Text style={styles.invoiceValue}>{invoice.bookingReference}</Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Walker</Text>
          <Text style={styles.invoiceValue}>{invoice.walkerName}</Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Date & time</Text>
          <Text style={styles.invoiceValue}>{invoice.date} at {invoice.time}</Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Walk</Text>
          <Text style={styles.invoiceValue}>${(invoice.amountCents / 100).toFixed(2)} {invoice.currency}</Text>
        </View>
        {invoice.tipCents > 0 && (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Tip</Text>
            <Text style={styles.invoiceValue}>${(invoice.tipCents / 100).toFixed(2)} {invoice.currency}</Text>
          </View>
        )}
        <View style={[styles.invoiceRow, styles.invoiceTotalRow]}>
          <Text style={styles.invoiceTotalLabel}>Total charged</Text>
          <Text style={styles.invoiceTotalValue}>${(totalCents / 100).toFixed(2)} {invoice.currency}</Text>
        </View>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Payment</Text>
          <Text style={styles.invoiceValue}>{invoice.brand} •••• {invoice.last4}</Text>
        </View>

        {alreadyRefunded && (
          <View style={styles.refundBadge}>
            <Text style={styles.refundBadgeText}>✓ Refund issued · ref {invoice.refundReference}</Text>
          </View>
        )}
      </View>

      {invoice.invoiceUrl && (
        <Text style={styles.invoiceLink}>📄 Invoice: {invoice.invoiceUrl}</Text>
      )}

      {!alreadyRefunded && (
        <>
          <ErrorBanner message={refundError} />
          <Pressable
            style={[styles.dangerButton, refunding ? styles.buttonDisabled : null]}
            onPress={handleRefund}
            disabled={refunding}
          >
            {refunding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.dangerButtonText}>Cancel & Refund</Text>
            )}
          </Pressable>
        </>
      )}

      <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'START_TRACKING' })}>
        <Text style={styles.primaryButtonText}>Open Live Walk Demo</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
        <Text style={styles.secondaryButtonText}>Back to home</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const { state, dispatch } = useWoof();
  const walker = state.selectedWalker;
  const { bookingData, bookingStep, paymentStatus, paymentError, savedCards, selectedSavedCardId, invoice, tipPercent, dogs } = state;

  useEffect(() => {
    // Pre-fetch saved cards when entering the booking flow
    getSavedCards()
      .then((cards) => dispatch({ type: 'SET_SAVED_CARDS', payload: cards }))
      .catch(() => {
        // Non-fatal — user can still enter card manually
      });
  }, []);

  if (!walker) return null;

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
          <Text style={styles.subtitle}>Step {bookingStep + 1} of {TOTAL_STEPS}</Text>
        </View>
      </View>

      {/* Step 0 — Dog & booking details */}
      {bookingStep === 0 && (
        <View style={styles.section}>
          {/* Saved dog selector */}
          {dogs && dogs.length > 0 && (
            <View style={styles.savedDogsSection}>
              <Text style={styles.fieldLabel}>Your dogs</Text>
              {dogs.map((dog) => {
                const isSelected = bookingData.dogName === dog.name && bookingData.breed === dog.breed;
                return (
                  <Pressable
                    key={dog.id}
                    style={[styles.savedDogRow, isSelected ? styles.savedDogRowActive : null]}
                    onPress={() =>
                      dispatch({
                        type: 'SET_BOOKING_DATA',
                        payload: { dogName: dog.name, breed: dog.breed },
                      })
                    }
                  >
                    <Text style={[styles.savedDogName, isSelected ? styles.savedDogNameActive : null]}>
                      🐾 {dog.name} · {dog.breed}
                    </Text>
                    {isSelected ? <Text style={styles.selectedTick}>✓</Text> : null}
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.addNewDogButton}
                onPress={() => dispatch({ type: 'SET_PHASE', payload: 'dogProfile' })}
              >
                <Text style={styles.addNewDogText}>+ Add new dog</Text>
              </Pressable>
            </View>
          )}

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
            <Text style={styles.primaryButtonText}>Confirm Booking Details</Text>
          </Pressable>
        </View>
      )}

      {/* Step 1 — Booking summary */}
      {bookingStep === 1 && (
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

          <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'NEXT_BOOKING_STEP' })}>
            <Text style={styles.primaryButtonText}>Continue to Payment</Text>
          </Pressable>
        </View>
      )}

      {/* Step 2 — Payment */}
      {bookingStep === 2 && (
        <PaymentStep
          walker={walker}
          bookingData={bookingData}
          dispatch={dispatch}
          paymentStatus={paymentStatus}
          paymentError={paymentError}
          savedCards={savedCards}
          selectedSavedCardId={selectedSavedCardId}
        />
      )}

      {/* Step 3 — Tipping */}
      {bookingStep === 3 && (
        <TippingStep
          walker={walker}
          invoice={invoice}
          tipPercent={tipPercent}
          dispatch={dispatch}
        />
      )}

      {/* Step 4 — Invoice / receipt */}
      {bookingStep === 4 && (
        <InvoiceStep
          invoice={invoice}
          dispatch={dispatch}
          walker={walker}
        />
      )}
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
  dangerButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  amountLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  savedCardsBlock: {
    gap: 8,
  },
  savedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  savedCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  savedCardText: {
    color: colors.text,
    fontWeight: '700',
  },
  savedCardTextActive: {
    color: colors.primary,
  },
  savedCardCheck: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  linkText: {
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
  },
  linkTextActive: {
    color: colors.primary,
  },
  cardForm: {
    gap: 10,
  },
  pciNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardRowItem: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  tipSubtitle: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  invoiceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    flex: 1,
  },
  invoiceValue: {
    color: colors.text,
    fontWeight: '800',
    flex: 2,
    textAlign: 'right',
  },
  invoiceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  invoiceTotalLabel: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    flex: 1,
  },
  invoiceTotalValue: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
    flex: 2,
    textAlign: 'right',
  },
  invoiceLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  refundBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  refundBadgeText: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
  },
  savedDogsSection: {
    gap: 8,
    marginBottom: 4,
  },
  savedDogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  savedDogRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.badgeGreen,
  },
  savedDogName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  savedDogNameActive: {
    color: colors.primaryDark,
  },
  selectedTick: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  addNewDogButton: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addNewDogText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
