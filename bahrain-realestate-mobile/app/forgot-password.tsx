import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../src/api/api';
import { Button } from '../src/components/Button';
import { useToast } from '../src/context/ToastContext';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) {
      showToast(t('auth.validation.required') || 'Required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        // Use client-side translation to ensure the message matches the selected language
        showToast(t('auth.resetPasswordSuccess'), 'success');
      } else {
        showToast(t('common.error'), 'error');
      }
    } catch (e: any) {
      showToast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('auth.resetPasswordTitle') || 'Reset Password'}</Text>
          <Text style={styles.subtitle}>{t('auth.resetPasswordSubtitleCompany') || 'Enter your company email to receive reset instructions.'}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.email') || 'Email'}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t('auth.emailPlaceholder') || 'company@example.com'}
            />

            <Button
              title={t('auth.resetPasswordSend') || 'Send reset link'}
              onPress={submit}
              loading={loading}
              style={styles.button}
            />

            <Button
              title={t('auth.resetPasswordHaveCode') || 'I have a code'}
              onPress={() => router.push('/reset-password')}
              variant="secondary"
              style={styles.secondaryButton}
            />

            <Button
              title={t('auth.resetPasswordBack') || 'Back to login'}
              onPress={() => router.replace('/login')}
              variant="secondary"
              style={styles.secondaryButton}
            />
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#00305D' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#C6A55E', marginBottom: 20 },
  form: { width: '100%' },
  label: { fontSize: 16, marginBottom: 8, color: '#00305D', textAlign: 'auto' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16, textAlign: 'auto', writingDirection: 'auto' },
  button: { marginTop: 10 },
  secondaryButton: { marginTop: 10 },
});
