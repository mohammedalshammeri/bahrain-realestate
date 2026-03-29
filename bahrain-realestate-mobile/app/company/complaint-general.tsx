import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/api/api';

export default function GeneralCompanyComplaint() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const { company } = useAuthStore();

  const textAlign = 'auto' as const;
  const writingDirection = 'auto' as const;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    submitterCompanyName: company?.name || '',
    submitterCompanyEmail: company?.email || '',
    submitterCompanyPhone: company?.phone || '',
    message: '',
  });

  useEffect(() => {
    if (company) {
      setFormData(prev => ({
        ...prev,
        submitterCompanyName: company.name || '',
        submitterCompanyEmail: company.email || '',
        submitterCompanyPhone: company.phone || '',
      }));
    }
  }, [company]);

  const handleSubmit = async () => {
    if (!formData.submitterCompanyName.trim() || !formData.submitterCompanyEmail.trim() || !formData.message.trim()) {
      showToast(t('complaints.validation.companyRequired') || 'اسم الشركة والبريد والرسالة مطلوبان', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/public/complaints', {
        submitterType: 'COMPANY',
        submitterCompanyId: company?.id,
        submitterCompanyName: formData.submitterCompanyName,
        submitterCompanyEmail: formData.submitterCompanyEmail,
        submitterCompanyPhone: formData.submitterCompanyPhone || undefined,
        message: formData.message,
        // companyId is null for general complaints
      });

      if (response.data.success) {
        showToast(t('complaints.success') || 'تم إرسال الشكوى بنجاح', 'success');
        
        Alert.alert(
          t('complaints.submitted.title') || 'تم الإرسال',
          t('complaints.submitted.message') || 'تم إرسال شكواك بنجاح. سيتم مراجعتها من قبل الإدارة.',
          [{ 
            text: t('common.ok') || 'موافق', 
            onPress: () => router.back() 
          }]
        );
        
        setFormData(prev => ({ ...prev, message: '' }));
      }
    } catch (error: any) {
      console.error(error);
      showToast(
        error.response?.data?.message || t('complaints.error') || 'فشل في إرسال الشكوى', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign }]}>
          {t('complaints.generalTitle') || 'شكوى عامة / اقتراح'}
        </Text>
        
        <Text style={[styles.description, { textAlign }]}>
          {t('complaints.generalDescription') || 'يمكنكم إرسال شكوى عامة أو اقتراح لإدارة التطبيق مباشرة.'}
        </Text>

        <Text style={[styles.sectionTitle, { textAlign }]}>
          {t('complaints.submitterInfo') || 'بيانات الشركة المُقدمة للشكوى'}
        </Text>

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.companyName') || 'اسم الشركة'} *
        </Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('complaints.companyNamePlaceholder') || 'اسم شركتكم'}
          value={formData.submitterCompanyName}
          onChangeText={(text) => setFormData({ ...formData, submitterCompanyName: text })}
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.companyEmail') || 'بريد الشركة الإلكتروني'} *
        </Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('complaints.companyEmailPlaceholder') || 'company@example.com'}
          value={formData.submitterCompanyEmail}
          onChangeText={(text) => setFormData({ ...formData, submitterCompanyEmail: text })}
          keyboardType="email-address"
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.companyPhone') || 'هاتف الشركة (اختياري)'}
        </Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('complaints.companyPhonePlaceholder') || '+973 xxxxxxxx'}
          value={formData.submitterCompanyPhone}
          onChangeText={(text) => setFormData({ ...formData, submitterCompanyPhone: text })}
          keyboardType="phone-pad"
        />

        <View style={styles.divider} />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.details') || 'تفاصيل الشكوى / الاقتراح'} *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, { textAlign, writingDirection }]}
          placeholder={t('complaints.companyGeneralMessagePlaceholder') || 'اكتب تفاصيل الشكوى أو الاقتراح هنا...'}
          value={formData.message}
          onChangeText={(text) => setFormData({ ...formData, message: text })}
          multiline
          numberOfLines={6}
        />

        <Text style={[styles.note, { textAlign }]}>
          {t('complaints.companyNote') || '* سيتم إشعاركم بحالة الشكوى عبر بريد الشركة الإلكتروني'}
        </Text>

        <Button
          title={t('complaints.submit') || 'إرسال الشكوى'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#C6A55E',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 15,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  note: {
    fontSize: 12,
    color: '#D1232A',
    marginTop: 15,
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 30,
    marginBottom: 50,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
});
