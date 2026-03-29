import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { alignStart } from '../utils/rtl';

interface FeaturedBadgeProps {
  packageType: '7days' | '14days' | '30days';
  expiryDate?: string;
  style?: any;
}

export const FeaturedBadge: React.FC<FeaturedBadgeProps> = ({
  packageType,
  expiryDate,
  style
}) => {
  const { t } = useTranslation();
  const startAlign = alignStart();

  const getBadgeColor = () => {
    switch (packageType) {
      case '7days':
        return '#D1232A';
      case '14days':
        return '#C6A55E';
      case '30days':
        return '#00305D';
      default:
        return '#00305D';
    }
  };

  const getBadgeText = () => {
    switch (packageType) {
      case '7days':
        return t('featured.badge7days') || 'FEATURED';
      case '14days':
        return t('featured.badge14days') || 'PREMIUM';
      case '30days':
        return t('featured.badge30days') || 'VIP';
      default:
        return t('featured.badge') || 'FEATURED';
    }
  };

  const getExpiryText = () => {
    if (!expiryDate) return '';
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return t('featured.expired') || 'Expired';
    if (daysLeft === 1) return t('featured.expiresToday') || 'Expires today';
    return `${t('featured.expiresIn') || 'Expires in'} ${daysLeft} ${t('featured.days') || 'days'}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: getBadgeColor(), alignSelf: startAlign }, style]}>
      <Text style={styles.badgeText}>{getBadgeText()}</Text>
      {expiryDate && (
        <Text style={styles.expiryText}>{getExpiryText()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expiryText: {
    color: '#fff',
    fontSize: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
});