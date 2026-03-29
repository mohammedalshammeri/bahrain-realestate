import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView, InputAccessoryView, TouchableOpacity, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../src/components/Button';
import { useToast } from '../src/context/ToastContext';
import { useAuthStore } from '../src/store/authStore';
import { useIndividualAuthStore } from '../src/store/individualAuthStore';
import api from '../src/api/api';
import { textAlignStart } from '../src/utils/rtl';

export default function SubmitComplaint() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ companyId?: string | string[]; propertyId?: string | string[] }>();
  const normalizeParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const companyId = normalizeParam(params.companyId);
  const propertyId = normalizeParam(params.propertyId);
  const { showToast } = useToast();
  const { company, isAuthenticated: isCompanyAuth } = useAuthStore();
  const { user: individual, isAuthenticated: isIndividualAuth } = useIndividualAuthStore();
  const textAlign = textAlignStart();
  const writingDirection = 'auto' as const;
  
  const [loading, setLoading] = useState(false);
  
  // Refs for Auto-Focus
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const typeRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    complaintType: '',
  });

  // Pre-fill data based on user type
  React.useEffect(() => {
    if (isCompanyAuth && company) {
      setFormData(prev => ({
        ...prev,
        name: company.name || '',
        email: company.email || '',
        phone: company.phone || '',
      }));
    } else if (isIndividualAuth && individual) {
      setFormData(prev => ({
        ...prev,
        name: individual.fullName || '',
        email: individual.email || '',
        phone: individual.phone || '',
      }));
    }
  }, [isCompanyAuth, company, isIndividualAuth, individual]);

  const handleSubmit = async () => {
    const missingInfoMessage = t('complaints.validation.missingInfo') || 'هناك معلومات ناقصة';

    const missingRequired =
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim() ||
      (!isCompanyAuth && !formData.phone.trim());

    if (missingRequired) {
      showToast(missingInfoMessage, 'error');
      return;
    }

    // Enhanced validation
    if (!formData.name.trim()) {
      showToast(t('common.validation.nameRequired') || 'الاسم مطلوب', 'error');
      return;
    }
    
    if (!formData.email.trim()) {
      showToast(t('common.validation.emailRequired') || 'البريد الإلكتروني مطلوب', 'error');
      return;
    }
    
    if (!formData.message.trim()) {
      showToast(t('complaints.validation.messageRequired') || 'الرسالة مطلوبة', 'error');
      return;
    }
    
    if (formData.message.trim().length < 10) {
      showToast(t('complaints.validation.messageMinLength') || 'الرسالة يجب أن تكون 10 أحرف على الأقل', 'error');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showToast(t('common.validation.invalidEmail') || 'تنسيق البريد الإلكتروني غير صحيح', 'error');
      return;
    }

    // Phone validation for individuals
    if (!isCompanyAuth && (!formData.phone.trim())) {
      showToast(t('complaints.validation.phoneRequired') || 'رقم الهاتف مطلوب للأفراد', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Determine submitter type
      const submitterType = isCompanyAuth ? 'COMPANY' : 'INDIVIDUAL';
      
      const requestData: any = {
        submitterType,
        message: formData.message,
        companyId: companyId ? Number(companyId) : undefined,
        propertyId: propertyId && Number.isFinite(Number(propertyId)) ? Number(propertyId) : undefined,
      };

      console.log('[Complaint] params', { companyId, propertyId });
      console.log('[Complaint] payload', requestData);

      if (submitterType === 'COMPANY') {
        requestData.submitterCompanyId = company?.id;
        requestData.submitterCompanyName = formData.name;
        requestData.submitterCompanyEmail = formData.email;
        if (formData.phone.trim()) {
          requestData.submitterCompanyPhone = formData.phone;
        }
      } else {
        requestData.userName = formData.name;
        requestData.userEmail = formData.email;
        requestData.userPhone = formData.phone;
      }

      console.log('Sending complaint data:', requestData); // Debug log

      const response = await api.post('/public/complaints', requestData);

      if (response.data.success) {
        showToast(t('complaints.success') || 'تم إرسال الشكوى بنجاح', 'success');

        if (Platform.OS === 'web') {
          router.replace('/');
        } else {
          Alert.alert(
            t('complaints.submitted.title') || 'تم الإرسال',
            t('complaints.submitted.message') || 'تم إرسال شكواك بنجاح. سيتم مراجعتها من قبل الإدارة.',
            [{
              text: t('common.ok') || 'موافق',
              onPress: () => router.replace('/'),
            }]
          );
        }
        
        // Clear message only
        setFormData({
          ...formData,
          message: '',
          complaintType: '',
        });
      }
    } catch (error: any) {
      console.error('Complaint submission error:', error.response?.data || error.message);
      
      let errorMessage = t('complaints.error') || 'فشل في إرسال الشكوى';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 80}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign }]}>
          {companyId
            ? (t('complaints.companyTitle') || 'تقديم شكوى')
            : (t('complaints.generalTitle') || 'تقديم شكوى عامة')}
        </Text>
        
        <Text style={[styles.description, { textAlign }]}>
          {companyId
            ? (t('complaints.companyDescription') || 'يمكن لكم تقديم شكوى ضد الشركة . سيتم مراجعة الشكوى من قبل الإدارة')
            : (t('complaints.generalDescription') || 'يمكنك تقديم شكوى أو ملاحظة عامة. سيتم مراجعة شكواك من قبل الإدارة.')}
        </Text>

        <Text style={[styles.label, { textAlign }]}>
          {isCompanyAuth ? (t('complaints.companyName') || 'اسم الشركة') : (t('complaints.userName') || 'الاسم الكامل')} *
        </Text>
        <TextInput
          ref={nameRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          placeholder={isCompanyAuth ? (t('complaints.companyNamePlaceholder') || 'اسم شركتكم') : (t('complaints.userNamePlaceholder') || 'اكتب اسمك الكامل')}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.email') || 'البريد الإلكتروني'} *
        </Text>
        <TextInput
          ref={emailRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          placeholder={t('complaints.emailPlaceholder') || 'example@email.com'}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.phone') || 'رقم الهاتف'}{!isCompanyAuth ? ' *' : ' (اختياري)'}
        </Text>
        <TextInput
          ref={phoneRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          placeholder={t('complaints.phonePlaceholder') || '+973 xxxxxxxx'}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          returnKeyType="next"
          onSubmitEditing={() => typeRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.complaintType') || 'نوع الشكوى (اختياري)'}
        </Text>
        <TextInput
          ref={typeRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          placeholder={t('complaints.complaintTypePlaceholder') || 'مثال: خدمة العملاء، جودة الخدمة، أخرى'}
          value={formData.complaintType}
          onChangeText={(text) => setFormData({ ...formData, complaintType: text })}
          returnKeyType="next"
          onSubmitEditing={() => messageRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>
          {t('complaints.message') || 'تفاصيل الشكوى'} *
        </Text>
        <TextInput
          ref={messageRef}
          style={[styles.input, styles.textArea, { textAlign: 'auto', writingDirection }]}
          placeholder={t('complaints.generalMessagePlaceholder') || 'اكتب تفاصيل شكواك أو ملاحظتك هنا...'}
          value={formData.message}
          onChangeText={(text) => setFormData({ ...formData, message: text })}
          multiline
          numberOfLines={6}
          inputAccessoryViewID="messageDone"
        />
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="messageDone">
             <View style={{ backgroundColor: '#f0f0f0', padding: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#ddd' }}>
               <TouchableOpacity onPress={() => Keyboard.dismiss()}>
                 <Text style={{ color: '#007AFF', fontWeight: 'bold', fontSize: 16 }}>{t('common.done') || 'Done'}</Text>
               </TouchableOpacity>
             </View>
          </InputAccessoryView>
        )}

        <Text style={[styles.note, { textAlign }]}>
          {t('complaints.generalNote') || '* سيتم إشعارك بحالة الشكوى عبر البريد الإلكتروني المقدم'}
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
  companySelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
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
});