import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/store/authStore';
import { CompanyProfile } from '../../src/types/auth';

// Adjust types as needed
export default function CompanyLoginScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const login = useAuthStore((s) => s.login);

  // Refs for Auto-Focus
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goHome = () => {
    router.replace('/');
  };

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      showToast(t('auth.validation.required') || 'Required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/company/login', { emailOrPhone, password });
      if (res.data.success) {
        await login(res.data.data.token, res.data.data.company);
        showToast(t('auth.loginSuccess') || 'Logged in', 'success');
        router.replace('/company');
      } else {
        // Always use localized message instead of raw backend text
        showToast(t('auth.invalidCredentials') || t('auth.loginFailed') || 'Login failed', 'error');
      }
    } catch (e: any) {
      // Network or server error: also show localized generic invalid/failed message
      showToast(t('auth.invalidCredentials') || t('auth.loginFailed') || 'Invalid credentials', 'error');
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('auth.companyLoginTitle') || 'Company Login'}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.emailOrPhone') || 'Email or Phone'}</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              placeholder={t('auth.emailOrPhonePlaceholder') || 'Enter email or phone'}
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Button title={t('auth.loginButton') || 'Login'} onPress={handleLogin} loading={loading} style={styles.button} />
            <TouchableOpacity onPress={goHome} style={styles.backLinkContainer}>
              <Text style={[styles.backLink, { textAlign: 'center' }]}>{t('auth.backToHome') || 'Back to Home'}</Text>
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
  backLinkContainer: { marginTop: 16 },
  backLink: { color: '#00305D', fontSize: 14 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#00305D' },
  form: { width: '100%' },
  label: { fontSize: 16, marginBottom: 8, color: '#00305D', textAlign: 'auto' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16, textAlign: 'auto', writingDirection: 'auto' },
  button: { marginTop: 10 },
});
