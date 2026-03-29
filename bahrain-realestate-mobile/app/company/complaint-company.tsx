import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/api/api';

interface Company {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default function CompanyComplaint() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const { company } = useAuthStore();

  const textAlign = 'auto' as const;
  const writingDirection = 'auto' as const;
  
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [formData, setFormData] = useState({
    submitterCompanyName: company?.name || '',
    submitterCompanyEmail: company?.email || '',
    submitterCompanyPhone: company?.phone || '',
    message: '',
    companyId: '',
    companyName: '',
  });

  useEffect(() => {
    loadCompanies();
    if (company) {
      setFormData(prev => ({
        ...prev,
        submitterCompanyName: company.name || '',
        submitterCompanyEmail: company.email || '',
        submitterCompanyPhone: company.phone || '',
      }));
    }
  }, [company]);

  const loadCompanies = async () => {
    try {
      const response = await api.get('/public/companies');
      if (response.data.success) {
        // Filter out the current company from the list
        const filteredCompanies = response.data.companies.filter(
          (comp: Company) => comp.id !== company?.id
        );
        setCompanies(filteredCompanies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleCompanySelect = (company: Company) => {
    setFormData({
      ...formData,
      companyId: company.id.toString(),
      companyName: company.name,
    });
    setShowCompanyModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.submitterCompanyName.trim() || !formData.submitterCompanyEmail.trim() || !formData.message.trim()) {
      showToast(t('complaints.validation.companyRequired') || 'اسم الشركة والبريد والرسالة مطلوبان', 'error');
      return;
    }

    if (!formData.companyId) {
      showToast(t('complaints.validation.companyRequired') || 'يجب تحديد الشركة المشكو عليها', 'error');
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
        companyId: parseInt(formData.companyId),
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
        
        // Clear message only
        setFormData({
          ...formData,
          message: '',
          companyId: '',
          companyName: '',
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
          {t('complaints.companyTitle') || 'شكوى من شركة'}
        </Text>
        
        <Text style={[styles.description, { textAlign }]}>
          {t('complaints.companyDescription') || 'يمكن لشركتكم تقديم شكوى ضد شركة عقارية أخرى. سيتم مراجعة الشكوى من قبل الإدارة.'}
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

        <Text style={[styles.sectionTitle, { textAlign }]}>
          {t('complaints.targetCompany') || 'الشركة المشكو عليها'}
        </Text>

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.company') || 'الشركة المشكو عليها'} *
        </Text>
        <TouchableOpacity
          style={styles.companySelector}
          onPress={() => setShowCompanyModal(true)}
        >
          <Text style={[
            styles.companySelectorText,
            !formData.companyName && styles.placeholder,
            { textAlign },
          ]}>
            {formData.companyName || (t('complaints.selectCompany') || 'اختر الشركة')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.details') || 'تفاصيل الشكوى'} *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, { textAlign, writingDirection }]}
          placeholder={t('complaints.companyMessagePlaceholder') || 'اكتب تفاصيل شكواك ضد الشركة هنا...'}
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

      {/* Company Selection Modal */}
      <Modal
        visible={showCompanyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompanyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('complaints.selectCompany') || 'اختر الشركة'}
            </Text>
            
            <ScrollView style={styles.companiesList}>
              {companies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyItem}
                  onPress={() => handleCompanySelect(company)}
                >
                  <Text style={[styles.companyName, { textAlign }]}>
                    {company.name}
                  </Text>
                  <Text style={[styles.companyEmail, { textAlign }]}>
                    {company.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCompanyModal(false)}
            >
              <Text style={styles.closeButtonText}>
                {t('common.cancel') || 'إلغاء'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  companySelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  companySelectorText: {
    fontSize: 16,
    color: '#00305D',
  },
  placeholder: {
    color: '#C6A55E',
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 15,
    textAlign: 'center',
  },
  companiesList: {
    maxHeight: 300,
  },
  companyItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 5,
  },
  companyEmail: {
    fontSize: 14,
    color: '#C6A55E',
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#C6A55E',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});