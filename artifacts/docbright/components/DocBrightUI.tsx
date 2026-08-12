import { Feather } from '@expo/vector-icons';
import React, { PropsWithChildren } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DocumentItem, DocumentStatus, Preset } from '@/lib/documents';

const hardShadow = Platform.OS === 'web'
  ? ({ boxShadow: '5px 5px 0 #0C0C0C' } as any)
  : { shadowColor: '#0C0C0C', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 };

export function AppHeader({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={[styles.header, { borderBottomColor: colors.border }]}>
    <View style={styles.headerTitle}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
      <Text style={[styles.headerText, { color: colors.foreground }]}>{title}</Text>
    </View>
    {action && onAction ? <Pressable onPress={onAction} style={({ pressed }) => [styles.iconButton, hardShadow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}><Feather name={action as any} size={20} color={colors.foreground} /></Pressable> : null}
  </View>;
}

export function PrimaryButton({ icon, children, onPress, secondary = false, disabled = false, style }: PropsWithChildren<{ icon?: keyof typeof Feather.glyphMap; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  const colors = useColors();
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, hardShadow, { backgroundColor: secondary ? colors.card : colors.primary, borderColor: colors.border, opacity: disabled ? 0.45 : 1, transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : undefined }, style]}>
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
  return <View style={[styles.pill, { borderColor: statusColor(status, colors), backgroundColor: colors.card }]}>{status === 'processing' ? <ActivityIndicator size="small" color={statusColor(status, colors)} /> : <View style={[styles.pillDot, { backgroundColor: statusColor(status, colors) }]} />}<Text style={[styles.pillText, { color: statusColor(status, colors) }]}>{label}</Text></View>;
}

export function DocumentCard({ document, onPress, compact = false }: { document: DocumentItem; onPress?: () => void; compact?: boolean }) {
  const colors = useColors();
  const content = <View style={[styles.documentCard, hardShadow, { backgroundColor: colors.card, borderColor: colors.border }, compact && styles.documentCardCompact]}>
    {document.enhancedUri || document.originalUri ? <Image source={{ uri: document.enhancedUri ?? document.originalUri }} style={compact ? styles.thumbSmall : styles.thumb} resizeMode="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.muted }]} />}
    <View style={styles.documentCardBody}>
      <Text style={[styles.documentName, { color: colors.foreground }]} numberOfLines={1}>{document.name}</Text>
      <Text style={[styles.documentMeta, { color: colors.mutedForeground }]}>{document.preset} · {new Date(document.createdAt).toLocaleDateString()}</Text>
      <StatusPill status={document.status} />
    </View>
    {onPress ? <Feather name="chevron-right" size={18} color={colors.foreground} /> : null}
  </View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1, transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : undefined })}>{content}</Pressable> : content;
}

export function PresetChip({ preset, selected, onPress }: { preset: Preset; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.presetChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card }]}><Text style={[styles.presetChipText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{preset}</Text></Pressable>;
}

export function EmptyState({ icon, title, detail }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string }) {
  const colors = useColors();
  return <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.card }]}><View style={[styles.emptyIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}><Feather name={icon} size={25} color={colors.foreground} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, paddingBottom: 14, borderBottomWidth: 3 },
  headerTitle: { gap: 4 },
  eyebrow: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase' },
  headerText: { fontFamily: 'Arial Black', fontSize: 30, fontWeight: '900', letterSpacing: 0.2, textTransform: 'uppercase' },
  iconButton: { width: 42, height: 42, borderRadius: 0, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 54, borderRadius: 6, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, borderWidth: 3 },
  primaryButtonText: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionLabel: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  sectionAction: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  documentCard: { minHeight: 88, borderRadius: 6, borderWidth: 3, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  documentCardCompact: { minHeight: 74 },
  thumb: { width: 56, height: 68, borderRadius: 0, backgroundColor: '#E8DFC7', borderWidth: 2, borderColor: '#0C0C0C' },
  thumbSmall: { width: 46, height: 54, borderRadius: 0, backgroundColor: '#E8DFC7', borderWidth: 2, borderColor: '#0C0C0C' },
  documentCardBody: { flex: 1, gap: 5 },
  documentName: { fontFamily: 'Arial Black', fontSize: 15, fontWeight: '900' },
  documentMeta: { fontFamily: 'monospace', fontSize: 11 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 0, borderWidth: 2, flexDirection: 'row', gap: 5, alignItems: 'center' },
  pillDot: { width: 6, height: 6 },
  pillText: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  presetChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 0, borderWidth: 3, marginRight: 8 },
  presetChipText: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 30, gap: 10, borderWidth: 3, borderRadius: 6 },
  emptyIcon: { width: 58, height: 58, borderRadius: 0, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Arial Black', fontSize: 18, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  emptyDetail: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});