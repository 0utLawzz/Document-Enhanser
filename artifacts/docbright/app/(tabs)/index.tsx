import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DocumentCard, EmptyState, PrimaryButton, SectionLabel } from '@/components/DocBrightUI';
import { useDocuments } from '@/lib/documents';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { documents, addAssets } = useDocuments();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
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
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.brandRow, isDesktop && styles.brandRowDesktop]}>
        <View style={styles.brandMark}><Image source={require('../../assets/images/icon_2.png')} style={styles.brandImage} /></View>
        <View style={styles.brandCopy}><Text style={[styles.brandName, { color: colors.foreground }]}>DocBright</Text><Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>Document Photo Enhancer</Text></View>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><Feather name="sliders" size={18} color={colors.foreground} /></Pressable>
      </View>
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting.toUpperCase()} / LOCAL WORKSPACE</Text>
      <Text style={[styles.title, isDesktop && styles.titleDesktop, { color: colors.foreground }]}>Make every page{'\n'}<Text style={{ color: colors.primary }}>print ready.</Text></Text>
      <View style={isDesktop ? styles.desktopHeroRow : undefined}>
      <View style={[styles.heroCard, isDesktop && styles.heroCardDesktop, { backgroundColor: colors.primary }]}>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>Enhance Documents</Text><Text style={styles.heroText}>Clean up dull photos while keeping every word, stamp, and signature exactly as captured.</Text></View>
        <PrimaryButton icon="plus" secondary onPress={() => pickGallery(true)} style={styles.heroButton}>Add Documents</PrimaryButton>
      </View>
      {isDesktop ? <View style={[styles.desktopQuickRail, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.railLabel, { color: colors.foreground }]}>Quick actions</Text><QuickAction icon="camera" label="Take Photo" onPress={takePhoto} /><QuickAction icon="image" label="Gallery" onPress={() => pickGallery(false)} /><QuickAction icon="copy" label="Choose Multiple" onPress={() => pickGallery(true)} /></View> : null}
      </View>
      {!isDesktop ? <View style={styles.quickRow}>
        <QuickAction icon="camera" label="Take Photo" onPress={takePhoto} />
        <QuickAction icon="image" label="Gallery" onPress={() => pickGallery(false)} />
        <QuickAction icon="copy" label="Choose Multiple" onPress={() => pickGallery(true)} />
      </View> : null}
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
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1, transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : undefined }]}><View style={[styles.quickIcon, { backgroundColor: colors.accent, borderColor: colors.border }]}><Feather name={icon} size={18} color={colors.foreground} /></View><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

function Stat({ value, label, colors }: { value: string; label: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  contentDesktop: { width: '100%', maxWidth: 1220, alignSelf: 'center', paddingHorizontal: 48 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  brandRowDesktop: { marginBottom: 42 },
  brandMark: { width: 42, height: 42, borderRadius: 0, overflow: 'hidden', marginRight: 10, borderWidth: 3, borderColor: '#0C0C0C' },
  brandImage: { width: 42, height: 42 },
  brandCopy: { flex: 1, gap: 2 },
  brandName: { fontFamily: 'Arial Black', fontSize: 18, fontWeight: '900', letterSpacing: 0.3, textTransform: 'uppercase' },
  brandSubtitle: { fontFamily: 'monospace', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  profileButton: { width: 42, height: 42, borderRadius: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#0C0C0C' },
  greeting: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  title: { fontFamily: 'Arial Black', fontSize: 34, fontWeight: '900', letterSpacing: -0.8, lineHeight: 39, marginBottom: 22, textTransform: 'uppercase' },
  titleDesktop: { fontSize: 68, lineHeight: 66, letterSpacing: -1.5, marginBottom: 28 },
  desktopHeroRow: { flexDirection: 'row', gap: 18, alignItems: 'stretch', marginBottom: 22 },
  heroCard: { borderRadius: 6, borderWidth: 3, borderColor: '#0C0C0C', padding: 20, minHeight: 184, justifyContent: 'space-between', marginBottom: 14, ...(Platform.OS === 'web' ? { boxShadow: '8px 8px 0 #0C0C0C' } : {}) } as any,
  heroCardDesktop: { flex: 1, minHeight: 250, padding: 32, marginBottom: 0, flexDirection: 'row', alignItems: 'flex-end' },
  heroCopy: { maxWidth: 460, gap: 8 },
  heroTitle: { color: '#FAF6EE', fontFamily: 'Arial Black', fontSize: 26, fontWeight: '900', textTransform: 'uppercase' },
  heroText: { color: '#FAF6EE', fontSize: 14, lineHeight: 21, maxWidth: 420 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#FAF6EE', borderColor: '#0C0C0C', marginTop: 16 },
  desktopQuickRail: { width: 250, borderWidth: 3, padding: 16, gap: 10, ...(Platform.OS === 'web' ? { boxShadow: '5px 5px 0 #0C0C0C' } : {}) } as any,
  railLabel: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickAction: { flex: 1, minHeight: 90, borderRadius: 0, borderWidth: 3, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 3 },
  quickIcon: { width: 32, height: 32, borderRadius: 0, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderColor: '#0C0C0C', borderRadius: 0, padding: 16, marginBottom: 28, backgroundColor: '#0D9970', ...(Platform.OS === 'web' ? { boxShadow: '5px 5px 0 #0C0C0C' } : {}) } as any,
  stat: { flex: 1, gap: 3 },
  statValue: { fontFamily: 'Arial Black', fontSize: 28, fontWeight: '900', color: '#FAF6EE' },
  statLabel: { fontFamily: 'monospace', fontSize: 10, lineHeight: 16, color: '#FAF6EE', textTransform: 'uppercase' },
  statDivider: { width: 3, height: 34, marginHorizontal: 14, backgroundColor: '#0C0C0C' },
  privacy: { flexDirection: 'row', gap: 9, padding: 14, borderWidth: 3, borderColor: '#0C0C0C', borderRadius: 0, marginTop: 12, alignItems: 'flex-start', backgroundColor: '#D4A800' },
  privacyText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
