import React, { Suspense, createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useDependencies } from './dependencies';
import { AUTHENTICATION_ENABLED } from '../shared/config/features';

const DashboardScreen = React.lazy(() => import('../modules/catalogs/presentation/screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const CatalogBuilderScreen = React.lazy(() => import('../modules/catalogs/presentation/screens/CatalogBuilderScreen').then(m => ({ default: m.CatalogBuilderScreen })));
const FamiliesScreen = React.lazy(() => import('../modules/families/presentation/screens/FamiliesScreen').then(m => ({ default: m.FamiliesScreen })));
const ProfileScreen = React.lazy(() => import('../modules/profile/presentation/screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ProductsScreen = React.lazy(() => import('../modules/products/presentation/screens/ProductsScreen').then(m => ({ default: m.ProductsScreen })));
const HistoryScreen = React.lazy(() => import('../modules/history/presentation/screens/HistoryScreen').then(m => ({ default: m.HistoryScreen })));
const OnboardingScreen = React.lazy(() => import('../modules/onboarding/presentation/screens/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const LoginScreen = React.lazy(() => import('../modules/auth/presentation/screens/LoginScreen').then(m => ({ default: m.LoginScreen })));
const RegisterScreen = React.lazy(() => import('../modules/auth/presentation/screens/RegisterScreen').then(m => ({ default: m.RegisterScreen })));
const CartScreen = React.lazy(() => import('../modules/orders/presentation/screens/CartScreen').then(m => ({ default: m.CartScreen })));
const OrderHistoryScreen = React.lazy(() => import('../modules/orders/presentation/screens/OrderHistoryScreen').then(m => ({ default: m.OrderHistoryScreen })));
const EditOrderScreen = React.lazy(() => import('../modules/orders/presentation/screens/EditOrderScreen').then(m => ({ default: m.EditOrderScreen })));
const BackupSettingsScreen = React.lazy(() => import('../modules/backup/presentation/screens/BackupSettingsScreen').then(m => ({ default: m.BackupSettingsScreen })));
const SuppliersScreen = React.lazy(() => import('../modules/suppliers/presentation/screens/SuppliersScreen').then(m => ({ default: m.SuppliersScreen })));
const SupplierPurchaseScreen = React.lazy(() => import('../modules/suppliers/presentation/screens/SupplierPurchaseScreen').then(m => ({ default: m.SupplierPurchaseScreen })));
const QuotationBuilderScreen = React.lazy(() => import('../modules/quotations/presentation/screens/QuotationBuilderScreen').then(m => ({ default: m.QuotationBuilderScreen })));
const QuotationHistoryScreen = React.lazy(() => import('../modules/quotations/presentation/screens/QuotationHistoryScreen').then(m => ({ default: m.QuotationHistoryScreen })));
const ClientsScreen = React.lazy(() => import('../modules/clients/presentation/screens/ClientsScreen').then(m => ({ default: m.ClientsScreen })));
const ClientFormScreen = React.lazy(() => import('../modules/clients/presentation/screens/ClientFormScreen').then(m => ({ default: m.ClientFormScreen })));

export type AppRoute = 'Login' | 'Register' | 'Onboarding' | 'Dashboard' | 'Products' | 'Families' | 'Catalogs' | 'CatalogBuilder' | 'Profile' | 'Cart' | 'OrderHistory' | 'PurchaseCart' | 'EditOrder' | 'Backup' | 'Suppliers' | 'QuotationBuilder' | 'QuotationEdit' | 'Quotations' | 'Clients' | 'ClientForm';

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
  if (!AUTHENTICATION_ENABLED && (route === 'Login' || route === 'Register')) {
    return <DashboardScreen />;
  }

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
    case 'QuotationBuilder':
      return <QuotationBuilderScreen />;
    case 'QuotationEdit':
      return <QuotationBuilderScreen />;
    case 'Quotations':
      return <QuotationHistoryScreen />;
    case 'Clients':
      return <ClientsScreen />;
    case 'ClientForm':
      return <ClientFormScreen />;
    case 'Dashboard':
    default:
      return <DashboardScreen />;
  }
}

export function AppNavigator() {
  const { services, autoBackupService } = useDependencies();
  const [ready, setReady] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(
    AUTHENTICATION_ENABLED ? 'Login' : 'Dashboard',
  );
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});

  useEffect(() => {
    async function initSession() {
      try {
        const onboardingCompleted = await services.preferences.getBoolean('catalog_clean_onboarding_completed');

        if (!AUTHENTICATION_ENABLED) {
          setActiveRoute(onboardingCompleted ? 'Dashboard' : 'Onboarding');
          await autoBackupService.onSessionStart();
          autoBackupService.startMonitoring();
        } else {
          const user = await services.auth.getCurrentUser();
          if (!user) {
            setActiveRoute('Login');
            return;
          }

          setActiveRoute(onboardingCompleted ? 'Dashboard' : 'Onboarding');
          await autoBackupService.onSessionStart();
          autoBackupService.startMonitoring();
        }
      } catch {
        if (AUTHENTICATION_ENABLED) {
          setActiveRoute('Login');
        } else {
          setActiveRoute('Dashboard');
        }
      } finally {
        setReady(true);
      }
    }
    void initSession();

    return () => {
      autoBackupService.stopMonitoring();
    };
  }, []);

  const navigate = useCallback((route: AppRoute, params?: Record<string, string>) => {
    setRouteParams(params ?? {});
    setActiveRoute(
      !AUTHENTICATION_ENABLED && (route === 'Login' || route === 'Register')
        ? 'Dashboard'
        : route,
    );
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
      <Suspense
        fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        }
      >
        {renderRoute(activeRoute)}
      </Suspense>
    </NavigationContext.Provider>
  );
}
