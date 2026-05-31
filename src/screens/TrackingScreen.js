import React, { useEffect, useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WOOF_IMAGES } from '../media';
import { scheduleWalkNotification, NOTIFICATION_TYPES } from '../services/notifications';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

const routeCells = [1, 2, 3, 4, 12, 20, 28, 29, 30, 38, 46, 47, 48];
const pawCells = [3, 20, 38, 48];
const totalCells = 48;

// Photo-update notification fires once around 30% progress.
const PHOTO_NOTIFY_THRESHOLD = 0.3;

async function requestPermissions(dispatch) {
 let locationStatus = 'granted';
 let notificationsStatus = 'granted';

 if (Platform.OS !== 'web') {
   try {
     const Location = await import('expo-location');
     const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
     locationStatus = locStatus;
   } catch {
     // expo-location not available; treat as granted for demo
   }

   try {
     const Notifications = await import('expo-notifications');
     const { status: notifStatus } = await Notifications.requestPermissionsAsync();
     notificationsStatus = notifStatus;
   } catch {
     // expo-notifications not available; treat as granted for demo
   }
 }

 dispatch({
   type: 'SET_PERMISSIONS',
   payload: { location: locationStatus, notifications: notificationsStatus },
 });

 return { locationStatus, notificationsStatus };
}

export default function TrackingScreen() {
 const { state, dispatch } = useWoof();
 const walker = state.selectedWalker;
 const walkerName = walker?.name || 'Jessica Park';
 const isComplete = state.trackingProgress >= 1.0;
 const completedCells = Math.round(routeCells.length * state.trackingProgress);

 const notifiedStart = useRef(false);
 const notifiedPhoto = useRef(false);
 const notifiedEnd = useRef(false);

 // Request permissions and fire walk-started notification on mount.
 useEffect(() => {
   async function init() {
     if (state.permissions.location === null) {
       await requestPermissions(dispatch);
     }
     if (!notifiedStart.current) {
       notifiedStart.current = true;
       scheduleWalkNotification(NOTIFICATION_TYPES.WALK_STARTED, walkerName);
     }
   }
   init();
 }, []); // eslint-disable-line react-hooks/exhaustive-deps

 // Fire photo-update notification once near 30% progress.
 useEffect(() => {
   if (!notifiedPhoto.current && state.trackingProgress >= PHOTO_NOTIFY_THRESHOLD) {
     notifiedPhoto.current = true;
     scheduleWalkNotification(NOTIFICATION_TYPES.PHOTO_UPDATE, walkerName);
   }
 }, [state.trackingProgress, walkerName]);

 // Fire walk-ended notification when walk completes.
 useEffect(() => {
   if (!notifiedEnd.current && isComplete) {
     notifiedEnd.current = true;
     scheduleWalkNotification(NOTIFICATION_TYPES.WALK_ENDED, walkerName);
   }
 }, [isComplete, walkerName]);

 const deniedLocation = state.permissions.location === 'denied';
 const deniedNotifications = state.permissions.notifications === 'denied';

 return (
 <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <Pressable onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
 <Text style={styles.back}>← Back</Text>
 </Pressable>

 {(deniedLocation || deniedNotifications) && (
   <View style={styles.permissionBanner}>
     <Text style={styles.permissionBannerText}>
       {deniedLocation && '📍 Location access denied — map tracking disabled. '}
       {deniedNotifications && '🔔 Notification access denied — push alerts disabled.'}
     </Text>
   </View>
 )}

 <View style={styles.headerCard}>
 <Text style={styles.title}>{isComplete ? '✅ Walk Complete!' : '🐾 Buddy\'s Live Walk'}</Text>
 <Text style={styles.subtitle}>{walker?.emoji || ''} {walker?.name || 'Jessica Park'} · {isComplete ? 'Walk finished — leave a review!' : 'Walk Progress: 40% · 18 min remaining'}</Text>
 </View>

 <View style={styles.mapCard}>
 <Image source={{ uri: WOOF_IMAGES.trackingMap }} style={styles.mapImage} />
 <Text style={styles.mapTitle}>Live route grid</Text>
 <View style={styles.grid}>
 {Array.from({ length: totalCells }).map((_, index) => {
 const cell = index + 1;
 const routeIndex = routeCells.indexOf(cell);
 const walked = routeIndex !== -1 && routeIndex < completedCells;
 const onRoute = routeIndex !== -1;
 const hasPaw = pawCells.includes(cell) && walked;
 return (
 <View
 key={cell}
 style={[
 styles.cell,
 walked ? styles.cellWalked : null,
 onRoute && !walked ? styles.cellQueued : null,
 ]}
 >
 <Text style={styles.cellText}>{hasPaw ? '' : walked ? '•' : ''}</Text>
 </View>
 );
 })}
 </View>
 <Text style={styles.progressLabel}>{isComplete ? '✅ Walk 100% complete!' : 'Walk Progress: 40% · 18 min remaining'}</Text>
 </View>

 {isComplete ? (
 <Pressable style={styles.reviewButton} onPress={() => dispatch({ type: 'SET_PHASE', payload: 'review' })}>
 <Text style={styles.reviewButtonText}>⭐ Leave a Review</Text>
 </Pressable>
 ) : (
 <Pressable style={styles.completeButton} onPress={() => dispatch({ type: 'COMPLETE_WALK' })}>
 <Text style={styles.completeButtonText}>Simulate Walk Complete</Text>
 </Pressable>
 )}

 <View style={styles.photoBanner}>
 <Image source={{ uri: WOOF_IMAGES.trackingPhoto }} style={styles.photoImage} />
 <View style={styles.photoContent}>
 <Text style={styles.photoTitle}> Photo Update</Text>
 <Text style={styles.photoText}>Jessica shared a happy park snapshot and Buddy is cruising along the route.</Text>
 </View>
 </View>

 <View style={styles.callout}>
 <Text style={styles.calloutTitle}> alphinium-maps</Text>
 <Text style={styles.calloutText}>Real GPS tracking, live route, photo sharing</Text>
 </View>

 <View style={styles.calloutSecondary}>
 <Text style={styles.calloutTitleSecondary}>alphinium-payments + alphinium-push</Text>
 <Text style={styles.calloutTextSecondary}>Auto-complete charges, tipping, and push alerts when the walk starts and ends.</Text>
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
 paddingTop: 32,
 paddingBottom: 120,
 gap: 18,
 },
 back: {
 color: colors.primary,
 fontWeight: '800',
 },
 permissionBanner: {
 backgroundColor: '#FEF3C7',
 borderRadius: 12,
 padding: 12,
 },
 permissionBannerText: {
 color: '#92400E',
 fontSize: 13,
 },
 headerCard: {
 backgroundColor: '#DCFCE7',
 borderRadius: 26,
 padding: 20,
 gap: 6,
 },
 title: {
 fontSize: 28,
 fontWeight: '900',
 color: colors.text,
 },
 subtitle: {
 color: colors.textMuted,
 fontWeight: '700',
 lineHeight: 22,
 },
 mapCard: {
 backgroundColor: colors.card,
 borderRadius: 24,
 padding: 18,
 borderWidth: 1,
 borderColor: colors.border,
 gap: 14,
 },
 mapImage: {
 width: '100%',
 height: 180,
 borderRadius: 18,
 },
 mapTitle: {
 color: colors.text,
 fontWeight: '800',
 fontSize: 18,
 },
 grid: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 6,
 },
 cell: {
 width: '15.4%',
 aspectRatio: 1,
 borderRadius: 10,
 backgroundColor: '#E5E7EB',
 alignItems: 'center',
 justifyContent: 'center',
 },
 cellWalked: {
 backgroundColor: '#86EFAC',
 },
 cellQueued: {
 backgroundColor: '#D1FAE5',
 },
 cellText: {
 fontSize: 14,
 },
 progressLabel: {
 color: colors.text,
 fontWeight: '800',
 },
 photoBanner: {
 backgroundColor: '#FEF3C7',
 borderRadius: 18,
 overflow: 'hidden',
 },
 photoImage: {
 width: '100%',
 height: 180,
 },
 photoContent: {
 padding: 16,
 gap: 6,
 },
 photoTitle: {
 color: '#92400E',
 fontWeight: '900',
 },
 photoText: {
 color: '#92400E',
 lineHeight: 20,
 },
 callout: {
 backgroundColor: '#DBEAFE',
 borderRadius: 18,
 padding: 16,
 gap: 6,
 },
 calloutTitle: {
 color: '#1D4ED8',
 fontWeight: '900',
 },
 calloutText: {
 color: '#1D4ED8',
 lineHeight: 20,
 },
 calloutSecondary: {
 backgroundColor: '#ECFDF5',
 borderRadius: 18,
 padding: 16,
 gap: 6,
 },
 calloutTitleSecondary: {
 color: colors.text,
 fontWeight: '900',
 },
 calloutTextSecondary: {
 color: colors.textMuted,
 lineHeight: 20,
 },
 reviewButton: {
 backgroundColor: colors.accent,
 borderRadius: 16,
 paddingVertical: 16,
 alignItems: 'center',
 },
 reviewButtonText: {
 color: '#FFFFFF',
 fontWeight: '900',
 fontSize: 16,
 },
 completeButton: {
 backgroundColor: colors.card,
 borderRadius: 16,
 paddingVertical: 14,
 alignItems: 'center',
 borderWidth: 1,
 borderColor: colors.border,
 },
 completeButtonText: {
 color: colors.textMuted,
 fontWeight: '700',
 },
});
