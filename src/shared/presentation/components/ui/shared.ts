import { StyleSheet, TextStyle } from 'react-native';
import { palette, darkPalette, spacing, borderRadius, sizes } from '../../theme';
import { setLiquidGlassScheme } from '../LiquidGlassContainer';

export type ColorScheme = 'light' | 'dark';
let currentScheme: ColorScheme = 'light';

export function setColorScheme(scheme: ColorScheme) {
  currentScheme = scheme;
  setLiquidGlassScheme(scheme);
}

export function c() {
  return currentScheme === 'dark' ? darkPalette : palette;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 140 },
  screenContent: { gap: spacing.xl },

  header: { padding: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center' },

  card: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.xxl, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg },

  primaryButton: {
    alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: sizes.inputHeight,
  },
  secondaryButton: {
    alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg,
    borderWidth: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: sizes.inputHeight,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  metricCard: { width: '100%', minHeight: 150, padding: spacing.xl, borderRadius: borderRadius.xxl, justifyContent: 'space-between' as const },
  metricHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  metricIconWrap: { width: sizes.thumbnailSmall, height: sizes.thumbnailSmall, borderRadius: borderRadius.lg, alignItems: 'center' as const, justifyContent: 'center' as const },
  metricAccent: { width: 5, height: 32, borderRadius: 3 },
  metricContent: { marginTop: spacing.xxl },
  metricValue: { fontSize: 27, lineHeight: 34, fontWeight: '700' as TextStyle['fontWeight'], flexShrink: 0, includeFontPadding: false },
  metricLabel: { fontSize: 16, lineHeight: 21, marginTop: spacing.sm, flexShrink: 1 },

  fabWrapper: { position: 'absolute', right: spacing.xl, zIndex: 100 },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },

  productImage: { width: '100%', height: 120, backgroundColor: '#E2E8F0' },
  productImagePlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: spacing.lg },
  productMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },

  formatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },

  stockCounter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 0 },
  stockButton: { width: 30, height: 28, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  stockValue: { paddingHorizontal: 8, height: 28, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  stockInput: { paddingHorizontal: 8, height: 28, borderRadius: borderRadius.sm, minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: '700' },

  familyCard: { padding: spacing.xl, borderLeftWidth: 4 },
  familyCardContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  familyIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },

  historyItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  pdfIconWrap: { width: 44, height: 44, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  historyMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.xxs },
  historyActions: { flexDirection: 'row', gap: spacing.xs },

  rowActions: { flexDirection: 'row', gap: spacing.sm },
  iconButtonSmall: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: sizes.touchTarget, height: sizes.touchTarget, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: sizes.inputIconGap, borderRadius: borderRadius.lg, borderWidth: 1.5, paddingHorizontal: sizes.inputPaddingHorizontal, height: sizes.inputHeight },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },

  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1.5, minHeight: 32, justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full, alignSelf: 'flex-start' },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: spacing.lg },
  sectionContent: { gap: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },

  divider: { height: 1, marginVertical: spacing.lg },

  input: { borderRadius: borderRadius.lg, borderWidth: 1.5, paddingHorizontal: sizes.inputPaddingHorizontal, paddingVertical: spacing.md, fontSize: 15, fontWeight: '500' },
  chip: { paddingHorizontal: sizes.inputPaddingHorizontal, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1.5, minHeight: 36, justifyContent: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 200 },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  dialog: { margin: spacing.xxl, borderRadius: borderRadius.xxl, padding: spacing.xxl, alignItems: 'center' },
  dialogActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl, width: '100%' },
  dialogButton: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },

  bottomSheet: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, height: '100%', maxHeight: '90%' },
  bottomSheetFooter: { borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: spacing.xl, paddingTop: spacing.md },
  bottomSheetHandle: { width: 36, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },

  skeleton: { borderRadius: borderRadius.sm },
  stateBlock: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },

  wizardProgress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wizardDot: { height: 8, borderRadius: 4 },

  progressBar: { flex: 1, borderRadius: borderRadius.sm, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  progressFill: { height: '100%', borderRadius: borderRadius.sm, transformOrigin: 'left' },
});

export { styles };
export const ui = styles;
