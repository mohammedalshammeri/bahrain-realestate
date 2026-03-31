import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from '../src/components/MapWrapper';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../src/components/Button';
import { textAlignStart } from '../src/utils/rtl';
import { useLocationStore } from '../src/store/locationStore';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function LocationPicker() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const textAlign = textAlignStart();
  const setTempSelectedLocation = useLocationStore((s) => s.setTempSelectedLocation);

  const [region, setRegion] = useState<LocationData>({
    latitude: 26.0667, // Bahrain coordinates
    longitude: 50.5577,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    // If location data is passed from property details, center on it
    if (params.latitude && params.longitude) {
      const lat = parseFloat(params.latitude as string);
      const lng = parseFloat(params.longitude as string);
      
      // Only update if significantly different to avoid loops
      // Check if we already have this location set to avoid re-rendering loop
      if (!selectedLocation || 
          Math.abs(selectedLocation.latitude - lat) > 0.0001 || 
          Math.abs(selectedLocation.longitude - lng) > 0.0001) {
          
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSelectedLocation({ latitude: lat, longitude: lng });
      }
    }
  }, [params.latitude, params.longitude]);

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      Alert.alert(
        t('location.title') || 'Select Location',
        t('location.selectPrompt') || 'Please select a location on the map'
      );
      return;
    }

    // Navigate back to the previous screen (Add Property) with new params.
    // 'navigate' tends to find the existing route in stack and go back to it if possible, 
    // Use Global Store and dismiss() to ensure clean stack history
    setTempSelectedLocation({
      lat: selectedLocation.latitude.toString(),
      lng: selectedLocation.longitude.toString()
    });
    
    // Simply go back. The previous screen (add) will read from store on focus.
    if (router.canGoBack()) {
       router.back();
    } else {
       // Fallback if accessed directly (unlikely)
       router.replace(params.returnPath as string || '/company/add');
    }
  };

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('location.permissionDenied') || 'Permission Denied',
          t('location.permissionDeniedMsg') || 'Please allow location access to use this feature'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      setSelectedLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('GPS error:', error);
      // Fallback to Bahrain center
      const bahrainLocation = { latitude: 26.0667, longitude: 50.5577 };
      setSelectedLocation(bahrainLocation);
      setRegion({ ...bahrainLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      Alert.alert(
        t('location.gpsError') || 'GPS Error',
        t('location.gpsErrorMsg') || 'Could not get your location. Showing Bahrain center.'
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSkipLocation = () => {
    // Allow user to skip location selection
    router.replace({
      pathname: params.returnPath as string || '/company/add',
      params: {
        action: 'location_skipped',
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('location.title') || 'Location' }} />
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign }]}>
          {t('location.selectLocation') || 'Select Property Location'}
        </Text>
        <Text style={[styles.subtitle, { textAlign }]}>
          {t('location.tapToSelect') || 'Tap on the map to select the property location'}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title={t('location.selectedLocation') || 'Selected Location'}
              description={`${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
            />
          )}
        </MapView>
      </View>

      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={[styles.coordinates, { textAlign }]}>
            {t('location.coordinates') || 'Coordinates'}: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleUseCurrentLocation}
        >
          <Text style={styles.secondaryButtonText}>
            {t('location.useCurrentLocation') || 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipLocation}
        >
          <Text style={styles.skipButtonText}>
            {t('common.skip') || 'Skip'}
          </Text>
        </TouchableOpacity>

        <Button
          title={t('location.confirmLocation') || 'Confirm Location'}
          onPress={handleConfirmLocation}
          variant="success"
          style={styles.confirmButton}
          disabled={!selectedLocation}
        />
      </View>
    </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00305D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  coordinates: {
    fontSize: 14,
    color: '#00305D',
    fontFamily: 'monospace',
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  secondaryButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#00305D',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#00305D',
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#C6A55E',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  skipButtonText: {
    color: '#C6A55E',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    marginTop: 10,
  },
});
