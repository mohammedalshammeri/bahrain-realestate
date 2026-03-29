import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useIndividualAuthStore } from '../../src/store/individualAuthStore';
import { ApiResponse, IndividualUser } from '../../src/types/individual';

type LoginResponse = ApiResponse<{ user: IndividualUser; token: string }>;

export default function IndividualLoginScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const login = useIndividualAuthStore((s) => s.login);

  // Refs for Auto-Focus
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // لا تقم بأي توجيه تلقائي عند الخطأ، فقط عند النجاح
  const goHome = () => {
    // يمكن للمستخدم العودة يدويًا فقط
    router.replace('/');
  };

  const handleLogin = async () => {
    const normalized = emailOrPhone.trim();
    if (!normalized || !password) {
      showToast(t('auth.validation.required') || 'Required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/individual/login', { emailOrPhone: normalized, password });
      if (res.data.success) {
        await login(res.data.data.token, res.data.data.user);
        showToast(t('auth.loginSuccess') || 'Logged in', 'success');
        router.replace('/individual');
      } else {
        // فقط رسالة خطأ، لا يوجد أي توجيه
        showToast(t('auth.loginFailed'), 'error');
      }
    } catch (e: any) {
      // فقط رسالة خطأ، لا يوجد أي توجيه
      showToast(t('auth.invalidCredentials'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* debug banner removed */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('individual.loginTitle') || 'Individual Login'}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('individual.emailOrPhone') || 'Email or Phone'}</Text>
            <TextInput
              ref={emailRef}
              style={styles.input}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              placeholder={t('individual.emailOrPhonePlaceholder') || 'Enter email or phone'}
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

            <Link href="/individual/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotLinkContainer}>
                <Text style={[styles.forgotLink, { textAlign: 'center' }]}>{t('auth.forgotPassword') || 'Forgot password?'}</Text>
              </TouchableOpacity>
            </Link>
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
  forgotLinkContainer: { marginTop: 12 },
  forgotLink: { color: '#00305D', fontSize: 14 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#00305D' },
  form: { width: '100%' },
  label: { fontSize: 16, marginBottom: 8, color: '#00305D', textAlign: 'auto' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16, textAlign: 'auto', writingDirection: 'auto' },
  button: { marginTop: 10 },
});
