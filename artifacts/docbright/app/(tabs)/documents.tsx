import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, DocumentCard, EmptyState, PresetChip, PrimaryButton, SectionLabel } from '@/components/DocBrightUI';
import { useColors } from '@/hooks/useColors';
import { DocumentItem, Preset, useDocuments } from '@/lib/documents';

const presets: Preset[] = ['Natural', 'Document Clear', 'Print Ready', 'Black & White', 'Strong Text', 'Photo Recovery'];

export default function DocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { documents, addAssets, enhanceAll, shareAll, clearHistory } = useDocuments();
  const [selectedPreset, setSelectedPreset] = useState<Preset>('Print Ready');
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const processing = documents.filter((item) => item.status === 'processing').length;
  const completed = documents.filter((item) => item.status === 'completed').length;

  const chooseMore = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 100, quality: 1 });
    if (!result.canceled) await addAssets(result.assets);
  };

  const applyAll = async () => {
    await enhanceAll(selectedPreset);
    Alert.alert('Enhancement started', `Applying ${selectedPreset} to your documents.`);
  };

  const clearAll = () => {
    Alert.alert(
      'Clear all uploaded files?',
      'This removes the current queue and saved DocBright history. Original photos on your device are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: clearHistory },
      ],
    );
  };

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
      <AppHeader eyebrow="Workspace" title="Documents" action="plus" onAction={chooseMore} />
      {documents.length ? <>
        <View style={[styles.batchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.batchTop}><View><Text style={[styles.batchTitle, { color: colors.foreground }]}>{documents.length} {documents.length === 1 ? 'document' : 'documents'}</Text><Text style={[styles.batchMeta, { color: colors.mutedForeground }]}>{processing ? `${completed} completed · ${processing} processing` : `${completed} completed`}</Text></View><View style={[styles.batchIcon, { backgroundColor: colors.accent }]}><Feather name={processing ? 'loader' : 'check'} size={19} color={colors.primary} /></View></View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { width: `${documents.length ? Math.max(4, completed / documents.length * 100) : 0}%`, backgroundColor: colors.primary }]} /></View>
          <SectionLabel>Batch preset</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>{presets.map((preset) => <PresetChip key={preset} preset={preset} selected={selectedPreset === preset} onPress={() => setSelectedPreset(preset)} />)}</ScrollView>
          <PrimaryButton icon="zap" onPress={applyAll} disabled={processing > 0} style={styles.batchButton}>Apply to All</PrimaryButton>
          <PrimaryButton icon="download" onPress={shareAll} secondary disabled={!completed} style={styles.batchButton}>Export All</PrimaryButton>
           <Pressable onPress={clearAll} style={({ pressed }) => [styles.clearButton, { borderColor: colors.destructive, opacity: pressed ? 0.6 : 1 }]}><Feather name="trash-2" size={16} color={colors.destructive} /><Text style={[styles.clearText, { color: colors.destructive }]}>Clear all uploaded files</Text></Pressable>
        </View>
        <SectionLabel action="Add more" onAction={chooseMore}>Queue</SectionLabel>
        {documents.map((document) => <QueueRow key={document.id} document={document} onPress={() => router.push(`/editor/${document.id}`)} />)}
      </> : <EmptyState icon="inbox" title="No documents yet" detail="Add a document photo to start a clean, print-ready workflow." />}
      <PrimaryButton icon="plus" onPress={chooseMore} secondary style={styles.addButton}>Add Documents</PrimaryButton>
    </ScrollView>
  </View>;
}

function QueueRow({ document, onPress }: { document: DocumentItem; onPress: () => void }) {
  return <DocumentCard document={document} onPress={onPress} compact />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  batchCard: { borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 25 },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  batchTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  batchMeta: { fontSize: 12 },
  batchIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', borderRadius: 4 },
  presetRow: { paddingBottom: 15 },
  batchButton: { minHeight: 48 },
  clearButton: { minHeight: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  clearText: { fontSize: 12, fontWeight: '700' },
  addButton: { marginTop: 20 },
});
