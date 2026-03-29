import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Property } from '../types/property';
import { FeaturedPlusCard } from './FeaturedPlusCard';
import { useTranslation } from 'react-i18next';
import { alignStart, textAlignStart } from '../utils/rtl';

interface Props {
  properties: Property[];
  loading?: boolean;
}

export const FeaturedPlusCarousel: React.FC<Props> = ({ properties, loading }) => {
  const { t } = useTranslation();
  const align = alignStart();
  const textAlign = textAlignStart();

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 }]}>
         <Text style={[styles.title, { textAlign }]}>{t('home.featuredPlus') || 'Special Offers'}</Text>
      </View>
      
      <FlatList
        data={properties}
        renderItem={({ item }) => <FeaturedPlusCard property={item} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={Dimensions.get('window').width * 0.85 + 15}
        decelerationRate="fast"
      />
    </View>
  );
};

import { Dimensions } from 'react-native';

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 10, // Space for shadow
  }
});
