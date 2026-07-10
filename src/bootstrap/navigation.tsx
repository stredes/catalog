import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DashboardScreen } from '../modules/catalogs/presentation/screens/DashboardScreen';
import { CatalogBuilderScreen } from '../modules/catalogs/presentation/screens/CatalogBuilderScreen';
import { FamiliesScreen } from '../modules/families/presentation/screens/FamiliesScreen';
import { ProfileScreen } from '../modules/profile/presentation/screens/ProfileScreen';
import { ProductsScreen } from '../modules/products/presentation/screens/ProductsScreen';
import { HistoryScreen } from '../modules/history/presentation/screens/HistoryScreen';
import { OnboardingScreen } from '../modules/onboarding/presentation/screens/OnboardingScreen';
import { useDependencies } from './dependencies';

export type AppRoute = 'Onboarding' | 'Dashboard' | 'Products' | 'Families' | 'Catalogs' | 'CatalogBuilder' | 'Profile';

const ONBOARDING_KEY = 'catalog_clean_onboarding_completed';

type NavigationContextValue = {
  activeRoute: AppRoute;
  navigate: (route: AppRoute) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useAppNavigation() {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error('useAppNavigation must be used inside AppNavigator');
  }

  return context;
}

function renderRoute(route: AppRoute) {
  switch (route) {
    case 'Onboarding':
      return <OnboardingScreen />;
    case 'Products':
      return <ProductsScreen />;
    case 'Families':
      return <FamiliesScreen />;
    case 'Catalogs':
      return <HistoryScreen />;
    case 'CatalogBuilder':
      return <CatalogBuilderScreen />;
    case 'Profile':
      return <ProfileScreen />;
    case 'Dashboard':
    default:
      return <DashboardScreen />;
  }
}

export function AppNavigator() {
  const { services } = useDependencies();
  const [ready, setReady] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppRoute>('Dashboard');

  useEffect(() => {
    services.preferences.getBoolean(ONBOARDING_KEY).then((completed) => {
      setActiveRoute(completed ? 'Dashboard' : 'Onboarding');
      setReady(true);
    });
  }, []);

  const navigation = useMemo(
    () => ({ activeRoute, navigate: setActiveRoute }),
    [activeRoute],
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContext.Provider value={navigation}>
      {renderRoute(activeRoute)}
    </NavigationContext.Provider>
  );
}
