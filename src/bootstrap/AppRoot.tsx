import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../shared/presentation/ThemeContext';
import { DependencyProvider, useDependencies } from './dependencies';
import { AppNavigator } from './navigation';

function SentryInit() {
  const { services } = useDependencies();

  useEffect(() => {
    services.errorReporter.init();
  }, []);

  return null;
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <SentryInit />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DependencyProvider>
          <AppContent />
        </DependencyProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
