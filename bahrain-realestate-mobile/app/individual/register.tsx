import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useIndividualAuthStore } from '../../src/store/individualAuthStore';
import { ApiResponse, IndividualUser } from '../../src/types/individual';

type RegisterResponse = ApiResponse<{ user: IndividualUser; token: string }>;

export default function IndividualRegisterScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const login = useIndividualAuthStore((s) => s.login);

  // Refs for Auto-Focus
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      showToast(t('individual.emailOrPhoneRequired') || 'Email or phone is required', 'error');
      return;
    }

    if (!password) {
      showToast(t('auth.validation.required') || 'Required', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast(t('individual.passwordMismatch') || 'Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>('/auth/individual/register', {
        fullName: fullName.trim() || undefined,
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined,
        password,
      });

      if (res.data.success) {
        await login(res.data.data.token, res.data.data.user);
        showToast(t('individual.registerSuccess') || 'Account created', 'success');
        router.replace('/individual');
      } else {
        // Handle common error messages with translations
        const msg = res.data.message?.toLowerCase() || '';
        if (msg.includes('email') && (msg.includes('exist') || msg.includes('used') || msg.includes('register'))) {
          showToast(t('auth.emailExists'), 'error');
        } else {
          showToast(t('common.error'), 'error');
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message?.toLowerCase() || '';
      // Check for specific error messages to translate
      const isEmailOrUserError = 
        msg.includes('email') || msg.includes('phone') || 
        msg.includes('exist') || msg.includes('used') || msg.includes('register') ||
        msg.includes('موجود') || msg.includes('مستخدم');

      if (isEmailOrUserError) {
        showToast(t('auth.emailExists'), 'error');
      } else {
        // If no specific translation found, show the server message if available
        showToast(e?.response?.data?.message || t('common.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('individual.registerTitle') || 'Individual Registration'}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('individual.fullName') || 'Full name'}</Text>
            <TextInput
              ref={fullNameRef}
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('individual.fullNamePlaceholder') || 'Enter your name'}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={styles.label}>{t('auth.email') || 'Email'}</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t('individual.emailPlaceholder') || 'Enter email (optional)'}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={styles.label}>{t('auth.phone') || 'Phone Number'}</Text>
            <TextInput
              ref={phoneRef}
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={t('individual.phonePlaceholder') || 'Enter phone (optional)'}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={styles.label}>{t('auth.password') || 'Password'}</Text>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t('auth.passwordPlaceholder') || 'Enter password'}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={styles.label}>{t('auth.confirmPassword') || 'Confirm Password'}</Text>
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder={t('individual.confirmPasswordPlaceholder') || 'Confirm password'}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <Button
              title={t('individual.registerButton') || 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity onPress={() => router.push('/individual/login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>{t('individual.haveAccountLogin') || 'Already have an account? Login'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#00305D' },
  form: { width: '100%' },
  label: { fontSize: 16, marginBottom: 8, color: '#00305D', textAlign: 'auto' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, textAlign: 'auto', writingDirection: 'auto' },
  button: { marginTop: 10 },
  loginLink: { marginTop: 16, alignItems: 'center' },
  loginLinkText: { color: '#00305D', fontWeight: '600' },
});
