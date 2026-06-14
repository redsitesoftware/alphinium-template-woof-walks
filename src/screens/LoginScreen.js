import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useWoof } from '../store/woofStore';
import { colors } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'woof-walks.social-token';
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const redirectUri = makeRedirectUri({
 scheme: process.env.EXPO_PUBLIC_APP_SCHEME,
 path: 'auth',
});

function SocialButton({ label, loadingLabel, disabled, loading, onPress }) {
 return (
 <Pressable
 style={[styles.socialButton, disabled ? styles.socialButtonDisabled : null]}
 disabled={disabled}
 onPress={onPress}
 >
 {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
 <Text style={styles.socialButtonText}>{loading ? loadingLabel : label}</Text>
 </Pressable>
 );
}

function GoogleLoginButton({ onSuccess, onError, disabled }) {
 const [loading, setLoading] = useState(false);
 const [request, response, promptAsync] = Google.useAuthRequest({
 webClientId: googleClientId,
 responseType: ResponseType.Token,
 scopes: ['profile', 'email'],
 redirectUri,
 });

 useEffect(() => {
 if (response?.type === 'success') {
 const token = response.authentication?.accessToken || response.params?.access_token || response.params?.id_token;
 if (token) {
 void onSuccess('google', token);
 } else {
 onError('Google login did not return a token.');
 }
 setLoading(false);
 return;
 }

 if (response?.type === 'error') {
 onError(response.error?.message || 'Google login failed.');
 setLoading(false);
 return;
 }

 if (response?.type === 'cancel' || response?.type === 'dismiss') {
 setLoading(false);
 }
 }, [onError, onSuccess, response]);

 return (
 <SocialButton
 label="Continue with Google"
 loadingLabel="Opening Google..."
 disabled={!request || disabled}
 loading={loading}
 onPress={async () => {
 setLoading(true);
 await promptAsync();
 }}
 />
 );
}

function FacebookLoginButton({ onSuccess, onError, disabled }) {
 const [loading, setLoading] = useState(false);
 const [request, response, promptAsync] = Facebook.useAuthRequest({
 clientId: facebookAppId,
 responseType: ResponseType.Token,
 scopes: ['public_profile', 'email'],
 redirectUri,
 });

 useEffect(() => {
 if (response?.type === 'success') {
 const token = response.authentication?.accessToken || response.params?.access_token;
 if (token) {
 void onSuccess('facebook', token);
 } else {
 onError('Facebook login did not return a token.');
 }
 setLoading(false);
 return;
 }

 if (response?.type === 'error') {
 onError(response.error?.message || 'Facebook login failed.');
 setLoading(false);
 return;
 }

 if (response?.type === 'cancel' || response?.type === 'dismiss') {
 setLoading(false);
 }
 }, [onError, onSuccess, response]);

 return (
 <SocialButton
 label="Continue with Facebook"
 loadingLabel="Opening Facebook..."
 disabled={!request || disabled}
 loading={loading}
 onPress={async () => {
 setLoading(true);
 await promptAsync();
 }}
 />
 );
}

export default function LoginScreen() {
 const { dispatch } = useWoof();
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 const hasGoogle = useMemo(() => Boolean(googleClientId), []);
 const hasFacebook = useMemo(() => Boolean(facebookAppId), []);

 const completeLogin = useCallback(async (provider, token) => {
 setError('');
 setSaving(true);

 try {
 await AsyncStorage.setItem(
 STORAGE_KEY,
 JSON.stringify({
 provider,
 token,
 savedAt: new Date().toISOString(),
 }),
 );
 dispatch({ type: 'SET_PHASE', payload: 'home' });
 } catch (storageError) {
 setError('We could not save your login yet. Please try again.');
 } finally {
 setSaving(false);
 }
 }, [dispatch]);

 const handleGuest = useCallback(() => {
 setError('');
 dispatch({ type: 'SET_PHASE', payload: 'home' });
 }, [dispatch]);

 return (
 <View style={styles.container}>
 <View style={styles.card}>
 <Text style={styles.brand}>WoofWalks</Text>
 <Text style={styles.heading}>Sign in to continue</Text>
 <Text style={styles.subheading}>Use social login or jump in as a guest.</Text>

 <View style={styles.buttonGroup}>
 {hasGoogle ? <GoogleLoginButton onSuccess={completeLogin} onError={setError} disabled={saving} /> : null}
 {hasFacebook ? <FacebookLoginButton onSuccess={completeLogin} onError={setError} disabled={saving} /> : null}
 {!hasGoogle && !hasFacebook ? (
 <View style={styles.placeholderCard}>
 <Text style={styles.placeholderTitle}>Login coming soon</Text>
 <Text style={styles.placeholderText}>Add a Google or Facebook App ID to enable social login for this demo.</Text>
 </View>
 ) : null}
 </View>

 {error ? <Text style={styles.errorText}>{error}</Text> : null}

 <Pressable style={styles.guestButton} onPress={handleGuest}>
 <Text style={styles.guestButtonText}>Continue as guest</Text>
 </Pressable>
 </View>
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 justifyContent: 'center',
 padding: 24,
 backgroundColor: colors.bg,
 },
 card: {
 borderRadius: 28,
 padding: 24,
 backgroundColor: colors.card,
 borderWidth: 1,
 borderColor: colors.border,
 shadowColor: colors.shadow,
 shadowOpacity: 1,
 shadowRadius: 18,
 shadowOffset: { width: 0, height: 10 },
 elevation: 5,
 gap: 12,
 },
 brand: {
 fontSize: 30,
 fontWeight: '900',
 color: colors.primary,
 textAlign: 'center',
 },
 heading: {
 fontSize: 24,
 fontWeight: '800',
 color: colors.text,
 textAlign: 'center',
 },
 subheading: {
 fontSize: 15,
 lineHeight: 22,
 color: colors.textMuted,
 textAlign: 'center',
 },
 buttonGroup: {
 marginTop: 8,
 gap: 12,
 },
 socialButton: {
 minHeight: 54,
 borderRadius: 16,
 backgroundColor: colors.primary,
 alignItems: 'center',
 justifyContent: 'center',
 flexDirection: 'row',
 gap: 10,
 paddingHorizontal: 18,
 },
 socialButtonDisabled: {
 opacity: 0.65,
 },
 socialButtonText: {
 fontSize: 16,
 fontWeight: '800',
 color: '#FFFFFF',
 },
 placeholderCard: {
 borderRadius: 18,
 borderWidth: 1,
 borderColor: colors.border,
 backgroundColor: '#F0FDF4',
 padding: 18,
 gap: 6,
 },
 placeholderTitle: {
 fontSize: 18,
 fontWeight: '800',
 color: colors.text,
 textAlign: 'center',
 },
 placeholderText: {
 fontSize: 14,
 lineHeight: 20,
 color: colors.textMuted,
 textAlign: 'center',
 },
 errorText: {
 fontSize: 14,
 lineHeight: 20,
 color: '#DC2626',
 textAlign: 'center',
 },
 guestButton: {
 alignItems: 'center',
 paddingVertical: 8,
 marginTop: 4,
 },
 guestButtonText: {
 fontSize: 15,
 fontWeight: '700',
 color: colors.primary,
 },
});
