import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('legal.termsAndConditions')}</Text>
        <Text style={styles.updated}>{t('legal.lastUpdated')}</Text>

        <Section title={t('legal.introTitle')} body={t('legal.termsIntro')} />
        <Section title={t('legal.useOfServiceTitle')} body={t('legal.useOfServiceBody')} />
        <Section title={t('legal.listingRulesTitle')} body={t('legal.listingRulesBody')} />
        <Section title={t('legal.paymentsTitle')} body={t('legal.paymentsBody')} />
        <Section title={t('legal.liabilityTitle')} body={t('legal.liabilityBody')} />
        <Section title={t('legal.governingLawTitle')} body={t('legal.governingLawBody')} />
        <Section title={t('legal.contactTitle')} body={t('legal.contactBody')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#00305D', marginBottom: 8, textAlign: 'center' },
  updated: { fontSize: 13, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  section: { marginBottom: 20, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'left' },
  sectionBody: { fontSize: 15, lineHeight: 24, color: '#374151', textAlign: 'left' },
});
