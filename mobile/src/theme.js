// Edspunk-style light theme: yellow accent, cream background, dark text.
import { StyleSheet } from 'react-native';

export const colors = {
  primary:        '#FFD93D',  // bright yellow (accent buttons, highlights)
  primaryDark:    '#F4C61A',  // pressed / shadow
  secondary:      '#FFE873',  // soft yellow (chip bg)
  background:     '#FAF3E0',  // cream
  card:           '#FFFFFF',  // white card surface
  cardSoft:       '#FFF8E1',  // soft yellow card
  text:           '#1A1A1A',  // primary text
  textMuted:      '#6B7280',  // muted gray
  textOnPrimary:  '#1A1A1A',  // text on yellow buttons
  border:         '#E5E0CC',  // hairline
  divider:        '#EDE6CF',
  success:        '#22C55E',
  warning:        '#F59E0B',
  danger:         '#EF4444',
  info:           '#3B82F6',
  tabBg:          '#1A1A1A',  // dark footer
  tabActive:      '#FFD93D',
  tabInactive:    '#9CA3AF',
  star:           '#F59E0B',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 18, xl: 24, pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text },
  h3: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text },
  bodyMuted: { fontSize: 14, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '600', color: colors.text, letterSpacing: 0.3 },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pill: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
};

// Common reusable styles
export const shared = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  yellowHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.pill,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.pill,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { ...typography.h3 },
  sectionLink: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});

export default { colors, spacing, radius, typography, shadows, shared };
