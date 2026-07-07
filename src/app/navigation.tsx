import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { ProductsScreen } from '../modules/products/presentation/screens/products-screen';
import { CatalogScreen } from '../modules/catalogs/catalog-screen';
import { ProfileScreen } from '../modules/profile/presentation/screens/profile-screen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E8EAED' },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Productos"
          component={ProductsScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📦</Text> }}
        />
        <Tab.Screen
          name="Catálogos"
          component={CatalogScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📄</Text> }}
        />
        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
