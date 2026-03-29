import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image as RNImage, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../src/components/MapWrapper';
import { Button } from '../../src/components/Button';
import { rowDirection } from '../../src/utils/rtl';

const watermarkLogo = require('../../assets/WhatsApp Image 2026-02-17 at 1.59.17 PM.jpeg');

interface PropertyPreviewData {
  title?: string;
  status?: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | string;
  type: string;
  purpose: string;
  price: string;
  isNegotiable?: boolean;
  parkingCount?: string;
  propertyCondition?: 'READY' | 'UNDER_CONSTRUCTION' | string;
  coverImageUri?: string;
  imagesMeta?: Array<{ uri: string; isCover: boolean }>;
  governorate: string;
  area: string;
  description: string;
  locationLat?: string;
  locationLng?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqm?: string;
  furnishingStatus?: string;
  floorsCount?: string;
  floorNumber?: string;
  livingRooms?: string;
  buildingAge?: string;
  images: string[];
  video?: {
    uri: string;
    fileName?: string;
    mimeType?: string;
  } | null;
  videos?: Array<{
    uri: string;
    fileName?: string;
    mimeType?: string;
  }>;
}

export default function PropertyPreview() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse the property data from params
  const propertyData: PropertyPreviewData = JSON.parse(params.propertyData as string || '{}');

  const textAlign: 'auto' | 'left' | 'right' = 'auto';
  const writingDirection: 'auto' | 'ltr' | 'rtl' = 'auto';
  const rowDir = rowDirection();

  const getPropertyTypeLabel = (type: string) => {
    const types = {
      apartments: t('property.types.apartments'),
      villas_houses: t('property.types.villas_houses'),
      lands: t('property.types.lands'),
      buildings: t('property.types.buildings'),
      offices: t('property.types.offices'),
      studio: t('property.types.studio'),
      shops: t('property.types.shops'),
      warehouses: t('property.types.warehouses'),
      labor_accommodation: t('property.types.labor_accommodation'),
      commercial_complexes: t('property.types.commercial_complexes'),
      chalets: t('property.types.chalets'),
      traditional_houses: t('property.types.traditional_houses'),
      farms: t('property.types.farms'),
      halls: t('property.types.halls'),
      under_construction: t('property.types.under_construction'),
      camps: t('property.types.camps'),
      misc: t('property.types.misc'),
    };
    return types[type as keyof typeof types] || type;
  };

  const formatPrice = (price: string, purpose: string) => {
    const bhd = t('currency.bhd', { defaultValue: 'BHD' });
    const perMonth = t('currency.perMonth', { defaultValue: '/month' });
    const currency = purpose === 'rent' ? `${bhd}${perMonth}` : bhd;
    return `${currency} ${parseFloat(price).toLocaleString()}`;
  };

  const formatListingStatus = (status?: string) => {
    if (!status) return '-';
    const normalized = status.toLowerCase();
    if (status === 'DRAFT' || normalized === 'draft') return t('listing.status.draft') || 'DRAFT';
    if (status === 'PENDING' || normalized === 'pending') return t('listing.status.pending') || 'PENDING';
    if (status === 'PUBLISHED' || normalized === 'published' || normalized === 'active') return t('listing.status.published') || 'PUBLISHED';
    if (status === 'REJECTED' || normalized === 'rejected') return t('listing.status.rejected') || 'REJECTED';
    return status;
  };

  const handlePublish = () => {
    // Navigate back to add screen with publish flag
    router.replace({
      pathname: '/company/add',
      params: { action: 'publish', propertyData: JSON.stringify(propertyData) }
    });
  };

  const handleEdit = () => {
    // Navigate back to add screen with edit flag
    router.replace({
      pathname: '/company/add',
      params: { action: 'edit', propertyData: JSON.stringify(propertyData) }
    });
  };

  const coverUri =
    propertyData.coverImageUri ||
    propertyData.imagesMeta?.find(i => i.isCover)?.uri ||
    propertyData.images?.[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign }]}>{t('preview.title')}</Text>
        <Text style={[styles.subtitle, { textAlign }]}>{t('preview.subtitle')}</Text>
      </View>

      {/* Cover Image */}
      {!!coverUri && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('preview.coverImage') || 'Cover Image'}</Text>
          <View style={styles.mediaWrap}>
            <RNImage source={{ uri: coverUri }} style={styles.coverImage} />
            <RNImage source={watermarkLogo} style={styles.watermarkMain} resizeMode="contain" />
          </View>
        </View>
      )}

      {/* Images Gallery */}
      {propertyData.images && propertyData.images.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('preview.images')}</Text>
          <ScrollView horizontal style={styles.imageGallery}>
            {propertyData.images.map((imageUri, index) => (
              <View key={index} style={styles.galleryItem}>
                <RNImage source={{ uri: imageUri }} style={styles.galleryImage} />
                <RNImage source={watermarkLogo} style={styles.watermarkThumb} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('preview.basicInfo')}</Text>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.status') || 'Status'}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.value, { textAlign }]}>{formatListingStatus(propertyData.status)}</Text>
        </View>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.title') || 'Title'}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.value, { textAlign }]}>{propertyData.title || '-'}</Text>
        </View>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.type')}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.value, { textAlign }]}>{getPropertyTypeLabel(propertyData.type)}</Text>
        </View>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.purpose')}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.value, { textAlign }]}>
            {propertyData.purpose === 'sale' ? t('home.forSale') : t('home.forRent')}
          </Text>
        </View>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.price')}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.priceValue, { textAlign }]}>
            {formatPrice(propertyData.price, propertyData.purpose)}
          </Text>
        </View>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.negotiable') || 'Negotiable'}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.value, { textAlign }]}>
            {propertyData.isNegotiable ? (t('common.yes') || 'Yes') : (t('common.no') || 'No')}
          </Text>
        </View>

        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <Text style={[styles.label, { textAlign }]}>{t('preview.location')}</Text>
          <Text style={[styles.label, { textAlign }]}>{': '}</Text>
          <Text style={[styles.value, { textAlign }]}>
            {propertyData.governorate}, {propertyData.area}
          </Text>
        </View>
      </View>

      {/* Video(s) Preview */}
      {(propertyData.videos && propertyData.videos.length > 0) || propertyData.video?.uri ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('addProperty.video') || 'Property Video(s)'}</Text>
          {(propertyData.videos && propertyData.videos.length > 0) ? (
            <View>
              {propertyData.videos.map((vid, idx) => (
                <View key={idx} style={{ marginBottom: 12 }}>
                  {Platform.OS === 'web' ? (
                    // @ts-ignore
                    <View style={styles.mediaWrap}>
                      <video
                        src={vid.uri}
                        controls
                        style={{ width: '100%', height: 220, borderRadius: 10, backgroundColor: '#f1f3f5' }}
                      />
                      <RNImage source={watermarkLogo} style={styles.watermarkMain} resizeMode="contain" />
                    </View>
                  ) : (
                    <Text style={[styles.value, { textAlign }]}> {vid.fileName || `Video ${idx + 1}`} </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            propertyData.video?.uri ? (
              Platform.OS === 'web' ? (
                // @ts-ignore
                <View style={styles.mediaWrap}>
                  <video
                    src={propertyData.video.uri}
                    controls
                    style={{ width: '100%', height: 220, borderRadius: 10, backgroundColor: '#f1f3f5' }}
                  />
                  <RNImage source={watermarkLogo} style={styles.watermarkMain} resizeMode="contain" />
                </View>
              ) : (
                <Text style={[styles.value, { textAlign }]}>{propertyData.video.fileName || 'Video selected'}</Text>
              )
            ) : null
          )}
        </View>
      ) : null}

      {/* Location Map */}
      {propertyData.locationLat && propertyData.locationLng && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('preview.location')}</Text>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={{
                latitude: parseFloat(propertyData.locationLat),
                longitude: parseFloat(propertyData.locationLng),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: parseFloat(propertyData.locationLat),
                  longitude: parseFloat(propertyData.locationLng),
                }}
                title={t('preview.propertyLocation') || 'Property Location'}
              />
            </MapView>
          </View>
          <Text style={[styles.coordinates, { textAlign }]}>
            {t('location.coordinates') || 'Coordinates'}: {parseFloat(propertyData.locationLat).toFixed(6)}, {parseFloat(propertyData.locationLng).toFixed(6)}
          </Text>
        </View>
      )}

      {/* Property Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('preview.details')}</Text>

        {propertyData.parkingCount && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('property.parkingCount') || 'Parking count'}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.parkingCount}</Text>
          </View>
        )}

        {propertyData.propertyCondition && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('property.condition') || 'Property condition'}:</Text>
            <Text style={[styles.value, { textAlign }]}>
              {propertyData.propertyCondition === 'READY'
                ? (t('property.condition.ready') || 'Ready')
                : propertyData.propertyCondition === 'UNDER_CONSTRUCTION'
                  ? (t('property.condition.underConstruction') || 'Under construction')
                  : propertyData.propertyCondition}
            </Text>
          </View>
        )}

        {propertyData.bedrooms && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('addProperty.bedrooms')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.bedrooms}</Text>
          </View>
        )}

        {propertyData.bathrooms && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('addProperty.bathrooms')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.bathrooms}</Text>
          </View>
        )}

        {propertyData.areaSqm && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('addProperty.areaSqm')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.areaSqm} sqm</Text>
          </View>
        )}

        {propertyData.furnishingStatus && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('property.furnishingStatus')}:</Text>
            <Text style={[styles.value, { textAlign }]}>
              {propertyData.furnishingStatus === 'furnished' ? t('property.furnished') :
               propertyData.furnishingStatus === 'unfurnished' ? t('property.unfurnished') :
               t('property.semiFurnished')}
            </Text>
          </View>
        )}

        {propertyData.floorsCount && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('property.floorsCount')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.floorsCount}</Text>
          </View>
        )}

        {propertyData.floorNumber && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('property.floorNumber')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.floorNumber}</Text>
          </View>
        )}

        {propertyData.livingRooms && (
          <View style={[styles.infoRow, { flexDirection: rowDir }]}>
            <Text style={[styles.label, { textAlign }]}>{t('property.livingRooms')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.livingRooms}</Text>
          </View>
        )}

        {propertyData.buildingAge && (
          <View style={styles.infoRow}>
            <Text style={[styles.label, { textAlign }]}>{t('property.buildingAge')}:</Text>
            <Text style={[styles.value, { textAlign }]}>{propertyData.buildingAge} years</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {propertyData.description && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign }]}>{t('preview.description')}</Text>
          <Text style={[styles.description, { textAlign, writingDirection }]}>
            {propertyData.description}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={[styles.actions, { flexDirection: rowDir }]}>
        <Button
          title={t('preview.edit')}
          onPress={handleEdit}
          variant="secondary"
          style={styles.editButton}
        />
        <Button
          title={t('preview.publish')}
          onPress={handlePublish}
          variant="success"
          style={styles.publishButton}
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
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  mediaWrap: {
    position: 'relative',
    width: '100%',
  },
  imageGallery: {
    flexDirection: 'row',
  },
  galleryItem: {
    position: 'relative',
    marginEnd: 10,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#f1f3f5',
  },
  watermarkMain: {
    position: 'absolute',
    top: 12,
    end: 12,
    width: 80,
    height: 80,
    opacity: 0.25,
  },
  watermarkThumb: {
    position: 'absolute',
    top: 4,
    end: 4,
    width: 22,
    height: 22,
    opacity: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#6c757d',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
    textAlign: 'auto',
  },
  priceValue: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'auto',
  },
  description: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  editButton: {
    flex: 1,
  },
  publishButton: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  coordinates: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});