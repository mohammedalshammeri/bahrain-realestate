import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { alignStart } from '../utils/rtl';

interface SkeletonLoaderProps {
  style?: ViewStyle;
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  style, 
  width = '100%', 
  height = 20, 
  borderRadius = 4 
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { opacity, width, height, borderRadius } as any,
        style,
      ]}
    />
  );
};

export const PropertyCardSkeleton = () => {
  const alignItems = alignStart();

  return (
    <View style={styles.card}>
      <SkeletonLoader height={200} borderRadius={12} style={{ marginBottom: 12 }} />
      <View style={[styles.content, { alignItems }]}>
        <SkeletonLoader width="60%" height={24} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="80%" height={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E6DFCC',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  }
});
