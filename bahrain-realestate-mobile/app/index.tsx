import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, FlatList, TextInput, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore } from '../src/store/languageStore';
import { useAuthStore } from '../src/store/authStore';
import { useIndividualAuthStore } from '../src/store/individualAuthStore';
import { ModalSelector } from '../src/components/ModalSelector';
import { Button } from '../src/components/Button';
import { FeaturedPlusCarousel } from '../src/components/FeaturedPlusCarousel';
import api from '../src/api/api';
import { Governorate, Area, GovernorateListResponse, AreaListResponse } from '../src/types/location';
import { Property, PropertyListResponse } from '../src/types/property';
import { alignStart, rowDirection, textAlignStart } from '../src/utils/rtl';

export default function Home() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { isAuthenticated: isCompanyAuthenticated, logout: companyLogout } = useAuthStore();
  const { isAuthenticated: isIndividualAuthenticated, logout: individualLogout } = useIndividualAuthStore();
  const router = useRouter();
  
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<'sale' | 'rent' | 'exchange'>('rent');
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [featuredPlusProperties, setFeaturedPlusProperties] = useState<Property[]>([]);

  const flexDirection = rowDirection();
  const startAlign = alignStart();
  const textAlign = textAlignStart();

  useEffect(() => {
    fetchGovernorates();
  }, []);

  useEffect(() => {
    fetchFeaturedPlusProperties();
  }, [purpose]);

  useEffect(() => {
    if (selectedGovernorateId) {
      fetchAreas(selectedGovernorateId);
    } else {
      setAreas([]);
      setSelectedAreaId(null);
    }
  }, [selectedGovernorateId]);

  const fetchGovernorates = async () => {
    try {
      const response = await api.get<GovernorateListResponse>('/public/governorates');
      if (response.data.success) {
        setGovernorates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching governorates:', error);
    }
  };

  const fetchAreas = async (govId: string) => {
    try {
      const response = await api.get<AreaListResponse>(`/public/governorates/${govId}/areas`);
      if (response.data.success) {
        setAreas(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const fetchFeaturedPlusProperties = async () => {
    try {
      const response = await api.get<PropertyListResponse>('/public/search', {
        params: { isFeaturedPlus: true, purpose: purpose, take: 5 }
      });
      if (response.data.success) {
        setFeaturedPlusProperties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching featured plus properties:', error);
    }
  };

  const propertyTypes = [
    { id: 'apartments', label: t('property.types.apartments') },
    { id: 'villas_houses', label: t('property.types.villas_houses') },
    { id: 'lands', label: t('property.types.lands') },
    { id: 'buildings', label: t('property.types.buildings') },
    { id: 'offices', label: t('property.types.offices') },
    { id: 'studio', label: t('property.types.studio') },
    { id: 'shops', label: t('property.types.shops') },
    { id: 'warehouses', label: t('property.types.warehouses') },
    { id: 'labor_accommodation', label: t('property.types.labor_accommodation') },
    { id: 'commercial_complexes', label: t('property.types.commercial_complexes') },
    { id: 'chalets', label: t('property.types.chalets') },
    { id: 'traditional_houses', label: t('property.types.traditional_houses') },
    { id: 'farms', label: t('property.types.farms') },
    { id: 'halls', label: t('property.types.halls') },
    { id: 'under_construction', label: t('property.types.under_construction') },
    { id: 'camps', label: t('property.types.camps') },
    { id: 'misc', label: t('property.types.misc') },
  ];

  const handleSearch = () => {
    setSearchModalVisible(false);
    const selectedGov = governorates.find(g => g.id.toString() === selectedGovernorateId);
    const selectedArea = areas.find(a => a.id.toString() === selectedAreaId);

    router.push({
      pathname: '/properties',
      params: {
        governorate: selectedGov ? (selectedGov.nameEn || selectedGov.name) : undefined,
        area: selectedArea ? (selectedArea.nameEn || selectedArea.name) : undefined,
        type: propertyType,
        purpose: purpose
      }
    });
  };

  const handleCategoryPress = (typeId: string) => {
    setPropertyType(typeId);
    router.push({
      pathname: '/properties',
      params: {
        type: typeId,
        purpose: purpose
      }
    });
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setMenuVisible(false);
  };

  const renderCategoryItem = ({ item }: { item: { id: string, label: string } }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem, 
        propertyType === item.id && styles.categoryItemActive
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      <Text style={[
        styles.categoryText, 
        propertyType === item.id && styles.categoryTextActive
      ]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={[styles.headerSection, { flexDirection }]}>
          <View style={{ flex: 1 }}>
            <View style={[styles.locationRow, { flexDirection: rowDirection() }]}>
              <Text style={styles.locationLabel}>{t('home.location') || 'Location'}</Text>
              <Ionicons name="chevron-down" size={16} color="#9ca3af" />
            </View>
            <TouchableOpacity 
                onPress={() => setSearchModalVisible(true)}
                style={[styles.locationValueRow, { flexDirection: rowDirection() }]}
            >
               <Ionicons name="location" size={20} color="#D1232A" style={{ marginRight: 5 }} />
               <Text style={styles.locationValue}>
                  {selectedGovernorateId 
                    ? (language === 'ar' 
                        ? governorates.find(g => g.id.toString() === selectedGovernorateId)?.nameAr 
                        : governorates.find(g => g.id.toString() === selectedGovernorateId)?.nameEn)
                    : (language === 'ar' ? 'البحرين' : 'Bahrain')}
               </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.notificationButton} onPress={() => setMenuVisible(true)}>
             <Ionicons name="grid-outline" size={24} color="#00305D" />
          </TouchableOpacity>
        </View>

        {/* Hero Text */}
        <Text style={[styles.heroTitle, { textAlign }]}>
          {t('home.heroTitle') || 'Find Your Dream\nHome Easily'}
        </Text>

        {/* Filter Search Card */}
        <View style={styles.filterCard}>
            <View style={[styles.filterHeader, { marginBottom: 16 }]}>
               <Text style={[styles.filterTitle, { textAlign }]}>{t('home.searchFilters') || 'Filter Search'}</Text>
            </View>

           {/* Purpose Selector */}
           <View style={[styles.purposeContainer, { flexDirection }]}>
            <TouchableOpacity 
              style={[styles.purposeButton, purpose === 'rent' && styles.purposeActive]} 
              onPress={() => setPurpose('rent')}
            >
              <Text style={[styles.purposeText, purpose === 'rent' && styles.purposeTextActive]}>
                {t('home.forRent')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.purposeButton, purpose === 'sale' && styles.purposeActive]} 
              onPress={() => setPurpose('sale')}
            >
              <Text style={[styles.purposeText, purpose === 'sale' && styles.purposeTextActive]}>
                {t('home.forSale')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Property Type Selector */}
          <View style={styles.inputGroup}>
            <ModalSelector
              label={language === 'ar' ? 'نوع العقار' : (t('property.filter.type') || 'Property Type')}
              placeholder={language === 'ar' ? 'الكل' : (t('common.allTypes') || 'All Types')}
              options={propertyTypes}
              selectedId={propertyType}
              onSelect={setPropertyType}
              hasResetOption={true}
            />
          </View>

          {/* Governorate Selector */}
          <View style={styles.inputGroup}>
            <ModalSelector
              label={t('property.form.selectGovernorate') || 'Governorate'}
              placeholder={t('common.allGovernorates')}
              options={governorates.map(g => ({
                id: g.id.toString(),
                label: language === 'ar' ? g.nameAr : g.nameEn
              }))}
              selectedId={selectedGovernorateId}
              onSelect={setSelectedGovernorateId}
              hasResetOption={true}
            />
          </View>

          {/* Area Selector */}
          <View style={styles.inputGroup}>
            <ModalSelector
              label={t('property.form.selectArea') || 'Area'}
              placeholder={t('common.allAreas')}
              options={areas.map(a => ({
                id: a.id.toString(),
                label: language === 'ar' ? a.nameAr : a.nameEn
              }))}
              selectedId={selectedAreaId}
              onSelect={setSelectedAreaId}
              disabled={!selectedGovernorateId}
              hasResetOption={true}
            />
          </View>

          <Button 
            title={t('home.search')} 
            onPress={handleSearch}
            style={styles.searchButton}
          />
        </View>

        {/* Categories and Nearby Places sections removed as per request */}

      </ScrollView>

      {/* Search Filter Modal Removed (Embedded in Main View) */}

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={[
            styles.menuModalOverlay, 
            { 
              flexDirection: 'row', 
              justifyContent: startAlign,
            }
          ]}  
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[
            styles.menuContainer, 
            { position: 'relative', height: '100%' }
          ]}>
            <SafeAreaView edges={['top', 'bottom']}>
              <View style={[styles.menuHeader, { flexDirection }]}>
                 <Text style={[styles.menuTitle, { textAlign }]}>{t('home.menu') || 'Menu'}</Text>
                 <TouchableOpacity onPress={() => setMenuVisible(false)}>
                   <Ionicons name="close" size={24} color="#00305D" />
                 </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={[styles.menuItem, { flexDirection }]} onPress={toggleLanguage}>
                <Ionicons name="globe-outline" size={24} color="#00305D" />
                <Text style={[styles.menuItemText, { textAlign }]}>{language === 'en' ? 'English' : 'العربية'}</Text>
              </TouchableOpacity>

              {isCompanyAuthenticated ? (
                <>
                <TouchableOpacity style={[styles.menuItem, { flexDirection }]} onPress={() => {
                    setMenuVisible(false);
                    router.push('/company');
                }}>
                    <Ionicons name="business-outline" size={24} color="#00305D" />
                    <Text style={[styles.menuItemText, { textAlign }]}>{t('dashboard.title') || 'Dashboard'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { flexDirection }]} onPress={async () => {
                   setMenuVisible(false);
                   await companyLogout();
                   router.replace('/login');
                }}>
                   <Ionicons name="log-out-outline" size={24} color="#D1232A" />
                   <Text style={[styles.menuItemText, { color: '#D1232A' }]}>{t('dashboard.logout')}</Text>
                </TouchableOpacity>
                </>
              ) : isIndividualAuthenticated ? (
                <>
                  <TouchableOpacity style={[styles.menuItem, { flexDirection }]} onPress={() => {
                      setMenuVisible(false);
                      router.push('/individual');
                  }}>
                      <Ionicons name="person-outline" size={24} color="#00305D" />
                      <Text style={[styles.menuItemText, { textAlign }]}>{t('dashboard.title') || 'Dashboard'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.menuItem, { flexDirection }]} onPress={async () => {
                     setMenuVisible(false);
                     await individualLogout();
                     router.replace('/login');
                  }}>
                     <Ionicons name="log-out-outline" size={24} color="#D1232A" />
                     <Text style={[styles.menuItemText, { color: '#D1232A' }]}>{t('dashboard.logout')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.menuItem, { flexDirection }]} onPress={() => {
                   setMenuVisible(false);
                   router.push('/login');
                }}>
                   <Ionicons name="log-in-outline" size={24} color="#00305D" />
                   <Text style={[styles.menuItemText]}>{t('auth.login')}</Text>
                </TouchableOpacity>
              )}
            </SafeAreaView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 12,
    color: '#C6A55E',
    marginBottom: 4,
  },
  locationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00305D',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00305D',
    marginBottom: 24,
    lineHeight: 38,
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  searchIconContainer: {
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#00305D',
  },
  filterButton: {
    backgroundColor: '#00305D',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00305D',
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryItemActive: {
    backgroundColor: '#00305D',
    borderColor: '#00305D',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C6A55E',
  },
  categoryTextActive: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    height: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00305D',
  },
  purposeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  purposeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  purposeActive: {
    backgroundColor: '#00305D',
  },
  purposeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C6A55E',
  },
  purposeTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  searchButton: {
    marginTop: 20,
    backgroundColor: '#00305D',
    borderRadius: 16,
    paddingVertical: 16,
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#00305D',
  },
});
