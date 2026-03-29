import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rowDirection, textAlignStart } from '../utils/rtl';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const rowDir = rowDirection();
  const textAlign = textAlignStart();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      hide();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#2ecc71';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      case 'warning': return '#f39c12';
      default: return '#3498db';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'info': return 'information-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { flexDirection: rowDir },
        { opacity, transform: [{ translateY }], backgroundColor: getBackgroundColor() },
      ]}
    >
      <Ionicons name={getIcon()} size={24} color="white" style={styles.icon} />
      <Text style={[styles.message, { textAlign }]}>{message}</Text>
      <TouchableOpacity onPress={hide}>
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Adjust based on safe area
    start: 20,
    end: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  icon: {
    marginEnd: 12,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
