import React, { useState, useEffect, forwardRef } from 'react';
import { InteractionManager, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import MapView, { MapViewProps } from 'react-native-maps';
import { Colors } from '@/src/config/theme';

const DeferredMapView = forwardRef<MapView, MapViewProps>((props, ref) => {
  const [isReady, setIsReady] = useState(Platform.OS !== 'android');

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let resolved = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      resolved = true;
      setIsReady(true);
    });

    const timer = setTimeout(() => {
      if (!resolved) setIsReady(true);
    }, 500);

    return () => {
      handle.cancel();
      clearTimeout(timer);
    };
  }, []);

  if (!isReady) {
    return (
      <View style={[props.style, styles.placeholder]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <MapView ref={ref} {...props} />;
});

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default DeferredMapView;
