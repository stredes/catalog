import { useCallback } from 'react';
import { Pressable, View, ActivityIndicator, TextStyle } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '../Icon';
import { spacing, sizes, motion, opacity as opacityTokens, shadows } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';
import { LiquidGlassContainer } from '../LiquidGlassContainer';

export function Button({ label, onPress, disabled, loading, icon, variant = 'primary', color, fullWidth, accessibilityLabel, testID }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?: string;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const colors = c();
  const btnColor = color ?? colors.primary;

  const ghostScale = useSharedValue(1);

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ghostScale.value }],
  }));

  const handleGhostPressIn = useCallback(() => {
    ghostScale.value = withSpring(motion.pressScale, { damping: motion.springDamping, stiffness: motion.springStiffness });
  }, [ghostScale]);

  const handleGhostPressOut = useCallback(() => {
    ghostScale.value = withSpring(1, { damping: motion.springDamping, stiffness: motion.springStiffness });
  }, [ghostScale]);

  if (variant === 'ghost') {
    return (
      <Animated.View style={ghostStyle}>
        <Pressable
          disabled={disabled}
          onPress={onPress}
          onPressIn={handleGhostPressIn}
          onPressOut={handleGhostPressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: Boolean(disabled) }}
          testID={testID}
          style={[
            {
              opacity: disabled ? opacityTokens.disabled : 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              minHeight: sizes.touchTarget,
              alignSelf: fullWidth ? 'stretch' : 'auto',
            },
          ]}
        >
          <View style={styles.buttonContent}>
            {icon ? <Ionicons name={icon} size={18} color={btnColor} /> : null}
            <AppText variant="labelLarge" color="secondary" style={{ color: btnColor } as TextStyle}>{label}</AppText>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
        testID={testID}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            backgroundColor: btnColor + '14',
            borderColor: btnColor + '30',
            opacity: disabled ? opacityTokens.disabled : pressed ? opacityTokens.pressed : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            alignSelf: fullWidth ? 'stretch' : 'auto',
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={btnColor} size="small" />
        ) : (
          <View style={styles.buttonContent}>
            {icon ? <Ionicons name={icon} size={18} color={btnColor} /> : null}
            <AppText variant="labelLarge" color="secondary" style={{ color: btnColor } as TextStyle}>{label}</AppText>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      testID={testID}
      style={({ pressed }) => [
        shadows.md,
        styles.primaryButton,
        {
          backgroundColor: disabled ? colors.textDisabled : btnColor,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <Ionicons name={icon} size={20} color={colors.textInverse} /> : null}
          <AppText variant="labelLarge" color="inverse">{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<React.ComponentProps<typeof Button>, 'variant'>) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<React.ComponentProps<typeof Button>, 'variant'>) {
  return <Button variant="secondary" {...props} />;
}

export function GhostButton(props: Omit<React.ComponentProps<typeof Button>, 'variant'>) {
  return <Button variant="ghost" {...props} />;
}

export function IconButton({ icon, label, onPress, tone = 'default', disabled }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  const colors = c();
  const toneColor = tone === 'danger' ? colors.danger : tone === 'primary' ? colors.primary : colors.textSecondary;
  const iconScale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleIconPressIn = useCallback(() => {
    iconScale.value = withSpring(motion.pressScale, { damping: motion.springDamping, stiffness: motion.springStiffness });
  }, [iconScale]);

  const handleIconPressOut = useCallback(() => {
    iconScale.value = withSpring(1, { damping: motion.springDamping, stiffness: motion.springStiffness });
  }, [iconScale]);

  return (
    <Animated.View style={iconStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={handleIconPressIn}
        onPressOut={handleIconPressOut}
        style={[
          styles.iconButton,
          {
            backgroundColor: tone === 'primary' ? colors.primaryLight : tone === 'danger' ? colors.destructiveLight : colors.surfaceMuted,
            opacity: disabled ? opacityTokens.disabled : 1,
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={toneColor} />
      </Pressable>
    </Animated.View>
  );
}

export function FloatingActionButton({ icon, label, onPress, bottom }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  bottom?: number;
}) {
  const colors = c();
  const scale = useSharedValue(1);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(1.05, { damping: 8 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 8 });
  }, [scale]);

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(400).springify()}
      style={[styles.fabWrapper, { bottom: bottom ?? 100 }, fabStyle]}
    >
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <LiquidGlassContainer variant="floating" style={[styles.fab, { backgroundColor: colors.primary + 'E6' }]}>
          <Ionicons name={icon} size={20} color={colors.textInverse} />
          <AppText variant="labelLarge" color="inverse" style={{ marginLeft: spacing.sm }}>{label}</AppText>
        </LiquidGlassContainer>
      </Pressable>
    </Animated.View>
  );
}
