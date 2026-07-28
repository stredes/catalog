import React from "react";
import { View } from "react-native";
import { AppText } from "../../../../shared/presentation/components/ui/text";

export function ClientFormScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <AppText variant="title" color="primary">Formulario de Cliente</AppText>
      <AppText color="secondary">En desarrollo</AppText>
    </View>
  );
}
