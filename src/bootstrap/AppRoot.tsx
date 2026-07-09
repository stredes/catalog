import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../shared/presentation/ThemeContext';
import { DependencyProvider } from './dependencies';
import { AppNavigator } from './navigation';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
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
