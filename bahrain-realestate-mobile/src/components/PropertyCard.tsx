import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../types/property';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/languageStore';
import { useLocationStore } from '../store/locationStore';
import { getTimeAgo } from '../utils/timeAgo';
import { toAbsoluteUrl } from '../utils/url';
import { rowDirection as getRowDirection, textAlignStart } from '../utils/rtl';

const watermarkLogo = require('../../assets/WhatsApp Image 2026-02-17 at 1.59.17 PM.jpeg');

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  showFeaturedBadge?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, showFeaturedBadge = true }) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { getLocalizedName } = useLocationStore();
  
  const isFeatured = property.isFeatured;
  const timeAgo = getTimeAgo(property.createdAt, language as 'en' | 'ar');

  // Localize fields
  const localizedType = t(`property.types.${property.type.toLowerCase()}`, { defaultValue: property.type });
  const localizedArea = getLocalizedName(property.area, 'area', language);
  const localizedGov = getLocalizedName(property.governorate, 'governorate', language);

  const listingTitle = t('property.typeInArea', {
    type: localizedType,
    area: localizedArea,
    defaultValue: `${localizedType} ${language === 'ar' ? 'في' : 'in'} ${localizedArea}`,
  });

  const displayTitle = (property.title && String(property.title).trim().length > 0)
    ? String(property.title).trim()
    : listingTitle;

  const rowDirection = getRowDirection();
  const textAlign = textAlignStart();
  
  // Separate images and videos from propertyImages
  const mediaItems = Array.isArray(property.propertyImages) && property.propertyImages.length > 0
    ? property.propertyImages
    : [];

  // Helper to check extension if flag is missing
  const isVideoFile = (url: string) => {
      if (!url) return false;
      return /\.(mp4|mov|avi|wmv|flv|webm|mkv)(\?.*)?$/i.test(url);
  };
  
  const imagesList: Array<string | null> = mediaItems
    .filter(item => !item.isVideo && !isVideoFile(item.imageUrl)) // Only images
    .map(img => toAbsoluteUrl(img.imageUrl) ?? null)
    .concat(
      // Fallback to old images array if no propertyImages
      mediaItems.length === 0 && Array.isArray(property.images) && property.images.length > 0
        ? property.images.map(u => toAbsoluteUrl(u) ?? null)
        : []
    )
    .concat(
      // Fallback to old imageUrl if no images found
      mediaItems.length === 0 && !property.images?.length && (property as any)?.imageUrl
        ? [toAbsoluteUrl((property as any).imageUrl) ?? null]
        : []
    );

  const [width, setWidth] = React.useState(0);

  // Count videos from propertyImages
  const videoCount = mediaItems.filter(item => item.isVideo || isVideoFile(item.imageUrl)).length +
    // Add legacy video count
    (property.videoUrl && !mediaItems.some(item => (item.isVideo || isVideoFile(item.imageUrl)) && item.imageUrl === property.videoUrl) ? 1 : 0);

  return (
    <View 
      style={[styles.card, isFeatured && styles.featuredCard]} 
    >
      <View 
        style={styles.imageContainer}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <FlatList
            data={imagesList.length > 0 ? imagesList : [null]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                <Image
                  source={item ? { uri: item } : require('../../assets/icon.png')}
                  style={[styles.image, { width: width }]}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            )}
            style={{ width: width, height: 220 }}
          />
        ) : (
           <Image
            source={require('../../assets/icon.png')}
            style={styles.image}
            contentFit="cover"
          />
        )}
              <View style={styles.watermarkOverlay}>
                <Image
                  source={watermarkLogo}
                  style={styles.watermark}
                  contentFit="contain"
                  transition={0}
                />
              </View>
        
        {/* Video Count Badge */}
        {videoCount > 0 && (
          <View style={[styles.videoBadge, { bottom: 12, start: 12 }]}>
            <Ionicons name="videocam" size={12} color="#fff" />
            <Text style={styles.videoCountText}>{videoCount}</Text>
          </View>
        )}
        
        {/* Status Badge (Sale/Rent) */}
        <View style={[
          styles.badge, 
          property.purpose === 'sale' ? styles.saleBadge : styles.rentBadge,
          // Position on layout start (right in RTL, left in LTR)
          { start: 12 }
        ]}>
          <Text style={styles.badgeText}>
            {property.purpose === 'sale' ? t('home.forSale') : t('home.forRent')}
          </Text>
        </View>

        {/* Featured Badge */}
        {isFeatured && showFeaturedBadge && (
          <View style={[
            styles.featuredBadge,
            // Position on layout end (left in RTL, right in LTR)
            { end: 12 }
          ]}>
            <Ionicons name="star" size={12} color="#fff" style={{ marginEnd: 4 }} />
            <Text style={styles.featuredText}>{t('featured.featured')}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.9}>
        <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
          <Text
            style={[styles.title, { textAlign }]}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
        </View>

        <View style={[styles.locationRow, { flexDirection: rowDirection }]}>
          <Ionicons name="location-outline" size={14} color="#C6A55E" />
          <Text style={[styles.location, { textAlign }]} numberOfLines={1}>
            {localizedArea}, {localizedGov}
          </Text>
        </View>

        <View style={[styles.featuresRow, { flexDirection: rowDirection }]}>
          <View style={[styles.featureItem, { flexDirection: rowDirection }]}>
            <Ionicons name="bed-outline" size={16} color="#C6A55E" />
            <Text style={styles.featureText}>{property.bedrooms}</Text>
          </View>
          <View style={[styles.featureItem, { flexDirection: rowDirection }]}>
            <Ionicons name="water-outline" size={16} color="#C6A55E" />
            <Text style={styles.featureText}>{property.bathrooms}</Text>
          </View>
          <View style={[styles.featureItem, { flexDirection: rowDirection }]}>
            <Ionicons name="resize-outline" size={16} color="#C6A55E" />
            <Text style={styles.featureText}>{property.areaSqm} {t('property.sqm')}</Text>
          </View>
        </View>

        <View style={[styles.footerRow, { flexDirection: rowDirection }]}>
          <Ionicons name="time-outline" size={14} color="#C6A55E" />
          <Text style={styles.timeText}>{timeAgo}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text
            style={[styles.price, { textAlign }]}
            numberOfLines={1}
          >
            {Number(property.price).toLocaleString()} {t('currency.bhd', { defaultValue: 'BHD' })}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E6DFCC',
  },
  featuredCard: {
    borderColor: '#C6A55E',
    borderWidth: 1.5,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 220, // Bigger image
    backgroundColor: '#E6DFCC',
  },
  watermarkOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    width: 72,
    height: 72,
    opacity: 0.25,
    borderRadius: 14,
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    // Default position on layout start; can be overridden via style prop.
    start: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1,
  },
  saleBadge: {
    backgroundColor: '#D1232A',
  },
  rentBadge: {
    backgroundColor: '#00305D',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    // Default position on layout end; can be overridden via style prop.
    end: 12,
    backgroundColor: '#C6A55E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  featuredText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00305D',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
  },
  type: {
    fontSize: 14,
    color: '#C6A55E',
    fontWeight: '500',
    flex: 1,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#C6A55E',
    flex: 1,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#C6A55E',
  },
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    color: '#C6A55E',
  },
});
