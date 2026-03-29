import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../../src/api/api';
import { Button } from '../../../src/components/Button';
import { useToast } from '../../../src/context/ToastContext';
import { ModalSelector } from '../../../src/components/ModalSelector';

export default function AddEmployee() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'AGENT',
    password: '',
  });

  const roles = [
    { id: 'AGENT', label: t('auth.roleAgent') || 'Agent' },
    { id: 'MANAGER', label: t('auth.roleManager') || 'Manager' },
  ];

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      showToast(t('addProperty.validation.required'), 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/company/employees', formData);
      
      if (response.data.success) {
        showToast(t('employees.successAdd'), 'success');
        router.back();
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.response?.data?.message || t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>{t('employees.name')} *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />

        <Text style={styles.label}>{t('employees.email')} *</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
        />

        <Text style={styles.label}>{t('employees.phone')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
        />

        <Text style={styles.label}>{t('employees.role')} *</Text>
        <View style={styles.roleContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleButton,
                formData.role === role.id && styles.roleButtonActive
              ]}
              onPress={() => setFormData({...formData, role: role.id})}
            >
              <Text style={[
                styles.roleButtonText,
                formData.role === role.id && styles.roleButtonTextActive
              ]}>
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('auth.password')} *</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
        />

        <Button 
          title={t('employees.add')}
          onPress={handleSubmit}
          loading={loading}
          variant="success"
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
    marginTop: 10,
    textAlign: 'auto',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'auto',
    writingDirection: 'auto',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  roleButtonActive: {
    backgroundColor: '#00305D',
    borderColor: '#00305D',
  },
  roleButtonText: {
    color: '#C6A55E',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    marginTop: 30,
  },
});
