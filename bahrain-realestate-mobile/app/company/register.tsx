import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image as RNImage, Alert, Switch, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';

export default function CompanyRegister() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [crImage, setCrImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Refs for Auto-Focus
  const nameRef = useRef<TextInput>(null);
  const crNumberRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const employeesRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    crNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    employeesLimit: '5',
    acceptTerms: false,
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setCrImage(result.assets[0]);
      }
    } catch (error) {
      console.error('ImagePicker Error:', error);
      Alert.alert(t('common.error'), 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.crNumber || !formData.email || !formData.phone || !formData.password) {
      showToast(t('addProperty.validation.required'), 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast(t('auth.passwordMismatch') || 'Passwords do not match', 'error');
      return;
    }

    if (!formData.acceptTerms) {
      showToast(t('auth.acceptTermsRequired') || 'Please accept terms', 'error');
      return;
    }

    setLoading(true);

    try {
      // إعداد البيانات بما يتوافق مع أسماء الحقول التي يتوقعها السيرفر (registerCompanyWithOwner)
      // companyName, companyEmail, companyPhone, crNumber, ownerName, ownerEmail, ownerPhone, password
      
      const registerData = new FormData();
      
      // بيانات الشركة
      registerData.append('companyName', formData.name);
      registerData.append('companyEmail', formData.email);
      registerData.append('companyPhone', formData.phone);
      registerData.append('crNumber', formData.crNumber);
      
      // بيانات المالك (نستخدم نفس البيانات حالياً لأن الفورم مبسط)
      registerData.append('ownerName', formData.name); 
      registerData.append('ownerEmail', formData.email);
      registerData.append('ownerPhone', formData.phone);
      
      // كلمة المرور
      registerData.append('password', formData.password);
      // registerData.append('employeesLimit', formData.employeesLimit); // هذا الحقل غير مطلوب في الدالة الجديدة حالياً

      // نرسل صورة السجل التجاري فقط إذا اختارها المستخدم (اختياري)
      if (crImage) {
        // @ts-ignore
        registerData.append('crImage', {
          uri: Platform.OS === 'android' ? crImage.uri : crImage.uri.replace('file://', ''),
          type: 'image/jpeg',
          name: 'cr.jpg',
        } as any);
      }

      // Changed from /auth/company/register to /auth/register to match the updated backend routes
      const response = await api.post('/auth/register', registerData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data, headers) => {
          return data; // Prevent Axios from stringifying FormData
        },
      });
      
      if (response.data.success) {
        Alert.alert(
          t('common.success'),
          t('auth.registerSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.replace('/'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration Error:', error);

      const rawMessage = error?.response?.data?.message || '';
      const msg = rawMessage.toLowerCase();

      // Detect specific server messages
      const isCompanyNameError =
        rawMessage.includes('اسم الشركة') ||
        msg.includes('company name');

      // الشركة موجودة بالفعل (إيميل أو سجل تجاري) - نعرض رسالة السيرفر كما هي
      const isCompanyAlreadyError =
        rawMessage.includes('الشركة موجودة بالفعل') ||
        msg.includes('company already exists');

      // خطأ إيميل مستخدم: نعتمد على وجود كلمة email أو "البريد الإلكتروني" تحديداً
      const isEmailOrUserError =
        msg.includes('email') ||
        rawMessage.includes('البريد الإلكتروني') ||
        rawMessage.includes('البريد الالكتروني');

      const isRequiredError =
        msg.includes('required') ||
        msg.includes('missing') ||
        msg.includes('مطلوب');

      if (isCompanyNameError || isCompanyAlreadyError) {
        // For duplicate company name or existing company (email/CR), show the exact backend message
        showToast(rawMessage, 'error');
      } else if (isEmailOrUserError) {
        showToast(t('auth.emailExists'), 'error');
      } else if (isRequiredError) {
        showToast(t('addProperty.validation.required'), 'error');
      } else {
        // If we can't map it, show the actual server message (it might be in Arabic already)
        // instead of a generic "An error occurred" which hides the cause.
        showToast(rawMessage || t('common.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const flexDirection = rowDirection();
  const textAlign = textAlignStart();
  const writingDirection = 'auto' as const;
  
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
      <View style={styles.form}>
        <Text style={[styles.label, { textAlign }]}>{t('auth.companyName')} *</Text>
        <TextInput
          ref={nameRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          returnKeyType="next"
          onSubmitEditing={() => crNumberRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>{t('auth.crNumber')} *</Text>
        <TextInput
          ref={crNumberRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          value={formData.crNumber}
          onChangeText={(text) => setFormData({...formData, crNumber: text})}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>{t('auth.crImageOptional')}</Text>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {crImage ? (
            <RNImage source={{ uri: crImage.uri }} style={styles.previewImage} />
          ) : (
            <Text style={styles.uploadText}>{t('addProperty.addImage')}</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.label, { textAlign }]}>{t('auth.email')} *</Text>
        <TextInput
          ref={emailRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>{t('auth.phone')} *</Text>
        <TextInput
          ref={phoneRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          returnKeyType="next"
          onSubmitEditing={() => employeesRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>{t('company.employeesLimit') || 'Number of Employees'} *</Text>
        <TextInput
          ref={employeesRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          keyboardType="numeric"
          value={formData.employeesLimit}
          onChangeText={(text) => setFormData({...formData, employeesLimit: text})}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>{t('auth.password')} *</Text>
        <TextInput
          ref={passwordRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <Text style={[styles.label, { textAlign }]}>{t('auth.confirmPassword')} *</Text>
        <TextInput
          ref={confirmPasswordRef}
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <View style={[styles.termsContainer, { flexDirection }]}>
          <Switch
            value={formData.acceptTerms}
            onValueChange={(val) => setFormData({...formData, acceptTerms: val})}
          />
          <Text style={[styles.termsText, { marginStart: 10 }]}>{t('auth.acceptTerms')}</Text>
        </View>

        <Button 
          title={t('auth.registerButton')}
          onPress={handleSubmit}
          loading={loading}
          variant="primary"
          style={styles.submitButton}
        />
        
        <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 20 }}>
            <Text style={{ textAlign: 'center', color: '#3498db' }}>{t('auth.loginTitle')}</Text>
        </TouchableOpacity>
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  imageUpload: {
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  uploadText: {
    color: '#3498db',
    fontSize: 16,
  },
  termsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#34495e',
  },
  submitButton: {
    marginTop: 30,
    marginBottom: 50,
  },
});
