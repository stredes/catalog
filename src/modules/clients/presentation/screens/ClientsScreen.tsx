import React from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";
import { AppText } from "../../../../shared/presentation/components/ui/text";

export function ClientsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <AppText variant="title" color="textPrimary" style={{ marginBottom: 12 }}>
        Clientes
      </AppText>
      <AppText color="textSecondary">Modulo de clientes en desarrollo</AppText>
    </View>
  );
}
