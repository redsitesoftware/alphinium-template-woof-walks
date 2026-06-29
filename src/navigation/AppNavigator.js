import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import WalkerScreen from '../screens/WalkerScreen';
import BookingScreen from '../screens/BookingScreen';
import ReviewScreen from '../screens/ReviewScreen';
import TrackingScreen from '../screens/TrackingScreen';
import DogProfileScreen from '../screens/DogProfileScreen';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

const QUICK_CHIPS = [
 'Find a walker today ',
 'Group vs solo walk? ',
 'GPS tracking ️',
 'Get this for my business ',
];

function RuffChatWidget() {
 const { state, dispatch } = useWoof();

 return (
 <View pointerEvents="box-none" style={styles.chatLayer}>
 {state.chatOpen ? (
 <View style={styles.chatCard}>
 <View style={styles.chatHeader}>
 <Text style={styles.chatTitle}>Ruff </Text>
 <Pressable onPress={() => dispatch({ type: 'TOGGLE_CHAT' })}>
 <Text style={styles.chatClose}></Text>
 </Pressable>
 </View>
 <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
 {state.chatMessages.map((message) => (
 <View key={message.id} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
 <Text style={[styles.messageText, message.role === 'user' ? styles.userText : null]}>{message.text}</Text>
 </View>
 ))}
 <View style={styles.chipsWrap}>
 {QUICK_CHIPS.map((chip) => (
 <Pressable
 key={chip}
 style={styles.quickChip}
 onPress={() => dispatch({ type: 'SEND_CHAT', payload: chip })}
 >
 <Text style={styles.quickChipText}>{chip}</Text>
 </Pressable>
 ))}
 </View>
 </ScrollView>
 <View style={styles.chatInputRow}>
 <TextInput
 value={state.chatInput}
 onChangeText={(text) => dispatch({ type: 'SET_CHAT_INPUT', payload: text })}
 placeholder="Ask Ruff anything..."
 placeholderTextColor={colors.textMuted}
 style={styles.chatInput}
 />
 <Pressable style={styles.sendButton} onPress={() => dispatch({ type: 'SEND_CHAT' })}>
 <Text style={styles.sendButtonText}>Send</Text>
 </Pressable>
 </View>
 </View>
 ) : null}
 <Pressable style={styles.fab} onPress={() => dispatch({ type: 'TOGGLE_CHAT' })}>
 <Text style={styles.fabText}>Ruff </Text>
 </Pressable>
 </View>
 );
}

export default function AppNavigator() {
 const { state, dispatch } = useWoof();

 const handleLogin = useCallback(({ guest, token, user }) => {
  dispatch({ type: 'COMPLETE_LOGIN', guest, token, user });
 }, [dispatch]);

 return (
 <View style={styles.container}>
 {state.phase === 'login' ? <LoginScreen onLogin={handleLogin} /> : null}
 {state.phase === 'home' ? <HomeScreen /> : null}
 {state.phase === 'walker' ? <WalkerScreen /> : null}
 {state.phase === 'booking' ? <BookingScreen /> : null}
 {state.phase === 'tracking' ? <TrackingScreen /> : null}
 {state.phase === 'review' ? <ReviewScreen /> : null}
 {state.phase === 'dogProfile' ? (
 <DogProfileScreen onBack={() => dispatch({ type: 'SET_PHASE', payload: 'home' })} />
 ) : null}
 {state.phase !== 'login' ? <RuffChatWidget /> : null}
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 },
 chatLayer: {
 position: 'absolute',
 right: 18,
 bottom: 18,
 left: 18,
 alignItems: 'flex-end',
 },
 fab: {
 backgroundColor: colors.primary,
 paddingHorizontal: 18,
 paddingVertical: 14,
 borderRadius: 999,
 shadowColor: colors.shadow,
 shadowOpacity: 1,
 shadowRadius: 12,
 shadowOffset: { width: 0, height: 8 },
 elevation: 4,
 },
 fabText: {
 color: '#FFFFFF',
 fontWeight: '800',
 },
 chatCard: {
 width: '100%',
 maxWidth: 380,
 maxHeight: 520,
 backgroundColor: colors.card,
 borderRadius: 24,
 padding: 16,
 marginBottom: 12,
 borderWidth: 1,
 borderColor: colors.border,
 shadowColor: colors.shadow,
 shadowOpacity: 1,
 shadowRadius: 18,
 shadowOffset: { width: 0, height: 10 },
 elevation: 6,
 },
 chatHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 12,
 },
 chatTitle: {
 fontSize: 18,
 fontWeight: '800',
 color: colors.text,
 },
 chatClose: {
 fontSize: 18,
 color: colors.textMuted,
 fontWeight: '700',
 },
 chatMessages: {
 maxHeight: 340,
 },
 chatMessagesContent: {
 gap: 10,
 paddingBottom: 8,
 },
 messageBubble: {
 borderRadius: 18,
 padding: 12,
 },
 assistantBubble: {
 backgroundColor: '#ECFDF5',
 alignSelf: 'flex-start',
 },
 userBubble: {
 backgroundColor: colors.primary,
 alignSelf: 'flex-end',
 },
 messageText: {
 color: colors.text,
 lineHeight: 20,
 },
 userText: {
 color: '#FFFFFF',
 },
 chipsWrap: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 8,
 },
 quickChip: {
 paddingHorizontal: 10,
 paddingVertical: 8,
 borderRadius: 999,
 backgroundColor: '#FEF3C7',
 },
 quickChipText: {
 color: '#92400E',
 fontSize: 12,
 fontWeight: '700',
 },
 chatInputRow: {
 flexDirection: 'row',
 gap: 10,
 marginTop: 12,
 },
 chatInput: {
 flex: 1,
 borderWidth: 1,
 borderColor: colors.border,
 borderRadius: 14,
 paddingHorizontal: 14,
 paddingVertical: 10,
 color: colors.text,
 },
 sendButton: {
 backgroundColor: colors.primary,
 borderRadius: 14,
 paddingHorizontal: 16,
 justifyContent: 'center',
 },
 sendButtonText: {
 color: '#FFFFFF',
 fontWeight: '800',
 },
});
