import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';

export default function IndividualResetPasswordScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!code || !newPassword || !confirmPassword) {
      showToast(t('auth.validation.required') || 'Required', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t('auth.passwordMismatch') || 'Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/individual/reset-password', { token: code, newPassword });
      if (res.data?.success) {
        showToast(res.data?.message || t('auth.resetPasswordSuccessFinal') || 'Password updated.', 'success');
        router.replace('/individual/login');
      } else {
        showToast(res.data?.message || t('common.error') || 'Error', 'error');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || t('common.error') || 'Error', 'error');
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
          <Text style={styles.subtitle}>{t('auth.resetPasswordCodeHint') || 'Enter the code you received by email.'}</Text>

          <Text style={styles.label}>{t('auth.resetPasswordCode') || 'Reset code'}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            placeholder={t('auth.resetPasswordCodePlaceholder') || 'Enter code'}
          />

          <Text style={styles.label}>{t('auth.newPassword') || 'New password'}</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder={t('auth.newPasswordPlaceholder') || 'New password'}
          />

          <Text style={styles.label}>{t('auth.confirmPassword') || 'Confirm Password'}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder={t('auth.confirmPasswordPlaceholder') || 'Confirm password'}
          />

          <Button title={t('auth.resetPasswordConfirm') || 'Reset password'} onPress={submit} loading={loading} style={styles.button} />

          <Button
            title={t('auth.resetPasswordBack') || 'Back to login'}
            onPress={() => router.replace('/individual/login')}
            variant="secondary"
            style={styles.secondaryButton}
          />
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
  label: { fontSize: 16, marginBottom: 8, color: '#00305D', textAlign: 'auto' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16, textAlign: 'auto', writingDirection: 'auto' },
  button: { marginTop: 10 },
  secondaryButton: { marginTop: 10 },
});
