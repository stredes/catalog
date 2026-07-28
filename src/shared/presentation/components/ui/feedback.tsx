import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { Ionicons } from '../Icon';
import { spacing } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';
import { Button } from './buttons';

export function ProgressBar({ progress, color, height = 4, style }: {
  progress: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}) {
  const colors = c();
  const barColor = color ?? colors.primary;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  return (
    <View style={[styles.progressBar, { height }, style]}>
      <View
        style={[
          styles.progressFill,
          { backgroundColor: barColor },
          { transform: [{ scaleX: clampedProgress }] },
        ]}
      />
    </View>
  );
}

export function SkeletonLoader({ width, height, style }: {
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  const colors = c();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));

  return (
    <Animated.View
      style={[styles.skeleton, { width: width ?? '100%' as any, height: height ?? 16, backgroundColor: colors.borderDefault }, animatedStyle, style]}
    />
  );
}

export function EmptyState({ icon, title, description, subtitle, actionLabel, onAction, action }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}) {
  const desc = description ?? subtitle ?? '';
  const colors = c();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <AppText variant="headingSmall" color="primary" style={{ textAlign: 'center', marginTop: spacing.lg }}>{title}</AppText>
      {desc ? <AppText variant="bodyMedium" color="muted" style={{ textAlign: 'center', marginTop: spacing.sm }}>{desc}</AppText> : null}
      {action}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.xl }}>
          <Button label={actionLabel} icon="add-circle-outline" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyStateIllustrated(props: React.ComponentProps<typeof EmptyState>) {
  return <EmptyState {...props} />;
}

export function LoadingState({ title = 'Cargando', description = 'Preparando la informacion.' }: {
  title?: string;
  description?: string;
}) {
  return (
    <View style={styles.stateBlock}>
      <SkeletonLoader height={18} style={{ width: '56%' }} />
      <SkeletonLoader height={12} style={{ width: '82%', marginTop: spacing.sm }} />
      <AppText variant="headingSmall" color="primary" style={{ marginTop: spacing.xl }}>{title}</AppText>
      <AppText variant="bodySmall" color="muted" style={{ marginTop: spacing.xs, textAlign: 'center' }}>{description}</AppText>
    </View>
  );
}

export function ErrorState({ title, description, actionLabel, onAction }: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
