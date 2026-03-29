import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../src/api/api';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/Button';
import { useToast } from '../src/context/ToastContext';

export default function CompanyLoginScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast(t('auth.validation.required'), 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<any>('/auth/login', {
        email,
        password,
      });

      console.log('Login response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        const { token, employee } = response.data.data;
        
        if (!employee || !employee.company) {
          console.error('Invalid employee data:', employee);
          showToast('Invalid server response', 'error');
          return;
        }

        // Map employee data to CompanyProfile structure
        const company = {
          id: employee.company.id,
          name: employee.company.name,
          email: employee.email,
          phone: employee.phone || '',
          status: employee.company.status,
          role: employee.role // 'company_owner' | 'company_employee'
        };
        
        if (company.status === 'blocked' || company.status === 'rejected') {
          showToast(t('auth.accountBlocked'), 'error');
          return;
        }

        if (company.status === 'pending') {
          showToast(t('auth.accountPending'), 'warning');
          return;
        }

        await login(token, company);
        showToast(t('auth.loginSuccess'), 'success');
        router.replace('/company');
      } else {
        // Use localized message instead of raw backend English text
        showToast(t('auth.invalidCredentials') || t('auth.loginFailed'), 'error');
      }
    } catch (err: any) {
      console.error(err);
      // Also use localized message on exception (e.g. 401, network)
      showToast(t('auth.invalidCredentials') || t('auth.loginFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: t('auth.companyLoginTitle') }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{t('auth.companyLoginTitle')}</Text>
          
          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button 
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <Link href="/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotButtonText}>{t('auth.forgotPassword') || 'Forgot password?'}</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity onPress={() => router.push('/company/register')} style={styles.registerButton}>
              <Text style={styles.registerButtonText}>{t('auth.registerLink')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>{t('common.back') || 'Back'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#00305D',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#00305D',
    textAlign: 'auto',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'auto',
    writingDirection: 'auto',
  },
  button: {
    marginTop: 10,
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#00305D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotButtonText: {
    color: '#00305D',
    fontSize: 14,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#C6A55E',
    fontSize: 16,
  },
});
