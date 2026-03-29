import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';

export default function IndividualForgotPasswordScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!emailOrPhone) {
      showToast(t('auth.validation.required') || 'Required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/individual/forgot-password', { emailOrPhone });
      if (res.data?.success) {
        // Use client-side translation to ensure the message matches the selected language
        showToast(t('auth.resetPasswordSuccess'), 'success');
      } else {
        // Fallback to generic error if success is false but no error thrown
        showToast(t('common.error'), 'error');
      }
    } catch (e: any) {
      // Prefer generic translated error to avoid English backend messages
      showToast(t('common.error'), 'error');
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
          <Text style={styles.title}>{t('auth.resetPasswordTitle') || 'Reset Password'}</Text>
          <Text style={styles.subtitle}>{t('auth.resetPasswordSubtitleIndividual') || 'Enter your email or phone to receive reset instructions.'}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.emailOrPhone') || 'Email or Phone'}</Text>
            <TextInput
              style={styles.input}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              placeholder={t('auth.emailOrPhonePlaceholder') || 'Enter email or phone'}
            />

            <Button
              title={t('auth.resetPasswordSend') || 'Send reset link'}
              onPress={submit}
              loading={loading}
              style={styles.button}
            />

            <Button
              title={t('auth.resetPasswordHaveCode') || 'I have a code'}
              onPress={() => router.push('/individual/reset-password')}
              variant="secondary"
              style={styles.secondaryButton}
            />

            <Button
              title={t('auth.resetPasswordBack') || 'Back to login'}
              onPress={() => router.replace('/individual/login')}
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
