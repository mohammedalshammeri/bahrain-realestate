import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '../../../src/api/api';
import { useToast } from '../../../src/context/ToastContext';
import { useLanguageStore } from '../../../src/store/languageStore';
import { ApiResponse, IndividualPropertyOffer } from '../../../src/types/individualOffer';
import { textAlignStart } from '../../../src/utils/rtl';

export default function CompanyOfferDetails() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const textAlign = textAlignStart();
  const writingDirection = 'auto' as const;

  const offerId = useMemo(() => Number(params.id), [params.id]);

  const [offer, setOffer] = useState<IndividualPropertyOffer | null>(null);
  const [companyPrice, setCompanyPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOffer = async () => {
    try {
      const res = await api.get<ApiResponse<IndividualPropertyOffer>>(`/company/individual-property-offers/${offerId}`);
      if (res.data.success) {
        const o = res.data.data;
        setOffer(o);
        if (o?.companyPrice !== null && o?.companyPrice !== undefined) {
          setCompanyPrice(String(o.companyPrice));
        }
      } else {
        showToast(res.data.message || t('common.error'), 'error');
      }
    } catch (e) {
      showToast(t('common.error'), 'error');
    }
  };

  useEffect(() => {
    if (!offerId || Number.isNaN(offerId)) return;
    fetchOffer();
  }, [offerId]);

  const formatMoney = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '';
    const num = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(num)) return String(value);
    return num.toLocaleString();
  };

  const minPrice = useMemo(() => {
    const raw = offer?.property?.minimumPrice;
    const num = typeof raw === 'string' ? Number(raw) : Number(raw);
    return Number.isFinite(num) ? num : NaN;
  }, [offer]);

  const validateAccept = () => {
    const price = Number(companyPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return t('offers.enterValidPrice') || 'Enter a valid price';
    }
    if (Number.isFinite(minPrice) && price < minPrice) {
      return (t('offers.priceTooLow') || 'Price must be >= minimum price') + ` (${minPrice})`;
    }
    return null;
  };

  const submit = async (status: 'ACCEPTED' | 'REJECTED') => {
    if (!offer) return;

    if (status === 'ACCEPTED') {
      const err = validateAccept();
      if (err) {
        Alert.alert(t('common.error') || 'Error', err);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = { status };
      if (status === 'ACCEPTED') payload.companyPrice = Number(companyPrice);

      const res = await api.patch<ApiResponse<any>>(`/company/individual-property-offers/${offer.id}`, payload);
      if (res.data.success) {
        showToast(t('common.success') || 'Success', 'success');
        await fetchOffer();
        router.back();
      } else {
        const rawMessage = res.data.message || '';
        const message =
          rawMessage === 'Property is not eligible for company response (must be distributed by admin first)'
            ? (t('offers.propertyNotEligible') || 'هذا العرض غير متاح للرد من قبل الشركة (يجب أن يتم توزيعه من لوحة التحكم أولاً)')
            : rawMessage || t('common.error');
        showToast(message, 'error');
      }
    } catch (e: any) {
      const rawMessage: string | undefined = e?.response?.data?.message;
      const message =
        rawMessage === 'Property is not eligible for company response (must be distributed by admin first)'
          ? (t('offers.propertyNotEligible') || 'هذا العرض غير متاح للرد من قبل الشركة (قد تم بيعه أو لم يعد متاحًا للرد)')
          : rawMessage || t('common.error');
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = () => {
    Alert.alert(
      t('offers.rejectTitle') || 'Reject Offer',
      t('offers.rejectConfirm') || 'Are you sure you want to reject this offer?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.reject') || 'Reject',
          style: 'destructive',
          onPress: () => submit('REJECTED'),
        },
      ]
    );
  };

  if (!offer) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={[styles.loadingText, { textAlign }]}>{t('common.loading') || 'Loading...'}</Text>
      </View>
    );
  }

  const title = offer.property?.title || t('common.property') || 'Property';
  const isSold = offer.property?.status === 'SOLD';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={[styles.title, { textAlign }]}>{title}</Text>

      <View style={styles.section}>
        <Text style={[styles.label, { textAlign }]}>{t('offers.status') || 'Status'}</Text>
        <Text style={[styles.value, { textAlign }]}>{t(`offers.statuses.${offer.status.toLowerCase()}`, { defaultValue: offer.status })}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { textAlign }]}>{t('offers.minimumPrice') || 'Minimum Price'}</Text>
        <Text style={[styles.value, { textAlign }]}>{formatMoney(offer.property.minimumPrice)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { textAlign }]}>{t('offers.details') || 'Details'}</Text>
        <Text style={[styles.value, { textAlign }]}>
          {t(`property.types.${offer.property.type}`, { defaultValue: offer.property.type })}
          {offer.property.purpose ? ` • ${offer.property.purpose === 'sale' ? t('home.forSale') : offer.property.purpose === 'rent' ? t('home.forRent') : offer.property.purpose}` : ''}
        </Text>
        <Text style={[styles.small, { textAlign }]}>{offer.property.governorate} • {offer.property.area}{offer.property.branch ? ` • ${offer.property.branch}` : ''}</Text>
      </View>

      {offer.status === 'PENDING' && !isSold && (
        <View style={styles.section}>
          <Text style={[styles.label, { textAlign }]}>{t('offers.setYourPrice') || 'Set your price'}</Text>
          <TextInput
            style={[styles.input, { textAlign: 'auto', writingDirection }]}
            value={companyPrice}
            onChangeText={setCompanyPrice}
            keyboardType="numeric"
            placeholder={(t('offers.pricePlaceholder') || 'Enter your price') + (Number.isFinite(minPrice) ? ` (>= ${minPrice})` : '')}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={confirmReject}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{t('common.reject') || 'Reject'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton, submitting ? styles.buttonDisabled : null]}
              onPress={() => submit('ACCEPTED')}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>{t('common.accept') || 'Accept'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {offer.status === 'ACCEPTED' && (
        <View style={styles.section}>
          <Text style={[styles.label, { textAlign }]}>{t('offers.yourPrice') || 'Your Price'}</Text>
          <Text style={[styles.value, { textAlign }]}>{formatMoney(offer.companyPrice)}</Text>
        </View>
      )}

      {isSold && (
        <View style={styles.section}>
          <Text style={[styles.small, { textAlign }]}>
            {offer.status === 'ACCEPTED'
              ? (t('offers.soldByYou') || 'This property was sold through your company.')
              : (t('offers.soldByOther') || 'This property was sold by another company.')}
          </Text>
        </View>
      )}

      {!isSold && offer.status === 'REJECTED' && (
        <View style={styles.section}>
          <Text style={[styles.small, { textAlign }]}>{t('offers.rejectedNote') || 'You rejected this offer.'}</Text>
        </View>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 6,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '700',
  },
  small: {
    marginTop: 6,
    fontSize: 13,
    color: '#34495e',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#27ae60',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
