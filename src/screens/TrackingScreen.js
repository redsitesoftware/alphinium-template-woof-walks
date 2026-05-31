import React, { useCallback, useEffect, useRef } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRouteHistory, getWalkPhotos, getWalkPosition, ROUTE_TOTAL_WAYPOINTS, TRACKING_POLL_INTERVAL_MS } from '../services/alphinium';
import { WOOF_IMAGES } from '../media';
import { scheduleWalkNotification, NOTIFICATION_TYPES } from '../services/notifications';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

// Grid dimensions for the route visualisation (6 × 8 = 48 cells).
const GRID_COLS = 6;
const TOTAL_CELLS = 48;

/**
 * Map a flat list of GPS waypoints onto the fixed grid cell indices.
 * The first waypoint maps to cell 1, the last to cell TOTAL_CELLS,
 * so the path winds predictably across the grid regardless of actual coordinates.
 */
function waypointsToGridCells(waypoints, totalWaypoints) {
  // Fixed snake-path through the grid so the route looks intentional.
  const snakePath = [];
  for (let row = 0; row < TOTAL_CELLS / GRID_COLS; row++) {
    const startCol = row % 2 === 0 ? 1 : GRID_COLS;
    const endCol = row % 2 === 0 ? GRID_COLS : 1;
    const direction = row % 2 === 0 ? 1 : -1;
    for (let col = startCol; col !== endCol + direction; col += direction) {
      snakePath.push(row * GRID_COLS + col);
    }
  }
  const stepSize = Math.max(1, Math.floor(snakePath.length / totalWaypoints));
  return waypoints.map((_, i) => snakePath[Math.min(i * stepSize, snakePath.length - 1)]);
}

const PAW_INTERVAL = 5; // place a paw emoji every N walked cells

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
  const walkId = state.bookingData?.walkId || 'demo-walk-1';
  const intervalRef = useRef(null);

  const pollGPS = useCallback(async () => {
    try {
      const [coords, history, photos] = await Promise.all([
        getWalkPosition(walkId),
        getRouteHistory(walkId),
        getWalkPhotos(walkId),
      ]);
      dispatch({ type: 'SET_TRACKING_COORDS', payload: coords });
      dispatch({ type: 'SET_ROUTE_HISTORY', payload: history, total: ROUTE_TOTAL_WAYPOINTS });
      dispatch({ type: 'SET_WALK_PHOTOS', payload: photos });
    } catch {
      dispatch({ type: 'GPS_UNAVAILABLE' });
    }
  }, [walkId, dispatch]);

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

  useEffect(() => {
    // Immediate first fetch, then poll on interval.
    pollGPS();
    intervalRef.current = setInterval(pollGPS, TRACKING_POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [pollGPS]);

  // Derive grid cells from live route history, falling back to static mock.
  const walkedCells = state.routeHistory.length > 0
    ? waypointsToGridCells(state.routeHistory, ROUTE_TOTAL_WAYPOINTS)
    : [1, 2, 3, 4, 12, 20, 28, 29, 30]; // static fallback for graceful degradation

  const walkedSet = new Set(walkedCells);
  const progress = Math.round(state.trackingProgress * 100);
  const minsRemaining = Math.round((1 - state.trackingProgress) * 30);

  // Latest photo for the banner; fall back to static image.
  const latestPhoto = state.walkPhotos.length > 0
    ? state.walkPhotos[state.walkPhotos.length - 1]
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => dispatch({ type: 'SET_PHASE', payload: 'home' })}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.headerCard}>
        <Text style={styles.title}>{isComplete ? '✅ Walk Complete!' : '🐾 Buddy\'s Live Walk'}</Text>
        <Text style={styles.subtitle}>
          {walker?.emoji || ''} {walker?.name || 'Jessica Park'} · {isComplete ? 'Walk finished — leave a review!' : `Walk Progress: ${progress}% · ${minsRemaining} min remaining`}
        </Text>
        {!state.gpsAvailable && !isComplete && (
          <Text style={styles.gpsWarning}>⚠️ GPS signal lost — showing last known position</Text>
        )}
      </View>

      <View style={styles.mapCard}>
        <Image source={{ uri: WOOF_IMAGES.trackingMap }} style={styles.mapImage} />
        <Text style={styles.mapTitle}>
          {state.routeHistory.length > 0 ? 'Live GPS route' : 'Route map'}
        </Text>
        <View style={styles.grid}>
          {Array.from({ length: TOTAL_CELLS }).map((_, index) => {
            const cell = index + 1;
            const walked = walkedSet.has(cell);
            const isCurrentPos = walkedCells[walkedCells.length - 1] === cell && state.gpsAvailable;
            const hasPaw = walked && walkedCells.indexOf(cell) % PAW_INTERVAL === 0;
            return (
              <View
                key={cell}
                style={[
                  styles.cell,
                  walked ? styles.cellWalked : null,
                  isCurrentPos ? styles.cellCurrent : null,
                ]}
              >
                <Text style={styles.cellText}>
                  {isCurrentPos ? '📍' : hasPaw ? '🐾' : walked ? '•' : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.progressLabel}>
          Walk Progress: {progress}% · {minsRemaining} min remaining
        </Text>
        {state.trackingCoords && (
          <Text style={styles.coordsLabel}>
            📡 {state.trackingCoords.lat.toFixed(4)}, {state.trackingCoords.lng.toFixed(4)}
          </Text>
        )}
      </View>

      {/* Photo banner — live updates from walker's feed */}
      <View style={styles.photoBanner}>
        <Image
          source={{ uri: latestPhoto?.uri || WOOF_IMAGES.trackingPhoto }}
          style={styles.photoImage}
        />
        <View style={styles.photoContent}>
          <Text style={styles.photoTitle}>📸 Photo Update</Text>
          <Text style={styles.photoText}>
            {latestPhoto?.caption || 'Jessica shared a happy park snapshot and Buddy is cruising along the route.'}
          </Text>
          {state.walkPhotos.length > 1 && (
            <Text style={styles.photoCount}>+{state.walkPhotos.length - 1} more photo{state.walkPhotos.length > 2 ? 's' : ''} from this walk</Text>
          )}
        </View>
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

      <View style={styles.callout}>
        <Text style={styles.calloutTitle}>📍 alphinium-maps</Text>
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
 cellCurrent: {
 backgroundColor: '#22C55E',
 borderWidth: 2,
 borderColor: '#15803D',
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
 coordsLabel: {
 color: colors.textMuted,
 fontSize: 11,
 },
 gpsWarning: {
 color: '#B45309',
 fontSize: 12,
 fontWeight: '700',
 marginTop: 4,
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
 photoCount: {
 color: '#92400E',
 fontSize: 12,
 marginTop: 4,
 opacity: 0.8,
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
