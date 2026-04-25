import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Property } from '../types/property';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface Props {
  property: Property;
}

export const FeaturedPlusCard: React.FC<Props> = ({ property }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePress = () => {
    router.push({
      pathname: `/property/${property.id}`,
      params: { id: property.id }
    });
  };

  // Get first image
  const displayImage = property.propertyImages?.[0]?.imageUrl || property.imageUrl || 'https://via.placeholder.com/400x300';
  
  // Format price
  const formattedPrice = property.price 
    ? parseFloat(property.price).toLocaleString() 
    : '0';

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }], opacity }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.95} style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: displayImage }} style={styles.image} resizeMode="cover" />
          
          <View style={styles.topBadges}>
            <View style={styles.locationBadge}>
               <Ionicons name="location-outline" size={12} color="#FFFFFF" />
               <Text style={styles.locationBadgeText} numberOfLines={1}>{property.area}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.favoriteButton}>
             <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
             <Text style={styles.title} numberOfLines={1}>{property.title || t('property.noTitle')}</Text>
             <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>4.8</Text>
             </View>
          </View>
          
          <View style={styles.locationRow}>
             <Ionicons name="location-sharp" size={14} color="#9ca3af" />
             <Text style={styles.location}>{property.area}, {property.governorate}</Text>
          </View>
          
          <View style={styles.footerRow}>
             <View>
                 <Text style={styles.priceLabel}>{property.purpose === 'rent' ? '/ Month' : ''}</Text>
                 <Text style={styles.price}>{formattedPrice} BHD</Text>
             </View>
             <View style={styles.bookButton}>
                <Text style={styles.bookButtonText}>{t('property.details') || 'Book Now'}</Text>
             </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBadges: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationBadgeText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  bookButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
