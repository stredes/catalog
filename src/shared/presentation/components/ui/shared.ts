import { StyleSheet } from 'react-native';
import { palette, darkPalette, spacing, borderRadius } from '../../theme';
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

export { styles };
export const ui = styles;
