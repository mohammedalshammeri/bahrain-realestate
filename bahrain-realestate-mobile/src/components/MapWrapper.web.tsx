import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

export const Marker = (props: any) => null;

const MapView = (props: any) => {
  return (
    <View style={[props.style, styles.container]}>
      <Text style={styles.text}>Maps are not supported on Web</Text>
      {props.children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    color: '#666',
    fontSize: 14,
  },
});

export default MapView;
