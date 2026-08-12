import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DocumentItem, Preset, useDocuments } from '@/lib/documents';
import { useColors } from '@/hooks/useColors';
import { PresetChip, PrimaryButton, StatusPill } from '@/components/DocBrightUI';

const presets: Preset[] = ['Natural', 'Document Clear', 'Print Ready', 'Black & White', 'Strong Text', 'Photo Recovery'];

export default function EditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, enhanceDocument, rotateDocument, shareDocument } = useDocuments();
  const document = documents.find((item) => item.id === id);
  const [view, setView] = useState<'original' | 'enhanced' | 'split'>('enhanced');
  const [preset, setPreset] = useState<Preset>(document?.preset ?? 'Print Ready');
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!document) return <View style={[styles.screen, { backgroundColor: colors.background }]}><Text style={[styles.missing, { color: colors.foreground }]}>Document not found.</Text></View>;

  const applyPreset = async () => {
    await enhanceDocument(document.id, preset);
    Alert.alert('Enhanced', 'A new enhanced copy was created. Your original remains untouched.');
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: insets.bottom + 36 }} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}><Pressable onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><View style={styles.topTitle}><Text style={[styles.eyebrow, { color: colors.primary }]}>Document Editor</Text><Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{document.name}</Text></View><Pressable onPress={() => shareDocument(document)} style={[styles.exportIcon, { backgroundColor: colors.primary }]}><Feather name="upload" size={18} color={colors.primaryForeground} /></Pressable></View>
      <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.previewHeader}><Text style={[styles.previewLabel, { color: colors.foreground }]}>{view === 'split' ? 'Original / Enhanced' : view === 'original' ? 'Original' : 'Enhanced'}</Text><StatusPill status={document.status} /></View>
        <View style={[styles.preview, { backgroundColor: colors.muted }]}>
          {view === 'split' ? <View style={styles.split}><Image source={{ uri: document.originalUri }} style={styles.splitImage} resizeMode="contain" /><Image source={{ uri: document.enhancedUri ?? document.originalUri }} style={styles.splitImage} resizeMode="contain" /></View> : <Image source={{ uri: view === 'original' ? document.originalUri : document.enhancedUri ?? document.originalUri }} style={styles.documentImage} resizeMode="contain" />}
          <View style={[styles.viewBadge, { backgroundColor: colors.card }]}><Text style={[styles.viewBadgeText, { color: colors.foreground }]}>{view === 'original' ? 'Original' : view === 'split' ? 'Split view' : 'Enhanced copy'}</Text></View>
        </View>
        <View style={styles.segment}><SegmentButton label="Original" selected={view === 'original'} onPress={() => setView('original')} /><SegmentButton label="Enhanced" selected={view === 'enhanced'} onPress={() => setView('enhanced')} /><SegmentButton label="Split View" selected={view === 'split'} onPress={() => setView('split')} /></View>
      </View>
      <View style={styles.review}><Feather name="check-circle" size={17} color={colors.success} /><Text style={[styles.reviewText, { color: colors.mutedForeground }]}>Original file is protected. Enhancements are saved as a separate copy.</Text></View>
      <Text style={[styles.section, { color: colors.foreground }]}>Enhancement preset</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>{presets.map((item) => <PresetChip key={item} preset={item} selected={preset === item} onPress={() => setPreset(item)} />)}</ScrollView>
      <PrimaryButton icon="zap" onPress={applyPreset} disabled={document.status === 'processing'} style={styles.autoButton}>Auto Enhance · {preset}</PrimaryButton>
      <View style={styles.toolRow}><ToolButton icon="rotate-ccw" label="Rotate left" onPress={() => rotateDocument(document.id, -90)} /><ToolButton icon="rotate-cw" label="Rotate right" onPress={() => rotateDocument(document.id, 90)} /><ToolButton icon="sliders" label="Adjust" onPress={() => Alert.alert('Advanced adjustments', 'Manual sliders are coming next. The selected preset is fully functional today.')} /></View>
      <View style={[styles.infoCard, { backgroundColor: colors.accent }]}><Feather name="info" size={17} color={colors.primary} /><View style={styles.infoCopy}><Text style={[styles.infoTitle, { color: colors.accentForeground }]}>Print Ready keeps color</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>Text clarity and background are improved without forcing black and white, so stamps, seals, logos, and signatures stay recognizable.</Text></View></View>
      <PrimaryButton icon="download" onPress={() => shareDocument(document)} secondary style={styles.exportButton}>Export enhanced copy</PrimaryButton>
    </ScrollView>
  </View>;
}

function SegmentButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.segmentButton, selected && { backgroundColor: colors.card }]}><Text style={[styles.segmentText, { color: selected ? colors.foreground : colors.mutedForeground }]}>{label}</Text></Pressable>;
}

function ToolButton({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.toolButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.65 : 1 }]}><Feather name={icon} size={18} color={colors.foreground} /><Text style={[styles.toolLabel, { color: colors.mutedForeground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  missing: { flex: 1, textAlign: 'center', paddingTop: 100 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  name: { fontSize: 17, fontWeight: '700' },
  exportIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  previewCard: { borderRadius: 22, borderWidth: 1, padding: 12, marginBottom: 12 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 10 },
  previewLabel: { fontSize: 14, fontWeight: '700' },
  preview: { height: 390, borderRadius: 14, overflow: 'hidden', justifyContent: 'center' },
  documentImage: { width: '100%', height: '100%' },
  split: { flexDirection: 'row', width: '100%', height: '100%' },
  splitImage: { width: '50%', height: '100%', borderRightWidth: 1 },
  viewBadge: { position: 'absolute', left: 10, bottom: 10, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  viewBadgeText: { fontSize: 10, fontWeight: '700' },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(127,145,163,0.12)', borderRadius: 12, padding: 3, marginTop: 10 },
  segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 34, borderRadius: 9 },
  segmentText: { fontSize: 11, fontWeight: '700' },
  review: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 10 },
  reviewText: { flex: 1, fontSize: 12, lineHeight: 17 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 13, marginBottom: 10 },
  presetRow: { paddingBottom: 12 },
  autoButton: { marginTop: 4 },
  toolRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  toolButton: { flex: 1, minHeight: 74, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  toolLabel: { fontSize: 10, fontWeight: '600' },
  infoCard: { flexDirection: 'row', gap: 9, padding: 13, borderRadius: 15, marginTop: 18 },
  infoCopy: { flex: 1, gap: 3 },
  infoTitle: { fontSize: 12, fontWeight: '700' },
  infoText: { fontSize: 11, lineHeight: 17 },
  exportButton: { marginTop: 15 },
});