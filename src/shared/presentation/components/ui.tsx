import { useMemo, useRef, useEffect, PropsWithChildren, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  ActivityIndicator,
  Dimensions,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, darkPalette, spacing, typography as typo, fontWeights, borderRadius, shadows, sizes, opacity as opacityTokens } from '../theme';
import { TypographyVariant } from '../theme/typography';
import { LiquidGlassContainer, setLiquidGlassScheme } from './LiquidGlassContainer';

type ColorScheme = 'light' | 'dark';
let currentScheme: ColorScheme = 'light';

export function setColorScheme(scheme: ColorScheme) {
  currentScheme = scheme;
  setLiquidGlassScheme(scheme);
}

export function c() {
  return currentScheme === 'dark' ? darkPalette : palette;
}

// ─── AppText ───────────────────────────────────────────

type AppTextColor = 'primary' | 'secondary' | 'muted' | 'disabled' | 'inverse' | 'accent' | 'info' | 'success' | 'warning' | 'error';

const colorMap: Record<AppTextColor, keyof ReturnType<typeof c>> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  muted: 'textMuted',
  disabled: 'textDisabled',
  inverse: 'textInverse',
  accent: 'textAccent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export function AppText({
  variant = 'bodyMedium',
  color = 'primary',
  weight,
  style,
  numberOfLines,
  children,
}: PropsWithChildren<{
  variant?: TypographyVariant;
  color?: AppTextColor;
  weight?: keyof typeof fontWeights;
  style?: TextStyle;
  numberOfLines?: number;
}>) {
  const colors = c();
  const token = typo[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: token.fontSize,
          fontWeight: weight ? fontWeights[weight] : token.fontWeight,
          lineHeight: token.lineHeight,
          letterSpacing: 'letterSpacing' in token ? token.letterSpacing : undefined,
          color: colors[colorMap[color]],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─── Screen ────────────────────────────────────────────

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const colors = c();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safeArea, { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 140 + insets.bottom }, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export const AppScreen = Screen;

// ─── Header ────────────────────────────────────────────

export function Header({ title, subtitle, eyebrow, action }: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  const colors = c();
  return (
    <LiquidGlassContainer variant="header" style={styles.header}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <AppText variant="caption" color="inverse" style={{ marginBottom: spacing.xs, opacity: 0.65 }}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="headingLarge" color="inverse">{title}</AppText>
          {subtitle ? (
            <AppText variant="bodySmall" color="inverse" style={{ marginTop: spacing.xs, opacity: 0.75 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action ? <View style={{ marginLeft: spacing.md }}>{action}</View> : null}
      </View>
    </LiquidGlassContainer>
  );
}

// ─── Card ──────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'selected' | 'metric';

export function Card({ children, style, onPress, variant = 'default' }: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: CardVariant;
}>) {
  const colors = c();
  const variantStyle: ViewStyle = {
    backgroundColor: variant === 'selected' ? colors.primaryLight : colors.backgroundSurface,
    borderColor: variant === 'selected' ? colors.borderActive : variant === 'metric' ? 'transparent' : colors.borderDefault,
    ...(variant === 'elevated' ? shadows.lg : variant === 'metric' ? shadows.sm : shadows.md),
  };

  const content = (
    <LiquidGlassContainer variant={variant === 'metric' ? 'cardSubtle' : 'cardSubtle'} style={[styles.card, variantStyle, style] as unknown as ViewStyle}>
      {children}
    </LiquidGlassContainer>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function CardHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <AppText variant="headingSmall" color="primary">{title}</AppText>
        {subtitle ? <AppText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>{subtitle}</AppText> : null}
      </View>
      {action ? <View style={{ marginLeft: spacing.sm }}>{action}</View> : null}
    </View>
  );
}

// ─── Button ────────────────────────────────────────────

export function Button({ label, onPress, disabled, loading, icon, variant = 'primary', color, fullWidth, accessibilityLabel }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?: string;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = c();
  const btnColor = color ?? colors.primary;

  if (variant === 'ghost') {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: Boolean(disabled) }}
        style={({ pressed }) => [
          {
            opacity: disabled ? opacityTokens.disabled : pressed ? opacityTokens.pressed : 1,
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

// ─── MetricCard ───────────────────────────────────────

export function MetricCard({ label, value, icon, accent }: {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
}) {
  const colors = c();
  const accentColor = accent ?? colors.primary;
  return (
    <Card variant="metric" style={styles.metricCard}>
      <View style={styles.metricHeader}>
        {icon ? (
          <View style={[styles.metricIconWrap, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name={icon} size={18} color={accentColor} />
          </View>
        ) : null}
        <View style={[styles.metricAccent, { backgroundColor: accentColor }]} />
      </View>
      <AppText variant="metric" color="primary">{value}</AppText>
      <AppText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>{label}</AppText>
    </Card>
  );
}

// ─── QuickActionCard ────────────────────────────────────

export function QuickActionCard({ icon, label, onPress, color }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const colors = c();
  const btnColor = color ?? colors.primary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] as any }]}>
      <Card variant="default" style={styles.quickAction}>
        <View style={[styles.quickActionIconWrap, { backgroundColor: btnColor + '18' }]}>
          <Ionicons name={icon} size={22} color={btnColor} />
        </View>
        <AppText variant="caption" color="primary" style={{ textAlign: 'center', marginTop: spacing.xs } as TextStyle}>
          {label}
        </AppText>
      </Card>
    </Pressable>
  );
}

// ─── FloatingActionButton ──────────────────────────────

export function FloatingActionButton({ icon, label, onPress, bottom }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  bottom?: number;
}) {
  const colors = c();
  const scale = useRef(new Animated.Value(1)).current;
  const animateIn = () => Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, friction: 4 }).start();
  const animateOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  return (
    <Animated.View style={[styles.fabWrapper, { bottom: bottom ?? 100, transform: [{ scale }] }]}>
      <Pressable onPress={onPress} onPressIn={animateIn} onPressOut={animateOut}>
        <LiquidGlassContainer variant="floating" style={[styles.fab, { backgroundColor: colors.primary + 'E6' }]}>
          <Ionicons name={icon} size={20} color={colors.textInverse} />
          <AppText variant="labelLarge" color="inverse" style={{ marginLeft: spacing.sm }}>{label}</AppText>
        </LiquidGlassContainer>
      </Pressable>
    </Animated.View>
  );
}

// ─── ProductCard (responsive) ──────────────────────────

export function ProductCard({ name, price, format, family, supplier, photoUri, stock, onPress, onEdit, onDelete, onIncrement, onDecrement, onStockChange }: {
  name: string;
  price: string;
  format: string;
  family: string;
  supplier?: string;
  photoUri?: string | null;
  stock?: number;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onStockChange?: (newStock: number) => void;
}) {
  const colors = c();
  const { width } = useWindowDimensions();
  const horizontalPadding = 20;
  const gap = 12;
  const columns = 2;
  const cardWidth = Math.floor((width - horizontalPadding * 2 - gap * (columns - 1)) / columns);

  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, friction: 4 }).start();
  const animateOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();

  const formatColors: Record<string, string> = {
    unit: colors.secondary,
    box: colors.warning,
    pack: colors.success,
    service: colors.error,
  };
  const fmtColor = formatColors[format] ?? colors.primary;

  const AnimatedPressable = useMemo(() => Animated.createAnimatedComponent(Pressable), []);
  const [editingStock, setEditingStock] = useState(false);
  const [stockInputValue, setStockInputValue] = useState('');
  const stockInputRef = useRef<TextInput>(null);

  const handleStockPress = () => {
    if (onStockChange && stock !== undefined) {
      setStockInputValue(String(stock));
      setEditingStock(true);
    }
  };

  const confirmStockEdit = () => {
    const parsed = parseInt(stockInputValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && onStockChange) {
      onStockChange(parsed);
    }
    setEditingStock(false);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      style={{ transform: [{ scale }], width: cardWidth, marginBottom: spacing.md }}
    >
      <Card variant="default" style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImagePlaceholder, { backgroundColor: colors.borderSubtle }]}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        <View style={[styles.productInfo, { minWidth: 0 }]}>
          <AppText variant="bodyMedium" color="primary" numberOfLines={2} style={{ lineHeight: 18 }}>{name}</AppText>
          <AppText variant="price" color="accent" numberOfLines={1} style={{ marginTop: spacing.xs }}>{price}</AppText>
          <View style={[styles.productMeta, { marginTop: spacing.sm }]}>
            <View style={[styles.formatBadge, { backgroundColor: fmtColor + '18' }]}>
              <AppText variant="caption" color="muted" style={{ color: fmtColor }}>{format}</AppText>
            </View>
          </View>
          <AppText variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 2 }}>{family}</AppText>
          {supplier ? (
            <AppText variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 1, color: '#8B5CF6' }}>{supplier}</AppText>
          ) : null}
          {stock !== undefined ? (
            <View style={[styles.stockCounter, { marginTop: spacing.sm }]}>
              <Pressable
                onPress={onDecrement}
                style={[styles.stockButton, { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name="remove" size={16} color={colors.primary} />
              </Pressable>
              {editingStock ? (
                <TextInput
                  ref={stockInputRef}
                  value={stockInputValue}
                  onChangeText={setStockInputValue}
                  onBlur={confirmStockEdit}
                  onSubmitEditing={confirmStockEdit}
                  keyboardType="numeric"
                  returnKeyType="done"
                  selectTextOnFocus
                  autoFocus
                  style={[styles.stockInput, { backgroundColor: colors.borderSubtle, color: colors.primary }]}
                />
              ) : (
                <Pressable
                  onPress={handleStockPress}
                  style={[styles.stockValue, { backgroundColor: colors.borderSubtle }]}
                >
                  <AppText variant="labelLarge" color="primary" style={{ fontWeight: '700' as any, textAlign: 'center', minWidth: 28 }}>
                    {stock}
                  </AppText>
                </Pressable>
              )}
              <Pressable
                onPress={onIncrement}
                style={[styles.stockButton, { backgroundColor: colors.primaryLight }]}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.rowActions, { marginTop: spacing.sm }]}>
            <Pressable onPress={onEdit} style={[styles.iconButtonSmall, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="ellipsis-horizontal" size={16} color={colors.primary} />
            </Pressable>
            {onDelete ? (
              <Pressable onPress={onDelete} style={[styles.iconButtonSmall, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Card>
    </AnimatedPressable>
  );
}

// ─── FamilyCard ────────────────────────────────────────

export function FamilyCard({ name, productCount, color, onEdit, onDelete, onPress }: {
  name: string;
  productCount: number;
  color?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}) {
  const colors = c();
  const cardColor = color ?? colors.primary;
  return (
    <Pressable onPress={onPress}>
      <Card variant="default" style={[styles.familyCard, { borderLeftColor: cardColor, borderLeftWidth: 4 }]}>
        <View style={styles.familyCardContent}>
          <View style={[styles.familyIcon, { backgroundColor: cardColor + '18' }]}>
            <Ionicons name="folder-outline" size={24} color={cardColor} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="bodyMedium" color="primary" numberOfLines={1}>{name}</AppText>
            <AppText variant="bodySmall" color="muted">{productCount} productos</AppText>
          </View>
          <View style={styles.rowActions}>
            {onEdit ? (
              <Pressable onPress={onEdit} style={[styles.iconButtonSmall, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete} style={[styles.iconButtonSmall, { backgroundColor: colors.errorLight }]}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

// ─── CatalogHistoryItem ────────────────────────────────

export function CatalogHistoryItem({ name, format, purpose, date, productCount, onShare, onDuplicate, onDelete }: {
  name: string;
  format: string;
  purpose?: string;
  date: string;
  productCount: number;
  onShare?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const colors = c();
  const formatLabels: Record<string, string> = {
    'grid-2': 'Grilla 2',
    'grid-3': 'Grilla 3',
    'grid-4x5': 'Grilla 4×5',
    'grid-3x7': 'Grilla 3×7',
    'simple-list': 'Lista',
    'premium-cover': 'Premium',
  };

  const isPurchaseDetail = purpose === 'purchase-detail';
  const iconBg = isPurchaseDetail ? colors.primaryLight : colors.errorLight;
  const iconColor = isPurchaseDetail ? colors.primary : colors.error;
  const iconName = isPurchaseDetail ? 'cart-outline' : 'document-text-outline';

  return (
    <Card variant="default" style={styles.historyItem}>
      <View style={[styles.pdfIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: fontWeights.semiBold }}>{name}</AppText>
        <View style={styles.historyMeta}>
          {isPurchaseDetail ? (
            <AppText variant="caption" color="accent" style={{ fontWeight: '600' as any }}>COMPRA</AppText>
          ) : (
            <AppText variant="caption" color="muted">{formatLabels[format] ?? format}</AppText>
          )}
          <AppText variant="caption" color="muted" style={{ marginHorizontal: 4 }}>·</AppText>
          <AppText variant="caption" color="muted">{date}</AppText>
          <AppText variant="caption" color="muted" style={{ marginHorizontal: 4 }}>·</AppText>
          <AppText variant="caption" color="muted">{productCount} prod.</AppText>
        </View>
      </View>
      <View style={styles.historyActions}>
        {onShare ? (
          <Pressable onPress={onShare} style={[styles.iconButtonSmall, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="share-social-outline" size={16} color={colors.primary} />
          </Pressable>
        ) : null}
        {onDuplicate ? (
          <Pressable onPress={onDuplicate} style={[styles.iconButtonSmall, { backgroundColor: colors.successLight }]}>
            <Ionicons name="copy-outline" size={16} color={colors.success} />
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable onPress={onDelete} style={[styles.iconButtonSmall, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

// ─── RecentProductCard ─────────────────────────────────

export function RecentProductCard({ name, format, price, onPress }: {
  name: string;
  format: string;
  price: string;
  onPress?: () => void;
}) {
  const colors = c();
  return (
    <Card variant="default" style={{ marginBottom: spacing.sm }} onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="bodyMedium" color="primary" numberOfLines={1}>{name}</AppText>
          <AppText variant="bodySmall" color="muted">{format}</AppText>
        </View>
        <AppText variant="price" color="accent">{price}</AppText>
      </View>
    </Card>
  );
}

// ─── SearchInput ───────────────────────────────────────

export function SearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) {
  const colors = c();
  return (
    <View style={[styles.searchBar, { backgroundColor: colors.backgroundSurface, borderColor: colors.borderDefault }]}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Buscar...'}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.textPrimary }]}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── FilterChip ────────────────────────────────────────

export function FilterChip({ label, selected, onPress }: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = c();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.backgroundSurface,
          borderColor: selected ? colors.primary : colors.borderDefault,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? 'inverse' : 'muted'} style={{ color: selected ? colors.textInverse : colors.textSecondary } as TextStyle}>
        {label}
      </AppText>
    </Pressable>
  );
}

// ─── Badge ─────────────────────────────────────────────

export function Badge({ label, color }: {
  label: string;
  color?: string;
}) {
  const colors = c();
  const badgeColor = color ?? colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: badgeColor + '18' }]}>
      <AppText variant="caption" color="muted" style={{ color: badgeColor } as TextStyle}>{label}</AppText>
    </View>
  );
}

// ─── PrimaryButton / SecondaryButton aliases ────────────

export function PrimaryButton(props: Omit<React.ComponentProps<typeof Button>, 'variant'>) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<React.ComponentProps<typeof Button>, 'variant'>) {
  return <Button variant="secondary" {...props} />;
}

export function GhostButton(props: Omit<React.ComponentProps<typeof Button>, 'variant'>) {
  return <Button variant="ghost" {...props} />;
}

export const AppCard = Card;

export function InteractiveCard(props: React.ComponentProps<typeof Card>) {
  return <Card variant="interactive" {...props} />;
}

export function AppDivider() {
  return <Divider />;
}

export const SearchField = SearchInput;
export const AppChip = ChoiceChip;

export function StatusBadge({ label, tone = 'info' }: {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const colors = c();
  const toneColor = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[tone];

  return <Badge label={label} color={toneColor} />;
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: tone === 'primary' ? colors.primaryLight : tone === 'danger' ? colors.destructiveLight : colors.surfaceMuted,
          opacity: disabled ? opacityTokens.disabled : pressed ? opacityTokens.pressed : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={toneColor} />
    </Pressable>
  );
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

export function SkeletonCard() {
  return (
    <Card style={{ gap: spacing.md }}>
      <SkeletonLoader height={18} style={{ width: '72%' }} />
      <SkeletonLoader height={12} style={{ width: '92%' }} />
      <SkeletonLoader height={12} style={{ width: '48%' }} />
    </Card>
  );
}

// ─── SearchBar alias ────────────────────────────────────

export const SearchBar = SearchInput;

// ─── EmptyStateIllustrated alias ────────────────────────

export function EmptyStateIllustrated(props: React.ComponentProps<typeof EmptyState>) {
  return <EmptyState {...props} />;
}

// ─── EmptyState ────────────────────────────────────────

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

// ─── Section ───────────────────────────────────────────

export function Section({ title, action, children }: PropsWithChildren<{
  title: string;
  action?: React.ReactNode;
}>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="headingSmall" color="primary">{title}</AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

// ─── Divider ───────────────────────────────────────────

export function Divider() {
  const colors = c();
  return <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />;
}

// ─── BottomSheet ───────────────────────────────────────

export function BottomSheet({ visible, onClose, title, children, stickyFooter }: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  stickyFooter?: React.ReactNode;
}>) {
  const colors = c();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 400,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBg} onPress={onClose} />
      <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.backgroundElevated, transform: [{ translateY }] }]}>
        <View style={[styles.bottomSheetHandle, { backgroundColor: colors.borderDefault }]} />
        {title ? <AppText variant="headingSmall" color="primary" style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>{title}</AppText> : null}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: stickyFooter ? 0 : insets.bottom }}>
          <View style={{ padding: spacing.xl }}>{children}</View>
        </ScrollView>
        {stickyFooter ? (
          <View style={[styles.bottomSheetFooter, { paddingBottom: insets.bottom, backgroundColor: colors.backgroundElevated }]}>
            {stickyFooter}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

// ─── ConfirmDialog ─────────────────────────────────────

export function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive }: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  const colors = c();
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBg} onPress={onCancel} />
      <View style={[styles.dialog, { backgroundColor: colors.backgroundElevated }]}>
        <AppText variant="headingSmall" color="primary" style={{ textAlign: 'center' }}>{title}</AppText>
        <AppText variant="bodyMedium" color="muted" style={{ textAlign: 'center', marginTop: spacing.md }}>{message}</AppText>
        <View style={styles.dialogActions}>
          <Pressable onPress={onCancel} style={[styles.dialogButton, { backgroundColor: colors.borderSubtle }]}>
            <AppText variant="labelLarge" color="muted">{cancelLabel ?? 'Cancelar'}</AppText>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[styles.dialogButton, { backgroundColor: destructive ? colors.destructive : colors.primary }]}
          >
            <AppText variant="labelLarge" color="inverse">{confirmLabel ?? 'Confirmar'}</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── SkeletonLoader ────────────────────────────────────

export function SkeletonLoader({ width, height, style }: {
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  const colors = c();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[styles.skeleton, { width: width ?? '100%' as any, height: height ?? 16, backgroundColor: colors.borderDefault, opacity }, style]}
    />
  );
}

// ─── WizardStep ────────────────────────────────────────

export function WizardStep({ step, total, title, children }: PropsWithChildren<{
  step: number;
  total: number;
  title: string;
}>) {
  const colors = c();
  return (
    <View>
      <View style={styles.wizardProgress}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.wizardDot,
              {
                backgroundColor: i < step ? colors.primary : i === step ? colors.primary + '60' : colors.borderDefault,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
      <AppText variant="headingMedium" color="primary" style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>{title}</AppText>
      {children}
    </View>
  );
}

// ─── ChoiceChip ────────────────────────────────────────

export function ChoiceChip({ label, selected, onPress, color }: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}) {
  const colors = c();
  const chipColor = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? chipColor : colors.backgroundSurface,
          borderColor: selected ? chipColor : colors.borderDefault,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? 'inverse' : 'muted'} style={{ color: selected ? colors.textInverse : colors.textSecondary } as TextStyle}>
        {label}
      </AppText>
    </Pressable>
  );
}

// ─── Input ─────────────────────────────────────────────

export function Input({ label, error, ...props }: {
  label?: string;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  const colors = c();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <AppText variant="labelMedium" color="muted" style={{ marginBottom: spacing.xs }}>{label}</AppText> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSurface,
            borderColor: error ? colors.error : colors.borderDefault,
            color: colors.textPrimary,
          },
        ]}
        {...props}
      />
      {error ? <AppText variant="bodySmall" color="error" style={{ marginTop: spacing.xs }}>{error}</AppText> : null}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { gap: spacing.lg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },

  header: { padding: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center' },

  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.xl, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },

  primaryButton: {
    alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg,
    paddingVertical: 15, paddingHorizontal: 24, minHeight: 50,
  },
  secondaryButton: {
    alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg,
    borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 24, minHeight: 50,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  metricCard: { width: '47%', padding: spacing.lg },
  metricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  metricIconWrap: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  metricAccent: { width: 4, height: 22, borderRadius: 2 },

  quickAction: { alignItems: 'center', padding: spacing.lg, width: '100%', minHeight: 80 },
  quickActionIconWrap: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },

  fabWrapper: { position: 'absolute', right: 20, zIndex: 100 },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: borderRadius.full },

  productImage: { width: '100%', height: 120, backgroundColor: '#E2E8F0' },
  productImagePlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: spacing.md },
  productMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  formatBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.sm },

  stockCounter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 0 },
  stockButton: { width: 30, height: 28, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  stockValue: { paddingHorizontal: 8, height: 28, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  stockInput: { paddingHorizontal: 8, height: 28, borderRadius: borderRadius.sm, minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: '700' },

  familyCard: { padding: spacing.lg, borderLeftWidth: 4 },
  familyCardContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  familyIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },

  historyItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  pdfIconWrap: { width: 44, height: 44, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  historyMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  historyActions: { flexDirection: 'row', gap: 4 },

  rowActions: { flexDirection: 'row', gap: 8 },
  iconButtonSmall: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: borderRadius.lg, borderWidth: 1.5, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },

  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1.5, minHeight: 32, justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },

  divider: { height: 1, marginVertical: spacing.lg },

  input: { borderRadius: borderRadius.lg, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '500' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full, borderWidth: 1.5 },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 200 },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  dialog: { margin: 24, borderRadius: borderRadius.xxl, padding: 24, alignItems: 'center' },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  dialogButton: { flex: 1, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },

  bottomSheet: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, height: '100%', maxHeight: '90%' },
  bottomSheetFooter: { borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: spacing.xl, paddingTop: spacing.md },
  bottomSheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },

  skeleton: { borderRadius: borderRadius.sm },
  stateBlock: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },

  wizardProgress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wizardDot: { height: 8, borderRadius: 4 },
});

export const ui = styles;
