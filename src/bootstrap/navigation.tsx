import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DashboardScreen } from '../modules/catalogs/presentation/screens/DashboardScreen';
import { CatalogBuilderScreen } from '../modules/catalogs/presentation/screens/CatalogBuilderScreen';
import { FamiliesScreen } from '../modules/families/presentation/screens/FamiliesScreen';
import { ProfileScreen } from '../modules/profile/presentation/screens/ProfileScreen';
import { ProductsScreen } from '../modules/products/presentation/screens/ProductsScreen';
import { HistoryScreen } from '../modules/history/presentation/screens/HistoryScreen';
import { OnboardingScreen } from '../modules/onboarding/presentation/screens/OnboardingScreen';
import { LoginScreen } from '../modules/auth/presentation/screens/LoginScreen';
import { RegisterScreen } from '../modules/auth/presentation/screens/RegisterScreen';
import { CartScreen } from '../modules/orders/presentation/screens/CartScreen';
import { OrderHistoryScreen } from '../modules/orders/presentation/screens/OrderHistoryScreen';
import { EditOrderScreen } from '../modules/orders/presentation/screens/EditOrderScreen';
import { BackupSettingsScreen } from '../modules/backup/presentation/screens/BackupSettingsScreen';
import { SuppliersScreen } from '../modules/suppliers/presentation/screens/SuppliersScreen';
import { SupplierPurchaseScreen } from '../modules/suppliers/presentation/screens/SupplierPurchaseScreen';
import { useDependencies } from './dependencies';

export type AppRoute = 'Login' | 'Register' | 'Onboarding' | 'Dashboard' | 'Products' | 'Families' | 'Catalogs' | 'CatalogBuilder' | 'Profile' | 'Cart' | 'OrderHistory' | 'PurchaseCart' | 'EditOrder' | 'Backup' | 'Suppliers';

type NavigationContextValue = {
  activeRoute: AppRoute;
  navigate: (route: AppRoute, params?: Record<string, string>) => void;
  routeParams: Record<string, string>;
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
    case 'Login':
      return <LoginScreen />;
    case 'Register':
      return <RegisterScreen />;
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
    case 'Cart':
      return <CartScreen />;
    case 'OrderHistory':
      return <OrderHistoryScreen />;
    case 'PurchaseCart':
      return <SupplierPurchaseScreen />;
    case 'EditOrder':
      return <EditOrderScreen />;
    case 'Backup':
      return <BackupSettingsScreen />;
    case 'Suppliers':
      return <SuppliersScreen />;
    case 'Dashboard':
    default:
      return <DashboardScreen />;
  }
}

export function AppNavigator() {
  const { services } = useDependencies();
  const [ready, setReady] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppRoute>('Login');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});

  useEffect(() => {
    setActiveRoute('Dashboard');
    setReady(true);
  }, []);

  const navigate = useCallback((route: AppRoute, params?: Record<string, string>) => {
    setRouteParams(params ?? {});
    setActiveRoute(route);
  }, []);

  const navigation = useMemo(
    () => ({ activeRoute, navigate, routeParams }),
    [activeRoute, navigate, routeParams],
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
