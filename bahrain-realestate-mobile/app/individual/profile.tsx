import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import api from '../../src/api/api';
import { Button } from '../../src/components/Button';
import { useToast } from '../../src/context/ToastContext';
import { useIndividualAuthStore } from '../../src/store/individualAuthStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { rowDirection } from '../../src/utils/rtl';
import { ApiResponse, IndividualUser } from '../../src/types/individual';

type MeResponse = ApiResponse<IndividualUser>;

export default function IndividualProfileScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguageStore();

  const user = useIndividualAuthStore((s) => s.user);
  const setUser = useIndividualAuthStore((s) => s.setUser);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  
  // Account Deletion State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const textAlign = 'auto' as const;
  const writingDirection = 'auto' as const;
  const rowDir = rowDirection();

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
  }, [user?.id]);

  const fetchMe = async () => {
    try {
      const res = await api.get<MeResponse>('/individual/me');
      if (res.data.success) {
        await setUser(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // MVP: update only basic fields via JSON patch (no image upload yet)
      const res = await api.patch<MeResponse>('/individual/me', {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (res.data.success) {
        await setUser(res.data.data);
        showToast(t('common.success') || 'Success', 'success');
      } else {
        showToast(res.data.message || t('common.error') || 'Error', 'error');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || t('common.error') || 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const logout = useIndividualAuthStore((s) => s.logout);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast(t('legal.deleteAccountPasswordPlaceholder') || 'Please enter password', 'error');
      return;
    }

    setDeleting(true);
    try {
      const res = await api.delete('/individual/account', {
        data: { password: deletePassword }
      });

      if (res.data.success) {
        showToast(t('legal.deleteAccountSuccess') || 'Account deleted successfully', 'success');
        setDeleteModalVisible(false);
        await logout(); // Using individual auth logout
      } else {
        showToast(res.data.message || t('common.error'), 'error');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || t('legal.deleteAccountError') || 'Error deleting account', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('individual.editProfileTitle') || 'My Profile'}</Text>

          <Text style={[styles.label, { textAlign }]}>{t('individual.fullName') || 'Full name'}</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={[styles.input, { textAlign, writingDirection }]}
            placeholder={t('individual.fullNamePlaceholder') || 'Enter your name'}
          />

          <Text style={[styles.label, { textAlign }]}>{t('auth.phone') || 'Phone Number'}</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={[styles.input, { textAlign, writingDirection }]}
            keyboardType="phone-pad"
            placeholder={t('individual.phonePlaceholder') || 'Enter phone (optional)'}
          />

          <Text style={[styles.label, { textAlign }]}>{t('common.language') || 'Language / اللغة'}</Text>
          <View style={[styles.languageContainer, { flexDirection: rowDir }]}>
            <TouchableOpacity 
              style={[styles.langButton, language === 'en' && styles.langButtonActive]} 
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langButton, language === 'ar' && styles.langButtonActive]} 
              onPress={() => setLanguage('ar')}
            >
              <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>العربية</Text>
            </TouchableOpacity>
          </View>

          <Button title={t('common.save') || 'Save'} onPress={handleSave} loading={loading} />

          <TouchableOpacity 
            style={styles.deleteButtonContainer} 
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.deleteButtonText}>{t('legal.deleteAccount') || 'Delete Account'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('legal.deleteAccountConfirmTitle') || 'Delete Account?'}</Text>
            <Text style={styles.modalText}>{t('legal.deleteAccountConfirmMessage') || 'This action cannot be undone.'}</Text>
            
            <TextInput
              style={[styles.input, { width: '100%' }]}
              placeholder={t('legal.deleteAccountPasswordPlaceholder') || 'Enter current password'}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
            
            <View style={styles.modalActions}>
              <Button 
                title={t('common.cancel') || 'Cancel'} 
                onPress={() => setDeleteModalVisible(false)} 
                variant="outline" 
                style={styles.modalActionBtn}
              />
              <Button 
                title={t('common.delete') || 'Delete'} 
                onPress={handleDeleteAccount} 
                variant="danger"
                loading={deleting}
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#2c3e50', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, color: '#34495e', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16 },
  languageContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  langButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  langButtonActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  langText: { fontSize: 16, color: '#333' },
  langTextActive: { color: '#fff', fontWeight: 'bold' },
  deleteButtonContainer: { marginTop: 40, padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f1f1' },
  deleteButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 16, width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  modalText: { fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20, gap: 10 },
  modalActionBtn: { flex: 1 },
});
