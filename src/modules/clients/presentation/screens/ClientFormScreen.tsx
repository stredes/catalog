import React from "react";
import { View } from "react-native";
import { AppText } from "../../../../shared/presentation/components/ui/text";

export function ClientFormScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <AppText variant="title" color="textPrimary">Formulario de Cliente</AppText>
      <AppText color="textSecondary">En desarrollo</AppText>
    </View>
  );
}
