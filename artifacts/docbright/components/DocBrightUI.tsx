import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DocumentItem, DocumentStatus, Preset } from '@/lib/documents';

export function AppHeader({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.header}>
    <View style={styles.headerTitle}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
      <Text style={[styles.headerText, { color: colors.foreground }]}>{title}</Text>
    </View>
    {action && onAction ? <Pressable onPress={onAction} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, opacity: pressed ? 0.65 : 1 }]}><Feather name={action as any} size={20} color={colors.foreground} /></Pressable> : null}
  </View>;
}

export function PrimaryButton({ icon, children, onPress, secondary = false, disabled = false, style }: PropsWithChildren<{ icon?: keyof typeof Feather.glyphMap; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  const colors = useColors();
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: secondary ? colors.card : colors.primary, borderColor: secondary ? colors.border : colors.primary, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 }, style]}>
    {icon ? <Feather name={icon} size={18} color={secondary ? colors.foreground : colors.primaryForeground} /> : null}
    <Text style={[styles.primaryButtonText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{children}</Text>
  </Pressable>;
}

export function SectionLabel({ children, action, onAction }: PropsWithChildren<{ action?: string; onAction?: () => void }>) {
  const colors = useColors();
  return <View style={styles.sectionRow}><Text style={[styles.sectionLabel, { color: colors.foreground }]}>{children}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>;
}

function statusColor(status: DocumentStatus, colors: ReturnType<typeof useColors>) {
  if (status === 'completed') return colors.success;
  if (status === 'failed') return colors.destructive;
  return colors.warning;
}

export function StatusPill({ status }: { status: DocumentStatus }) {
  const colors = useColors();
  const label = status === 'processing' ? 'Processing' : status.charAt(0).toUpperCase() + status.slice(1);
  return <View style={[styles.pill, { backgroundColor: `${statusColor(status, colors)}18` }]}>{status === 'processing' ? <ActivityIndicator size="small" color={statusColor(status, colors)} /> : <View style={[styles.pillDot, { backgroundColor: statusColor(status, colors) }]} />}<Text style={[styles.pillText, { color: statusColor(status, colors) }]}>{label}</Text></View>;
}

export function DocumentCard({ document, onPress, compact = false }: { document: DocumentItem; onPress?: () => void; compact?: boolean }) {
  const colors = useColors();
  const content = <View style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }, compact && styles.documentCardCompact]}>
    {document.enhancedUri || document.originalUri ? <Image source={{ uri: document.enhancedUri ?? document.originalUri }} style={compact ? styles.thumbSmall : styles.thumb} resizeMode="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.muted }]} />}
    <View style={styles.documentCardBody}>
      <Text style={[styles.documentName, { color: colors.foreground }]} numberOfLines={1}>{document.name}</Text>
      <Text style={[styles.documentMeta, { color: colors.mutedForeground }]}>{document.preset} · {new Date(document.createdAt).toLocaleDateString()}</Text>
      <StatusPill status={document.status} />
    </View>
    {onPress ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} /> : null}
  </View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}>{content}</Pressable> : content;
}

export function PresetChip({ preset, selected, onPress }: { preset: Preset; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.presetChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? `${colors.primary}12` : colors.background }]}><Text style={[styles.presetChipText, { color: selected ? colors.primary : colors.foreground }]}>{preset}</Text></Pressable>;
}

export function EmptyState({ icon, title, detail }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string }) {
  const colors = useColors();
  return <View style={styles.emptyState}><View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={25} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  headerTitle: { gap: 4 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' },
  headerText: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7 },
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 54, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, borderWidth: 1 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 17, fontWeight: '700' },
  sectionAction: { fontSize: 13, fontWeight: '700' },
  documentCard: { minHeight: 88, borderRadius: 18, borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  documentCardCompact: { minHeight: 74 },
  thumb: { width: 56, height: 68, borderRadius: 11, backgroundColor: '#e8eef4' },
  thumbSmall: { width: 46, height: 54, borderRadius: 10, backgroundColor: '#e8eef4' },
  documentCardBody: { flex: 1, gap: 5 },
  documentName: { fontSize: 15, fontWeight: '700' },
  documentMeta: { fontSize: 12 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', gap: 5, alignItems: 'center' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  presetChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, borderWidth: 1, marginRight: 8 },
  presetChipText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 30, gap: 10 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
