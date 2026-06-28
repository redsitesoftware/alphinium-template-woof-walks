import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getWalkerPhoto } from '../media';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

// expo-notifications is not available on web; guard import.
let Notifications = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    // expo-notifications not installed — no-op
  }
}

export default function ReviewScreen() {
  const { state, dispatch, submitReview } = useWoof();
  const walker = state.selectedWalker;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!walker) return null;

  async function handleSubmit() {
    if (!comment.trim() || state.reviewSubmitting) return;
    try {
      await submitReview(state.bookingId, rating, comment.trim());
      // Cancel the deferred review-prompt notification since the user already reviewed
      try {
        if (Notifications) {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      } catch {
        // Non-fatal — continue even if cancellation fails
      }
    } catch {
      // error already in state.reviewSubmitError
    }
  }

  if (state.reviewSubmitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>Review Submitted!</Text>
        <Text style={styles.successText}>Thanks for rating {walker.name.split(' ')[0]}.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>🐾 Walk Complete!</Text>
        <Text style={styles.subtitle}>How was your walk with {walker.name.split(' ')[0]}?</Text>
      </View>

      <View style={styles.walkerCard}>
        <Image source={{ uri: getWalkerPhoto(walker.id) }} style={styles.walkerPhoto} />
        <View style={styles.walkerInfo}>
          <Text style={styles.walkerName}>{walker.name}</Text>
          <Text style={styles.walkerMeta}>{walker.suburb} · ⭐ {walker.rating.toFixed(1)}</Text>
        </View>
      </View>

      {state.walkPhotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Walk Photos</Text>
          <FlatList
            data={state.walkPhotos}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoAlbum}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => Alert.alert('Photo', item.caption)}
                style={styles.photoThumbContainer}
              >
                <Image source={{ uri: item.uri }} style={styles.photoThumb} />
                <Text style={styles.photoThumbCaption} numberOfLines={2}>{item.caption}</Text>
                <Text style={styles.photoThumbTime}>
                  {item.date || new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} style={styles.starButton}>
              <Text style={[styles.star, star <= rating ? styles.starFilled : styles.starEmpty]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingLabel}>{rating} out of 5</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leave a Comment</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={`Tell others about your experience with ${walker.name.split(' ')[0]}...`}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          style={styles.commentInput}
          textAlignVertical="top"
        />
      </View>

      <Pressable
        style={[styles.submitButton, (!comment.trim() || state.reviewSubmitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!comment.trim() || state.reviewSubmitting}
      >
        {state.reviewSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </Pressable>

      {state.reviewSubmitError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {state.reviewSubmitError}</Text>
        </View>
      ) : null}

      <Pressable onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip for now</Text>
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
    paddingTop: 32,
    paddingBottom: 60,
    gap: 18,
  },
  headerCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 26,
    padding: 20,
    gap: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  walkerCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  walkerPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  walkerInfo: {
    flex: 1,
    gap: 4,
  },
  walkerName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  walkerMeta: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  photoAlbum: {
    gap: 12,
    paddingVertical: 4,
  },
  photoThumbContainer: {
    width: 100,
    alignItems: 'center',
    gap: 4,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  photoThumbCaption: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  photoThumbTime: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 40,
  },
  starFilled: {
    color: colors.accent,
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  ratingLabel: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  successText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});
