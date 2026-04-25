import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { rowDirection } from '../utils/rtl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const rowDir = rowDirection();

  const getBackgroundColor = () => {
    if (disabled) return '#C6A55E';
    switch (variant) {
      case 'primary': return '#00305D';
      case 'secondary': return '#C6A55E';
      case 'success': return '#C6A55E';
      case 'danger': return '#D1232A';
      case 'outline': return 'transparent';
      default: return '#00305D';
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return disabled ? '#C6A55E' : '#00305D';
    return 'white';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { flexDirection: rowDir },
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#00305D',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
