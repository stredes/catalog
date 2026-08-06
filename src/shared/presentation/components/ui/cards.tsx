import { memo, useCallback, useRef, useState, PropsWithChildren } from 'react';
import { Pressable, View, Image, useWindowDimensions, TextInput, TextStyle, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, Layout as ReanimatedLayout } from 'react-native-reanimated';
import { Ionicons } from '../Icon';
import { spacing, borderRadius, shadows, motion, fontWeights } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';
import { LiquidGlassContainer } from '../LiquidGlassContainer';
import { SkeletonLoader } from './feedback';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'selected' | 'metric';

const FORMAT_LABELS: Record<string, string> = {
  'grid-2': 'Grilla 2',
  'grid-3': 'Grilla 3',
  'grid-4x5': 'Grilla 4×5',
  'grid-3x7': 'Grilla 3×7',
  'simple-list': 'Lista',
  'premium-cover': 'Premium',
};

export function Card({ children, style, onPress, variant = 'default', testID }: PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: CardVariant;
  testID?: string;
}>) {
  const colors = c();
  const cardScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const variantStyle: ViewStyle = {
    backgroundColor: variant === 'selected' ? colors.primaryLight : colors.backgroundSurface,
    borderColor: variant === 'selected' ? colors.borderActive : colors.borderDefault,
    ...(variant === 'elevated' ? shadows.lg : variant === 'metric' ? shadows.sm : shadows.md),
  };

  const handlePressIn = useCallback(() => {
    cardScale.value = withSpring(motion.pressScale, { damping: motion.springDamping, stiffness: motion.springStiffness });
  }, [cardScale]);

  const handlePressOut = useCallback(() => {
    cardScale.value = withSpring(1, { damping: motion.springDamping, stiffness: motion.springStiffness });
  }, [cardScale]);

  const content = (
    <LiquidGlassContainer variant="cardSubtle" style={[styles.card, variantStyle, style] as unknown as ViewStyle}>
      {children}
    </LiquidGlassContainer>
  );

  if (onPress) {
    return (
      <Animated.View style={cardAnimatedStyle}>
        <Pressable onPress={onPress} testID={testID} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          {content}
        </Pressable>
      </Animated.View>
    );
  }
  return <View testID={testID}>{content}</View>;
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
        {subtitle ? <AppText variant="bodySmall" color="muted" style={{ marginTop: spacing.xxs }}>{subtitle}</AppText> : null}
      </View>
      {action ? <View style={{ marginLeft: spacing.sm }}>{action}</View> : null}
    </View>
  );
}

export const AppCard = Card;

export function InteractiveCard(props: React.ComponentProps<typeof Card>) {
  return <Card variant="interactive" {...props} />;
}

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
            <Ionicons name={icon} size={22} color={accentColor} />
          </View>
        ) : null}
        <View style={[styles.metricAccent, { backgroundColor: accentColor }]} />
      </View>
      <View style={styles.metricContent}>
        <AppText
          variant="heading1"
          color="primary"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={styles.metricValue}
        >
          {value}
        </AppText>
        <AppText
          variant="bodySmall"
          color="muted"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.metricLabel}
        >
          {label}
        </AppText>
      </View>
    </Card>
  );
}

export const ProductCard = memo(function ProductCard({ name, price, format, family, supplier, photoUri, stock, onPress, onEdit, onDelete, onIncrement, onDecrement, onStockChange }: {
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
  const horizontalPadding = spacing.xl;
  const gap = spacing.lg;
  const columns = 2;
  const cardWidth = Math.floor((width - horizontalPadding * 2 - gap * (columns - 1)) / columns);

  const scale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animateIn = useCallback(() => { scale.value = withSpring(1.05, { damping: 10, stiffness: 150 }); }, [scale]);
  const animateOut = useCallback(() => { scale.value = withSpring(1, { damping: 10, stiffness: 150 }); }, [scale]);

  const formatColors: Record<string, string> = {
    unit: colors.secondary,
    box: colors.warning,
    pack: colors.success,
    service: colors.error,
  };
  const fmtColor = formatColors[format] ?? colors.primary;

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
    <Animated.View style={[cardAnimatedStyle, { width: cardWidth, marginBottom: spacing.lg }]}>
      <Pressable
        onPress={onPress}
        onPressIn={animateIn}
        onPressOut={animateOut}
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
          <AppText variant="price" color="accent" numberOfLines={1} style={{ marginTop: spacing.sm }}>{price}</AppText>
          <View style={[styles.productMeta, { marginTop: spacing.md }]}>
            <View style={[styles.formatBadge, { backgroundColor: fmtColor + '18' }]}>
              <AppText variant="caption" color="muted" style={{ color: fmtColor }}>{format}</AppText>
            </View>
          </View>
          <AppText variant="caption" color="muted" numberOfLines={1} style={{ marginTop: spacing.xs }}>{family}</AppText>
          {supplier ? (
            <AppText variant="caption" color="muted" numberOfLines={1} style={{ marginTop: spacing.xs, color: '#8B5CF6' }}>{supplier}</AppText>
          ) : null}
          {stock !== undefined ? (
            <View style={[styles.stockCounter, { marginTop: spacing.md }]}>
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
          <View style={[styles.rowActions, { marginTop: spacing.md }]}>
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
      </Pressable>
    </Animated.View>
  );
});

export const FamilyCard = memo(function FamilyCard({ name, productCount, color, onEdit, onDelete, onPress }: {
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
});

export const CatalogHistoryItem = memo(function CatalogHistoryItem({ name, format, purpose, date, productCount, onShare, onDuplicate, onDelete }: {
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

  const isPurchaseDetail = purpose === 'purchase-detail';
  const isSupplierDocument = purpose === 'quotation' || purpose === 'purchase-order';
  const iconBg = isPurchaseDetail || isSupplierDocument ? colors.primaryLight : colors.errorLight;
  const iconColor = isPurchaseDetail || isSupplierDocument ? colors.primary : colors.error;
  const iconName = isPurchaseDetail || isSupplierDocument ? 'cart-outline' : 'document-text-outline';
  const purposeLabel = purpose === 'quotation'
    ? 'COTIZACIÓN'
    : purpose === 'purchase-order'
      ? 'ORDEN DE COMPRA'
      : isPurchaseDetail
        ? 'COMPRA'
        : null;

  return (
    <Card variant="default" style={styles.historyItem}>
      <View style={[styles.pdfIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: fontWeights.semiBold }}>{name}</AppText>
        <View style={styles.historyMeta}>
          {purposeLabel ? (
            <AppText variant="caption" color="accent" style={{ fontWeight: '600' as any }}>
              {isSupplierDocument ? `${purposeLabel} · ${format}` : purposeLabel}
            </AppText>
          ) : (
            <AppText variant="caption" color="muted">{FORMAT_LABELS[format] ?? format}</AppText>
          )}
          <AppText variant="caption" color="muted" style={{ marginHorizontal: spacing.xs }}>·</AppText>
          <AppText variant="caption" color="muted">{date}</AppText>
          <AppText variant="caption" color="muted" style={{ marginHorizontal: spacing.xs }}>·</AppText>
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
});

export function SkeletonCard() {
  return (
    <Card style={{ gap: spacing.md }}>
      <SkeletonLoader height={18} style={{ width: '72%' }} />
      <SkeletonLoader height={12} style={{ width: '92%' }} />
      <SkeletonLoader height={12} style={{ width: '48%' }} />
    </Card>
  );
}
