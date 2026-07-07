import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { ProductsScreen } from '../modules/products/presentation/screens/products-screen';
import { CatalogScreen } from '../modules/catalogs/catalog-screen';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Productos" component={ProductsScreen} />
        <Tab.Screen name="Catálogos" component={CatalogScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
