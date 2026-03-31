import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api/api';
import { rowDirection, textAlignStart } from '../../src/utils/rtl';

export default function PaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { propertyId, days, amount, propertyName } = params;

  const flexDirection = rowDirection();
  const textAlign = textAlignStart();
  const writingDirection = 'auto' as const;
  
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !name) {
      Alert.alert(t('common.error'), t('featured.fillAllFields'));
      return;
    }

    setLoading(true);

    try {
      // Create the featured package via backend API
      await api.post('/company/featured-packages', {
        propertyId: Number(propertyId),
        duration: Number(days),
      });

      Alert.alert(
        t('featured.paymentSuccess'),
        t('featured.paymentSuccessMsg'),
        [
          {
            text: 'OK',
            onPress: () => {
              router.dismissAll();
              router.replace('/company/properties');
            }
          }
        ]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || t('featured.paymentError');
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('featured.paymentTitle')}</Text>
        <Text style={styles.subtitle}>{t('featured.securePayment')}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { textAlign }]}>{t('featured.orderSummary')}</Text>
        <View style={[styles.row, { flexDirection }]}>
          <Text style={styles.label}>{t('featured.item')}</Text>
          <Text style={styles.value}>{t('featured.featuredAd')}</Text>
        </View>
        <View style={[styles.row, { flexDirection }]}>
          <Text style={styles.label}>{t('featured.duration')}</Text>
          <Text style={styles.value}>{days} {t('featured.days')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.row, { flexDirection }]}>
          <Text style={styles.totalLabel}>{t('featured.totalToPay')}</Text>
          <Text style={styles.totalValue}>{Number(amount).toFixed(3)} BHD</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={[styles.inputLabel, { textAlign }]}>{t('featured.cardHolder')}</Text>
        <TextInput
          style={[styles.input, { textAlign: 'auto', writingDirection }]}
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.inputLabel, { textAlign }]}>{t('featured.cardNumber')}</Text>
        <View style={[styles.cardInputContainer, { flexDirection }]}>
          <Ionicons name="card-outline" size={24} color="#95a5a6" style={styles.cardIcon} />
          <TextInput
            style={[styles.cardInput, { textAlign: 'auto', writingDirection }]}
            placeholder="0000 0000 0000 0000"
            keyboardType="numeric"
            maxLength={19}
            value={cardNumber}
            onChangeText={setCardNumber}
          />
        </View>

        <View style={[styles.rowInput, { flexDirection }]}>
          <View style={styles.halfInput}>
            <Text style={[styles.inputLabel, { textAlign }]}>{t('featured.expiry')}</Text>
            <TextInput
              style={[styles.input, { textAlign: 'auto', writingDirection }]}
              placeholder="MM/YY"
              maxLength={5}
              value={expiry}
              onChangeText={setExpiry}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={[styles.inputLabel, { textAlign }]}>{t('featured.cvv')}</Text>
            <TextInput
              style={[styles.input, { textAlign: 'auto', writingDirection }]}
              placeholder="123"
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
              value={cvv}
              onChangeText={setCvv}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.payButton, loading && styles.payButtonDisabled]} 
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.payButtonText}>
            {t('featured.payNow')} {Number(amount).toFixed(3)} BHD
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={[styles.secureNote, { flexDirection }]}>
        <Ionicons name="lock-closed" size={16} color="#7f8c8d" />
        <Text style={styles.secureText}>{t('featured.encryptedTransaction')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  value: {
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  form: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  cardInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  cardIcon: {
    paddingHorizontal: 12,
  },
  cardInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  rowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  payButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  secureText: {
    color: '#7f8c8d',
    fontSize: 12,
    marginStart: 5,
  },
});
