import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.selectAccountType', { defaultValue: 'Select Account Type' })}</Text>
        <Text style={styles.subtitle}>{t('auth.selectAccountTypeDesc', { defaultValue: 'Please choose how you want to login' })}</Text>
        
        <View style={styles.buttonsContainer}>
          <View>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => router.replace('/individual/login')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#e8f4fd' }]}>
                <Ionicons name="person" size={32} color="#00305D" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{t('auth.loginAsIndividual', { defaultValue: 'Individual Login' })}</Text>
                <Text style={styles.cardSubtitle}>{t('auth.individualDesc', { defaultValue: 'For property seekers' })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C6A55E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerLink} onPress={() => router.replace('/individual/register')}>
              <Text style={styles.registerText}>{t('auth.registerLink', { defaultValue: "Don't have an account? Register here" })}</Text>
            </TouchableOpacity>
          </View>

          <View>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => router.replace('/company-login')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#fef5e7' }]}>
                <Ionicons name="business" size={32} color="#C6A55E" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{t('auth.loginAsCompany', { defaultValue: 'Company Login' })}</Text>
                <Text style={styles.cardSubtitle}>{t('auth.companyDesc', { defaultValue: 'For real estate companies' })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C6A55E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerLink} onPress={() => router.replace('/company/register')}>
              <Text style={styles.registerText}>{t('auth.registerLink', { defaultValue: "Don't have an account? Register here" })}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
             <Text style={styles.backButtonText}>{t('auth.backToHome')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#C6A55E',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 8,
  },
  registerLink: {
    alignItems: 'center',
    padding: 8,
  },
  registerText: {
    color: '#00305D',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#C6A55E',
  },
  backButton: {
    marginTop: 40,
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    color: '#C6A55E',
    fontSize: 16,
    fontWeight: '500',
  },
});
