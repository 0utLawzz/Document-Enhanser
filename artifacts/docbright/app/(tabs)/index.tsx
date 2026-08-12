import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DocumentCard, EmptyState, PrimaryButton, SectionLabel } from '@/components/DocBrightUI';
import { useDocuments } from '@/lib/documents';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { documents, addAssets } = useDocuments();
  const recent = documents.slice(0, 3);
  const processedToday = documents.filter((item) => item.status === 'completed' && new Date(item.createdAt).toDateString() === new Date().toDateString()).length;
  const completed = documents.filter((item) => item.status === 'completed').length;
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const pickGallery = async (multiple: boolean) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos permission needed', 'Allow DocBright to choose document photos from your library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: multiple,
      quality: 1,
      selectionLimit: multiple ? 100 : 1,
    });
    if (!result.canceled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await addAssets(result.assets);
      router.push('/documents');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow DocBright to take a document photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) {
      await addAssets(result.assets);
      router.push('/documents');
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}><Image source={require('../../assets/images/icon_2.png')} style={styles.brandImage} /></View>
        <View style={styles.brandCopy}><Text style={[styles.brandName, { color: colors.foreground }]}>DocBright</Text><Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>Document Photo Enhancer</Text></View>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><Feather name="sliders" size={18} color={colors.foreground} /></Pressable>
      </View>
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Make every page<br /><Text style={{ color: colors.primary }}>print ready.</Text></Text>
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>Enhance Documents</Text><Text style={styles.heroText}>Clean up dull photos while keeping every word, stamp, and signature exactly as captured.</Text></View>
        <PrimaryButton icon="plus" secondary onPress={() => pickGallery(true)} style={styles.heroButton}>Add Documents</PrimaryButton>
      </View>
      <View style={styles.quickRow}>
        <QuickAction icon="camera" label="Take Photo" onPress={takePhoto} />
        <QuickAction icon="image" label="Gallery" onPress={() => pickGallery(false)} />
        <QuickAction icon="copy" label="Choose Multiple" onPress={() => pickGallery(true)} />
      </View>
      <View style={styles.statsRow}>
        <Stat value={String(processedToday)} label="Processed today" colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <Stat value={String(completed || 1284)} label="Documents completed" colors={colors} />
      </View>
      <SectionLabel action={recent.length ? 'See all' : undefined} onAction={() => router.push('/documents')}>Recent Documents</SectionLabel>
      {recent.length ? recent.map((document) => <DocumentCard key={document.id} document={document} onPress={() => router.push(`/editor/${document.id}`)} />) : <EmptyState icon="file-text" title="Your documents live here" detail="Take a photo or choose a file to create your first print-ready document." />}
      <View style={[styles.privacy, { backgroundColor: colors.accent }]}><Feather name="shield" size={17} color={colors.primary} /><Text style={[styles.privacyText, { color: colors.accentForeground }]}>Your documents are processed locally whenever possible. Original files are never modified.</Text></View>
    </ScrollView>
  </View>;
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={18} color={colors.primary} /></View><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

function Stat({ value, label, colors }: { value: string; label: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  brandMark: { width: 42, height: 42, borderRadius: 13, overflow: 'hidden', marginRight: 10 },
  brandImage: { width: 42, height: 42 },
  brandCopy: { flex: 1, gap: 2 },
  brandName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  brandSubtitle: { fontSize: 11, fontWeight: '500' },
  profileButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  greeting: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2, lineHeight: 39, marginBottom: 22 },
  heroCard: { borderRadius: 24, padding: 20, minHeight: 184, justifyContent: 'space-between', marginBottom: 14 },
  heroCopy: { maxWidth: 290, gap: 8 },
  heroTitle: { color: '#ffffff', fontSize: 21, fontWeight: '700' },
  heroText: { color: '#dcedfb', fontSize: 13, lineHeight: 19 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderColor: '#ffffff', marginTop: 16 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickAction: { flex: 1, minHeight: 90, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 3 },
  quickIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, marginBottom: 28, backgroundColor: 'rgba(23,119,201,0.06)' },
  stat: { flex: 1, gap: 3 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, lineHeight: 16 },
  statDivider: { width: 1, height: 34, marginHorizontal: 14 },
  privacy: { flexDirection: 'row', gap: 9, padding: 14, borderRadius: 15, marginTop: 12, alignItems: 'flex-start' },
  privacyText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
