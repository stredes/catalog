import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReAnimated, { FadeInUp, useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from './Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppRoute, useAppNavigation } from '../../../bootstrap/navigation';
import { borderRadius, sizes, spacing } from '../theme';
import { LiquidGlassContainer } from './LiquidGlassContainer';
import { AppText, c } from './ui';

type TabItem = {
  route: AppRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const items: TabItem[] = [
  { route: 'Dashboard', label: 'Inicio', icon: 'home-outline', iconActive: 'home' },
  { route: 'Products', label: 'Productos', icon: 'cube-outline', iconActive: 'cube' },
  { route: 'Families', label: 'Familias', icon: 'folder-outline', iconActive: 'folder' },
  { route: 'Catalogs', label: 'Catalogos', icon: 'document-text-outline', iconActive: 'document-text' },
  { route: 'Profile', label: 'Perfil', icon: 'settings-outline', iconActive: 'settings' },
];

function TabButton({ item, isActive, onPress }: {
  item: TabItem;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const activeScale = useSharedValue(isActive ? 1 : 0.96);

  if (isActive && translateY.value === 0) {
    translateY.value = withSpring(-2, { damping: 14, stiffness: 100 });
    activeScale.value = withTiming(1, { duration: 200 });
  } else if (!isActive && translateY.value !== 0) {
    translateY.value = withSpring(0, { damping: 14, stiffness: 100 });
    activeScale.value = withTiming(0.96, { duration: 150 });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * activeScale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 14 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14 });
  }, [scale]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabTouchable}
    >
      <ReAnimated.View style={[styles.tabItem, animatedStyle]}>
        {isActive ? (
          <LiquidGlassContainer variant="floating" style={styles.tabItemActiveContent}>
            <Ionicons name={item.iconActive} size={22} color={c().primary} />
            <AppText variant="caption" color="accent" numberOfLines={1} style={{ marginTop: 2, color: c().primary } as any}>
              {item.label}
            </AppText>
            <View style={[styles.activeIndicator, { backgroundColor: c().primary }]} />
          </LiquidGlassContainer>
        ) : (
          <>
            <Ionicons name={item.icon} size={22} color={c().textMuted} />
            <AppText variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 2, color: c().textMuted } as any}>
              {item.label}
            </AppText>
          </>
        )}
      </ReAnimated.View>
    </Pressable>
  );
}

export function BottomMenu() {
  const { activeRoute, navigate } = useAppNavigation();
  const insets = useSafeAreaInsets();

  return (
    <ReAnimated.View entering={FadeInUp.duration(500).springify()} style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <LiquidGlassContainer variant="tabBar" style={styles.menu}>
        {items.map((item) => (
          <TabButton
            key={item.route}
            item={item}
            isActive={activeRoute === item.route}
            onPress={() => navigate(item.route)}
          />
        ))}
      </LiquidGlassContainer>
    </ReAnimated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    position: 'absolute',
    right: 0,
  },
  menu: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tabTouchable: {
    alignItems: 'center',
    flex: 1,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 2,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  tabItemActiveContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  activeIndicator: {
    borderRadius: 1.5,
    height: 3,
    marginTop: spacing.xs,
    width: 16,
  },
});
