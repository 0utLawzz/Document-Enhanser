import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, DocumentCard, EmptyState, SectionLabel } from '@/components/DocBrightUI';
import { useColors } from '@/hooks/useColors';
import { useDocuments } from '@/lib/documents';

function dayGroup(date: string) {
  const current = new Date();
  const target = new Date(date);
  const days = Math.floor((new Date(current.toDateString()).getTime() - new Date(target.toDateString()).getTime()) / 86400000);
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : 'Earlier';
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { documents, deleteDocument, clearHistory } = useDocuments();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const groups = ['Today', 'Yesterday', 'Earlier'].map((label) => ({ label, documents: documents.filter((item) => dayGroup(item.createdAt) === label) })).filter((group) => group.documents.length);

  const confirmClear = () => Alert.alert('Clear history?', 'This removes the saved processing history. Original photos on your device are not affected.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear History', style: 'destructive', onPress: clearHistory }]);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
      <AppHeader eyebrow="Local archive" title="History" />
      {documents.length ? <>{groups.map((group) => <View key={group.label} style={styles.group}><SectionLabel>{group.label}</SectionLabel>{group.documents.map((document) => <View key={document.id} style={styles.historyRow}><View style={styles.historyCard}><DocumentCard document={document} onPress={() => router.push(`/editor/${document.id}`)} compact /><Text style={[styles.preset, { color: colors.mutedForeground }]}>{document.preset} · {new Date(document.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View><Pressable onPress={() => Alert.alert('Delete document?', 'Only the DocBright history entry will be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteDocument(document.id) }])} style={({ pressed }) => [styles.deleteButton, { backgroundColor: colors.card, opacity: pressed ? 0.6 : 1 }]}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable></View>)}</View>)}</> : <EmptyState icon="clock" title="No processing history" detail="Completed documents will appear here so you can reopen or reprocess them." />}
      {documents.length ? <Pressable onPress={confirmClear} style={({ pressed }) => [styles.clearButton, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}><Feather name="trash-2" size={16} color={colors.destructive} /><Text style={[styles.clearText, { color: colors.destructive }]}>Clear History</Text></Pressable> : null}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  group: { marginBottom: 17 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyCard: { flex: 1 },
  preset: { fontSize: 11, marginLeft: 68, marginTop: -4, marginBottom: 10 },
  deleteButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  clearButton: { minHeight: 48, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  clearText: { fontSize: 13, fontWeight: '700' },
});
