import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image as RNImage, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { toAbsoluteUrl } from '../../src/utils/url';
import { alignStart, rowDirection, textAlignStart } from '../../src/utils/rtl';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';
import { useToast } from '../../src/context/ToastContext';
import { useLanguageStore } from '../../src/store/languageStore';
import { useIndividualAuthStore } from '../../src/store/individualAuthStore';
import { ApiResponse, IndividualPropertySubmission } from '../../src/types/individual';

type MyPropsResponse = ApiResponse<IndividualPropertySubmission[]>;

export default function IndividualProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const { language } = useLanguageStore();
  const { user, logout } = useIndividualAuthStore();

  const [items, setItems] = useState<IndividualPropertySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const textAlign = textAlignStart();
  const startAlign = alignStart();
  const rowDir = rowDirection();

  const statusLabel = (status: string) => {
    const key = `individual.status.${String(status).toLowerCase()}`;
    return t(key, { defaultValue: status });
  };

  const fetchData = async () => {
    try {
      const res = await api.get<MyPropsResponse>('/individual/properties');
      if (res.data.success) {
        setItems(res.data.data || []);
      } else {
        showToast(res.data.message || t('common.error') || 'Error', 'error');
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || t('common.error') || 'Error', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatMoney = (value: string | number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(num)) return String(value);
    return num.toLocaleString();
  };

  const pillForStatus = (status: string) => {
    const normalized = String(status).toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'ACCEPTED' || normalized === 'ACTIVE') {
      return { bg: '#E8F7EF', fg: '#16794C' };
    }
    if (normalized === 'REJECTED') {
      return { bg: '#FDECEC', fg: '#B42318' };
    }
    if (normalized === 'PENDING') {
      return { bg: '#FFF6E5', fg: '#8A4B00' };
    }
    return { bg: '#EEF2F6', fg: '#334155' };
  };

  const renderCompany = (offer: any) => {
    const statusLabel = t(`offers.statuses.${String(offer.status).toLowerCase()}`, { defaultValue: offer.status });
    const pill = pillForStatus(offer.status);
    const price = offer.status === 'ACCEPTED' && offer.companyPrice !== null && offer.companyPrice !== undefined
      ? formatMoney(offer.companyPrice)
      : null;

    return (
      <View key={String(offer.id)} style={styles.companyRow}>
        <View style={styles.companyTopRow}>
          <Text style={[styles.companyName, { textAlign }]} numberOfLines={1}>{offer.company?.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.statusPillText, { color: pill.fg, textAlign }]}>{statusLabel}</Text>
          </View>
        </View>
        {price ? (
          <Text style={[styles.companyMeta, { textAlign }]}>
            {(t('individual.companyPrice') || 'Company price') + ': ' + price}
          </Text>
        ) : (
          <Text style={[styles.companyMeta, { textAlign }]}>
            {(t('individual.companyStatus') || 'Status') + ': ' + statusLabel}
          </Text>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: IndividualPropertySubmission }) => {
    const cover = (item.images || []).find((i) => i.isCover) || (item.images || [])[0];
    const coverUri = toAbsoluteUrl(cover?.imageUrl);
    const pill = pillForStatus(item.status);
    return (
      <View style={[styles.card, { alignItems: startAlign }]}>
        {coverUri ? (
          <RNImage source={{ uri: coverUri }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}
        <Text style={[styles.title, { textAlign, width: '100%' }]} numberOfLines={1}>
          {item.title || t('common.property', { defaultValue: 'Property' })}
        </Text>
        <View style={[styles.metaRow, { flexDirection: rowDir, width: '100%' }]}>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.statusPillText, { color: pill.fg, textAlign }]}>{statusLabel(item.status)}</Text>
          </View>
          <Text style={[styles.meta, { textAlign }]}>
            {(t('individual.minimumPrice') || 'Minimum price') + ': ' + formatMoney(item.minimumPrice)}
          </Text>
        </View>

        {item.status === 'REJECTED' && item.adminRejectionReason ? (
          <Text style={[styles.rejectReason, { textAlign, width: '100%' }]}>
            {(t('individual.rejectionReason') || 'Rejection reason') + ': ' + item.adminRejectionReason}
          </Text>
        ) : null}

        <Text style={[styles.meta, { textAlign, width: '100%' }]}>
          {(t('individual.marketingCompanies') || 'Marketing companies') + ': ' + (item.offers?.length || 0)}
        </Text>

        <View style={[styles.companiesWrap, { width: '100%' }]}>
          {(item.offers || []).length === 0 ? (
            <Text style={[styles.emptyCompanies, { textAlign, width: '100%' }]}>{t('individual.noCompaniesYet') || 'No companies yet.'}</Text>
          ) : (
            item.offers.map(renderCompany)
          )}
        </View>
      </View>
    );
  };

  const header = useMemo(() => {
    const displayName = (user?.fullName || user?.email || user?.phone || '').toString();
    return (
      <View style={styles.headerWrap}>
        <View style={[styles.headerCard, { alignItems: startAlign }]}>
          <Text style={[styles.headerKicker, { textAlign, width: '100%' }]}>{t('individual.profileTitle') || 'My Account'}</Text>
          <Text style={[styles.headerName, { textAlign, width: '100%' }]} numberOfLines={1}>
            {displayName || (t('common.property') || '')}
          </Text>

          <View style={[styles.headerActionsRow, { flexDirection: rowDir, width: '100%' }]}>
            <TouchableOpacity onPress={() => router.push('/individual/add')} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>{t('individual.addPropertyCta') || 'Add Property'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/individual/profile')} style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnSecondaryText}>{t('individual.editProfileCta') || 'My Profile'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Additional Actions Row */}
          <View style={[styles.headerActionsRow, { flexDirection: rowDir, marginTop: 10, width: '100%' }]}>
            <TouchableOpacity onPress={() => router.push('/complaints')} style={[styles.btn, styles.btnComplaint]}>
              <Text style={styles.btnComplaintText}>{t('complaints.title') || 'Submit Complaint'}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={logout} style={[styles.logoutLink, { alignSelf: startAlign }]}>
            <Text style={styles.logoutLinkText}>{t('dashboard.logout') || 'Logout'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionHeaderRow, { flexDirection: rowDir, width: '100%' }]}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('individual.myPropertiesTitle', { defaultValue: 'My Properties' })}</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{items.length}</Text>
          </View>
        </View>
      </View>
    );
  }, [user, language, items.length]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={[styles.loadingText, { textAlign }]}>{t('common.loading') || 'Loading...'}</Text>
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { textAlign }]}>{t('individual.emptyTitle') || 'No submissions yet'}</Text>
            <Text style={[styles.emptyText, { textAlign }]}>{t('individual.empty') || 'Add your first property and it will appear here.'}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB' },
  listContent: { paddingBottom: 18 },

  headerWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 2 },
      default: { elevation: 1 },
    }),
  },
  headerKicker: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  headerName: { marginTop: 6, fontSize: 20, color: '#0F172A', fontWeight: '900' },

  headerActionsRow: { marginTop: 12, gap: 10 },
  btn: { flex: 1, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '900' },
  btnSecondary: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  btnSecondaryText: { color: '#1D4ED8', fontWeight: '900' },
  btnComplaint: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  btnComplaintText: { color: '#DC2626', fontWeight: '900' },

  logoutLink: { marginTop: 10, alignSelf: 'flex-start' },
  logoutLinkText: { color: '#B42318', fontWeight: '900' },

  sectionHeaderRow: { marginTop: 12, alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: '#0F172A' },
  countPill: { minWidth: 28, height: 24, paddingHorizontal: 8, borderRadius: 999, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  countPillText: { color: '#3730A3', fontWeight: '900' },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 2 },
      default: { elevation: 1 },
    }),
  },
  cover: { width: '100%', height: 170, borderRadius: 14, marginBottom: 10, backgroundColor: '#F1F5F9' },
  coverPlaceholder: { width: '100%', height: 170, borderRadius: 14, marginBottom: 10, backgroundColor: '#E2E8F0' },
  title: { fontSize: 16, fontWeight: '900', color: '#0F172A', width: '100%' },
  metaRow: { marginTop: 10, alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  meta: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontSize: 12, fontWeight: '900' },
  rejectReason: { marginTop: 8, fontSize: 13, color: '#B42318', fontWeight: '800', width: '100%' },
  companiesWrap: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#EEF2F6', paddingTop: 12, width: '100%' },
  companyRow: { marginBottom: 12, width: '100%' },
  companyTopRow: { alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' },
  companyName: { flex: 1, fontSize: 14, fontWeight: '900', color: '#0F172A' },
  companyMeta: { marginTop: 6, fontSize: 13, color: '#64748B', fontWeight: '700' },
  emptyCompanies: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },

  loadingWrap: { paddingHorizontal: 16, paddingVertical: 28, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  emptyWrap: { paddingHorizontal: 16, paddingVertical: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyText: { marginTop: 6, fontSize: 13, color: '#64748B', fontWeight: '700' },
});
