import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import api from '../../src/api/api';

export default function SubmitComplaint() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const { companyId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [formData, setFormData] = useState({
    userPhone: '',
    userEmail: '',
    message: '',
  });

  const textAlign: 'auto' | 'left' | 'right' = 'auto';
  const writingDirection: 'auto' | 'ltr' | 'rtl' = 'auto';

  // Load company name if ID is provided
  useEffect(() => {
    if (companyId) {
      loadCompanyName();
    }
  }, [companyId]);

  const loadCompanyName = async () => {
    try {
      const response = await api.get(`/public/companies/${companyId}`);
      if (response.data.success) {
        setCompanyName(response.data.company.name);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.userPhone.trim() || !formData.message.trim()) {
      showToast(t('complaints.validation.required') || 'الهاتف والرسالة مطلوبان', 'error');
      return;
    }

    if (!companyId) {
      showToast(t('complaints.validation.companyRequired') || 'يجب تحديد الشركة', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/public/complaints', {
        submitterType: 'INDIVIDUAL',
        userPhone: formData.userPhone,
        userEmail: formData.userEmail || undefined,
        message: formData.message,
        companyId: parseInt(companyId as string),
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
        
        // Clear form
        setFormData({
          userPhone: '',
          userEmail: '',
          message: '',
        });
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign }]}>
          {t('complaints.title') || 'تقديم شكوى'}
        </Text>
        
        <Text style={[styles.description, { textAlign }]}>
          {t('complaints.description') || 'يمكنك تقديم شكوى ضد أي شركة عقارية. سيتم مراجعة شكواك من قبل الإدارة.'}
        </Text>

        {companyName ? (
          <View style={styles.companyInfo}>
            <Text style={[styles.label, { textAlign }]}>
              {t('complaints.company') || 'الشركة المشكو عليها'}
            </Text>
            <Text style={[styles.companyNameText, { textAlign }]}>
              {companyName}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.userPhone') || 'رقم الهاتف'} *
        </Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('complaints.userPhonePlaceholder') || '+973 xxxxxxxx'}
          value={formData.userPhone}
          onChangeText={(text) => setFormData({ ...formData, userPhone: text })}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.userEmail') || 'البريد الإلكتروني (اختياري)'}
        </Text>
        <TextInput
          style={[styles.input, { textAlign, writingDirection }]}
          placeholder={t('complaints.userEmailPlaceholder') || 'example@email.com'}
          value={formData.userEmail}
          onChangeText={(text) => setFormData({ ...formData, userEmail: text })}
          keyboardType="email-address"
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.message') || 'نص الشكوى'} *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, { textAlign, writingDirection }]}
          placeholder={t('complaints.messagePlaceholder') || 'اكتب تفاصيل شكواك هنا...'}
          value={formData.message}
          onChangeText={(text) => setFormData({ ...formData, message: text })}
          multiline
          numberOfLines={6}
        />

        <Text style={[styles.note, { textAlign }]}>
          {t('complaints.note') || '* سيتم إشعارك بحالة الشكوى عبر رقم الهاتف المقدم'}
        </Text>

        <Button
          title={t('complaints.submit') || 'إرسال الشكوى'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
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
    marginBottom: 30,
    lineHeight: 20,
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
  companyInfo: {
    padding: 15,
    backgroundColor: '#E6DFCC',
    borderRadius: 8,
    marginBottom: 20,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
    marginTop: 5,
  },
});