import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppNavigator } from './navigation';
import { initializeDatabase } from './bootstrap';

export function Main() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      initializeDatabase();
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AppNavigator />;
}
