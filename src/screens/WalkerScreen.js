import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getWalkerReviews, useWoof } from '../store/woofStore';
import { getWalkerPhoto } from '../media';
import { colors } from '../theme';

export default function WalkerScreen() {
 const { state, dispatch } = useWoof();
 const walker = state.selectedWalker;
 const reviews = getWalkerReviews(walker);

 if (!walker) {
 return null;
 }

 return (
 <View style={styles.page}>
 <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <Pressable onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
 <Text style={styles.back}>← Back</Text>
 </Pressable>

 <View style={styles.hero}>
 <Image source={{ uri: getWalkerPhoto(walker.id) }} style={styles.heroImage} />
 <View style={styles.heroBody}>
 <Text style={styles.heroName}>{walker.name}</Text>
 <Text style={styles.heroMeta}>{walker.suburb} · {walker.distance.toFixed(1)}km away</Text>
 <Text style={styles.heroRating}> {walker.rating.toFixed(1)} · {walker.reviewCount} reviews</Text>
 </View>
 </View>

 <View style={styles.section}>
 <Text style={styles.sectionTitle}>About {walker.name.split(' ')[0]}</Text>
 <Text style={styles.body}>{walker.bio}</Text>
 </View>

 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Services offered</Text>
 {walker.services.map((service) => (
 <View key={service} style={styles.serviceRow}>
 <View>
 <Text style={styles.serviceName}>{service}</Text>
 <Text style={styles.serviceHint}>{walker.nextSlot}</Text>
 </View>
 <Text style={styles.servicePrice}>{service.toLowerCase().includes('drop') ? `$${walker.pricePer30}` : `$${walker.pricePerWalk}`}</Text>
 </View>
 ))}
 </View>

 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Great fit for</Text>
 <View style={styles.tagsRow}>
 {walker.tags.map((tag) => (
 <View key={tag} style={styles.tagPill}>
 <Text style={styles.tagText}>{tag}</Text>
 </View>
 ))}
 </View>
 </View>

 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Rating breakdown</Text>
 {Object.entries(walker.ratingBreakdown).map(([category, score]) => (
  <View key={category} style={styles.breakdownRow}>
   <Text style={styles.breakdownLabel}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
   <View style={styles.breakdownBarTrack}>
    <View style={[styles.breakdownBarFill, { width: `${(score / 5) * 100}%` }]} />
   </View>
   <Text style={styles.breakdownScore}>★ {score.toFixed(1)}</Text>
  </View>
 ))}
 </View>

 <View style={styles.section}>
 <Text style={styles.sectionTitle}>Recent reviews ({walker.reviewCount})</Text>
 {reviews.map((review) => (
 <View key={review.id} style={styles.reviewCard}>
  <View style={styles.reviewHeader}>
   <Text style={styles.reviewAuthor}>{review.author}</Text>
   <Text style={styles.reviewDate}>{review.date}</Text>
  </View>
  <Text style={styles.reviewRating}>★ {review.rating}</Text>
  <Text style={styles.body}>{review.text}</Text>
 </View>
 ))}
 </View>
 </ScrollView>

 <View style={styles.stickyBar}>
 <Pressable style={styles.bookButton} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'booking' })}>
 <Text style={styles.bookButtonText}>Book a Walk</Text>
 </Pressable>
 </View>
 </View>
 );
}

const styles = StyleSheet.create({
 page: {
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
 hero: {
 backgroundColor: colors.card,
 borderRadius: 28,
 overflow: 'hidden',
 borderWidth: 1,
 borderColor: colors.border,
 },
 heroImage: {
 width: '100%',
 height: 260,
 },
 heroBody: {
 backgroundColor: '#DCFCE7',
 padding: 24,
 alignItems: 'center',
 gap: 8,
 },
 heroName: {
 fontSize: 28,
 fontWeight: '900',
 color: colors.text,
 },
 heroMeta: {
 color: colors.text,
 fontWeight: '700',
 },
 heroRating: {
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
 fontSize: 18,
 fontWeight: '800',
 color: colors.text,
 },
 body: {
 color: colors.textMuted,
 lineHeight: 22,
 },
 serviceRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 12,
 borderBottomWidth: 1,
 borderColor: colors.border,
 },
 serviceName: {
 color: colors.text,
 fontWeight: '800',
 marginBottom: 4,
 },
 serviceHint: {
 color: colors.textMuted,
 },
 servicePrice: {
 color: colors.primary,
 fontWeight: '900',
 fontSize: 18,
 },
 tagsRow: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 8,
 },
 tagPill: {
 backgroundColor: '#ECFDF5',
 paddingHorizontal: 10,
 paddingVertical: 8,
 borderRadius: 999,
 },
 tagText: {
 color: colors.text,
 fontWeight: '700',
 fontSize: 12,
 },
 reviewCard: {
 backgroundColor: '#F8FAFC',
 borderRadius: 18,
 padding: 14,
 gap: 6,
 },
 reviewHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 },
 reviewAuthor: {
 color: colors.text,
 fontWeight: '800',
 },
 reviewDate: {
 color: colors.textMuted,
 fontSize: 12,
 },
 reviewRating: {
 color: colors.accent,
 fontWeight: '800',
 },
 breakdownRow: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 10,
 },
 breakdownLabel: {
 color: colors.text,
 fontWeight: '700',
 fontSize: 13,
 width: 110,
 },
 breakdownBarTrack: {
 flex: 1,
 height: 6,
 backgroundColor: colors.border,
 borderRadius: 999,
 overflow: 'hidden',
 },
 breakdownBarFill: {
 height: '100%',
 backgroundColor: colors.primary,
 borderRadius: 999,
 },
 breakdownScore: {
 color: colors.accent,
 fontWeight: '800',
 fontSize: 13,
 width: 36,
 textAlign: 'right',
 },
 stickyBar: {
 position: 'absolute',
 left: 0,
 right: 0,
 bottom: 0,
 padding: 16,
 backgroundColor: 'rgba(240, 255, 244, 0.98)',
 borderTopWidth: 1,
 borderColor: colors.border,
 },
 bookButton: {
 backgroundColor: colors.primary,
 borderRadius: 16,
 paddingVertical: 16,
 alignItems: 'center',
 },
 bookButtonText: {
 color: '#FFFFFF',
 fontWeight: '900',
 fontSize: 16,
 },
});
