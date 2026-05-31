import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { filterWalkers, useWoof } from '../store/woofStore';
import { getWalkerPhoto, WOOF_IMAGES } from '../media';
import { colors } from '../theme';

const FILTERS = {
 available: ['Any', 'Today only'],
 serviceType: ['All', 'Solo Walk', 'Group Walk', 'Drop-in'],
 priceMax: ['Any', 'Under $22', 'Under $28', 'Under $35'],
 sortBy: ['Distance', 'Rating', 'Price ↑'],
};

function FilterRow({ label, value, options, onChange }) {
 return (
 <View style={styles.filterGroup}>
 <Text style={styles.filterLabel}>{label}</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
 {options.map((option) => (
 <Pressable
 key={option}
 style={[styles.filterPill, value === option ? styles.filterPillActive : null]}
 onPress={() => onChange(option)}
 >
 <Text style={[styles.filterPillText, value === option ? styles.filterPillTextActive : null]}>{option}</Text>
 </Pressable>
 ))}
 </ScrollView>
 </View>
 );
}

function WalkerCard({ walker, onOpen, onBook }) {
 return (
 <Pressable style={styles.card} onPress={onOpen}>
 <View style={styles.cardTopRow}>
 <Image source={{ uri: getWalkerPhoto(walker.id) }} style={styles.avatarCircle} />
 <View style={styles.cardTopContent}>
 <View style={styles.cardTitleRow}>
 <Text style={styles.cardTitle}>{walker.name}</Text>
 {walker.badge ? (
 <View style={[styles.badge, { backgroundColor: walker.badgeColor || colors.badgeGreen }]}>
 <Text style={styles.badgeText}>{walker.badge}</Text>
 </View>
 ) : null}
 </View>
 <Text style={styles.cardMeta}> {walker.suburb} · {walker.distance.toFixed(1)}km</Text>
 <Text style={styles.cardMeta}> {walker.rating.toFixed(1)} ({walker.reviewCount} reviews)</Text>
 </View>
 </View>

 <View style={styles.slotRow}>
 <Text style={[styles.slotText, walker.available ? styles.slotAvailable : styles.slotUnavailable]}> Next: {walker.nextSlot}</Text>
 <Text style={styles.dogsText}> {walker.dogs}</Text>
 </View>

 <Text style={styles.pricingText}>${walker.pricePerWalk}/60min walk · ${walker.pricePer30}/30min</Text>

 <View style={styles.tagsRow}>
 {walker.tags.map((tag) => (
 <View key={tag} style={styles.tagPill}>
 <Text style={styles.tagText}>{tag}</Text>
 </View>
 ))}
 </View>

 <Pressable style={styles.bookButton} onPress={onBook}>
 <Text style={styles.bookButtonText}>Book Now</Text>
 </Pressable>
 </Pressable>
 );
}

export default function HomeScreen() {
 const { state, dispatch } = useWoof();
 const walkers = filterWalkers(state);

 return (
 <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <View style={styles.header}>
 <Text style={styles.logo}> WoofWalks</Text>
 <Text style={styles.subtitle}>Find trusted dog walkers near you</Text>
 </View>

 <View style={styles.heroCard}>
 <Image source={{ uri: WOOF_IMAGES.hero }} style={styles.heroImage} />
 <View style={styles.heroOverlay}>
 <Text style={styles.heroEyebrow}>Trusted local walkers</Text>
 <Text style={styles.heroTitle}>Safe adventures and photo updates for every pup.</Text>
 <Text style={styles.heroBody}>Browse premium walkers, compare availability, and book Buddy's next walk in minutes.</Text>
 </View>
 </View>

 {state.trackingActive ? (
 <View style={styles.activeBanner}>
 <View style={styles.bannerHeader}>
 <View style={styles.liveDot} />
 <Text style={styles.bannerTitle}>Buddy is out on a walk with Jessica! </Text>
 </View>
 <Text style={styles.bannerText}>Walk 40% complete — 18 min remaining</Text>
 <View style={styles.progressTrack}>
 <View style={styles.progressFill} />
 </View>
 <View style={styles.routeBox}>
 <Text style={styles.routeTitle}>Simulated GPS path</Text>
 <Text style={styles.routeArt}> ─ ─ ─ ─ ─ ─ </Text>
 </View>
 <Pressable style={styles.liveMapButton} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'tracking' })}>
 <Text style={styles.liveMapButtonText}>View Live Map</Text>
 </Pressable>
 <Text style={styles.photoUpdate}> Jessica sent a photo update!</Text>
 <View style={styles.calloutRow}>
 <View style={styles.calloutCard}>
 <Text style={styles.calloutTitle}>alphinium-push</Text>
 <Text style={styles.calloutText}>Walk start/end notifications and photo alerts.</Text>
 </View>
 </View>
 </View>
 ) : null}

 <View style={styles.searchBlock}>
 <Text style={styles.location}> Surry Hills, NSW</Text>
 <TextInput
 value={state.searchText}
 onChangeText={(text) => dispatch({ type: 'SET_SEARCH', payload: text })}
 placeholder="Search walker name or suburb..."
 placeholderTextColor={colors.textMuted}
 style={styles.searchInput}
 />
 </View>

 <FilterRow
 label="Available"
 value={state.filters.available}
 options={FILTERS.available}
 onChange={(value) => dispatch({ type: 'SET_FILTER', key: 'available', value })}
 />
 <FilterRow
 label="Service"
 value={state.filters.serviceType}
 options={FILTERS.serviceType}
 onChange={(value) => dispatch({ type: 'SET_FILTER', key: 'serviceType', value })}
 />
 <FilterRow
 label="Price"
 value={state.filters.priceMax}
 options={FILTERS.priceMax}
 onChange={(value) => dispatch({ type: 'SET_FILTER', key: 'priceMax', value })}
 />
 <FilterRow
 label="Sort"
 value={state.filters.sortBy}
 options={FILTERS.sortBy}
 onChange={(value) => dispatch({ type: 'SET_FILTER', key: 'sortBy', value })}
 />

 <Text style={styles.resultsText}>{walkers.length} dog walkers near you</Text>

 <View style={styles.list}>
 {walkers.map((walker) => (
 <WalkerCard
 key={walker.id}
 walker={walker}
 onOpen={() => dispatch({ type: 'SELECT_WALKER', payload: walker, phase: 'walker' })}
 onBook={() => {
 dispatch({ type: 'SELECT_WALKER', payload: walker });
 dispatch({ type: 'SET_PHASE', payload: 'booking' });
 }}
 />
 ))}
 </View>
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
 gap: 16,
 },
 header: {
 marginTop: 20,
 gap: 6,
 },
 logo: {
 fontSize: 30,
 fontWeight: '900',
 color: colors.primary,
 },
 subtitle: {
 fontSize: 16,
 color: colors.text,
 },
 heroCard: {
 borderRadius: 24,
 overflow: 'hidden',
 backgroundColor: colors.card,
 borderWidth: 1,
 borderColor: colors.border,
 },
 heroImage: {
 width: '100%',
 height: 220,
 },
 heroOverlay: {
 padding: 18,
 backgroundColor: '#DCFCE7',
 gap: 6,
 },
 heroEyebrow: {
 color: colors.primary,
 fontWeight: '800',
 textTransform: 'uppercase',
 fontSize: 12,
 letterSpacing: 0.5,
 },
 heroTitle: {
 fontSize: 26,
 fontWeight: '900',
 color: colors.text,
 },
 heroBody: {
 color: colors.textMuted,
 lineHeight: 22,
 },
 activeBanner: {
 backgroundColor: colors.card,
 borderRadius: 24,
 padding: 18,
 borderWidth: 1,
 borderColor: colors.border,
 gap: 12,
 },
 bannerHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 10,
 },
 liveDot: {
 width: 12,
 height: 12,
 borderRadius: 999,
 backgroundColor: colors.success,
 },
 bannerTitle: {
 flex: 1,
 fontSize: 16,
 fontWeight: '800',
 color: colors.text,
 },
 bannerText: {
 color: colors.textMuted,
 fontWeight: '600',
 },
 progressTrack: {
 height: 10,
 borderRadius: 999,
 backgroundColor: '#DCFCE7',
 overflow: 'hidden',
 },
 progressFill: {
 width: '40%',
 height: '100%',
 borderRadius: 999,
 backgroundColor: colors.primary,
 },
 routeBox: {
 backgroundColor: '#ECFDF5',
 borderRadius: 16,
 padding: 12,
 gap: 6,
 },
 routeTitle: {
 color: colors.textMuted,
 fontSize: 12,
 fontWeight: '700',
 textTransform: 'uppercase',
 },
 routeArt: {
 color: colors.text,
 fontWeight: '800',
 },
 liveMapButton: {
 backgroundColor: colors.primary,
 paddingVertical: 12,
 borderRadius: 14,
 alignItems: 'center',
 },
 liveMapButtonText: {
 color: '#FFFFFF',
 fontWeight: '800',
 },
 photoUpdate: {
 color: colors.text,
 fontWeight: '700',
 },
 calloutRow: {
 flexDirection: 'row',
 },
 calloutCard: {
 flex: 1,
 backgroundColor: '#FEF3C7',
 borderRadius: 16,
 padding: 12,
 },
 calloutTitle: {
 color: '#92400E',
 fontWeight: '800',
 marginBottom: 4,
 },
 calloutText: {
 color: '#92400E',
 },
 searchBlock: {
 gap: 10,
 },
 location: {
 color: colors.text,
 fontWeight: '700',
 },
 searchInput: {
 backgroundColor: colors.card,
 borderRadius: 16,
 paddingHorizontal: 16,
 paddingVertical: 14,
 borderWidth: 1,
 borderColor: colors.border,
 color: colors.text,
 },
 filterGroup: {
 gap: 10,
 },
 filterLabel: {
 color: colors.text,
 fontWeight: '800',
 },
 filterOptions: {
 gap: 8,
 paddingRight: 20,
 },
 filterPill: {
 paddingHorizontal: 14,
 paddingVertical: 10,
 borderRadius: 999,
 backgroundColor: colors.card,
 borderWidth: 1,
 borderColor: colors.border,
 },
 filterPillActive: {
 backgroundColor: colors.primary,
 borderColor: colors.primary,
 },
 filterPillText: {
 color: colors.text,
 fontWeight: '700',
 },
 filterPillTextActive: {
 color: '#FFFFFF',
 },
 resultsText: {
 fontSize: 18,
 fontWeight: '800',
 color: colors.text,
 },
 list: {
 gap: 16,
 },
 card: {
 backgroundColor: colors.card,
 borderRadius: 24,
 padding: 16,
 borderWidth: 1,
 borderColor: colors.border,
 gap: 14,
 },
 cardTopRow: {
 flexDirection: 'row',
 gap: 12,
 },
 avatarCircle: {
 width: 60,
 height: 60,
 borderRadius: 999,
 },
 cardTopContent: {
 flex: 1,
 gap: 4,
 },
 cardTitleRow: {
 flexDirection: 'row',
 gap: 8,
 alignItems: 'center',
 flexWrap: 'wrap',
 },
 cardTitle: {
 fontSize: 18,
 fontWeight: '800',
 color: colors.text,
 },
 badge: {
 paddingHorizontal: 10,
 paddingVertical: 5,
 borderRadius: 999,
 },
 badgeText: {
 color: '#FFFFFF',
 fontSize: 12,
 fontWeight: '800',
 },
 cardMeta: {
 color: colors.textMuted,
 fontWeight: '600',
 },
 slotRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 gap: 10,
 flexWrap: 'wrap',
 },
 slotText: {
 fontWeight: '700',
 },
 slotAvailable: {
 color: colors.primary,
 },
 slotUnavailable: {
 color: colors.textMuted,
 },
 dogsText: {
 color: colors.text,
 fontWeight: '700',
 },
 pricingText: {
 fontSize: 16,
 fontWeight: '800',
 color: colors.text,
 },
 tagsRow: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 8,
 },
 tagPill: {
 backgroundColor: '#ECFDF5',
 borderRadius: 999,
 paddingHorizontal: 10,
 paddingVertical: 7,
 },
 tagText: {
 color: colors.text,
 fontSize: 12,
 fontWeight: '700',
 },
 bookButton: {
 backgroundColor: colors.primary,
 borderRadius: 14,
 paddingVertical: 13,
 alignItems: 'center',
 },
 bookButtonText: {
 color: '#FFFFFF',
 fontWeight: '800',
 },
});
