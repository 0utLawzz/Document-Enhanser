import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, SectionLabel } from '@/components/DocBrightUI';
import { useColors } from '@/hooks/useColors';
import { usePreferences } from '@/lib/preferences';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences, updatePreference } = usePreferences();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
      <AppHeader eyebrow="Preferences" title="Settings" />
      <SectionLabel>Processing defaults</SectionLabel>
      <SettingRow icon="zap" title="Default preset" detail={preferences.defaultPreset} colors={colors} onPress={() => updatePreference('defaultPreset', preferences.defaultPreset === 'Print Ready' ? 'Document Clear' : 'Print Ready')} />
      <SettingRow icon="file" title="Output format" detail={preferences.outputFormat.toUpperCase()} colors={colors} onPress={() => updatePreference('outputFormat', preferences.outputFormat === 'jpg' ? 'png' : 'jpg')} />
      <SettingRow icon="maximize" title="Output quality" detail={preferences.quality === 'high' ? 'High' : 'Maximum'} colors={colors} onPress={() => updatePreference('quality', preferences.quality === 'high' ? 'maximum' : 'high')} />
      <SectionLabel>Automatic cleanup</SectionLabel>
      <ToggleRow icon="crop" title="Auto crop" detail="Detect document edges when confidence is high" value={preferences.autoCrop} onValueChange={(value) => updatePreference('autoCrop', value)} colors={colors} />
      <ToggleRow icon="rotate-cw" title="Auto rotate" detail="Correct camera orientation" value={preferences.autoRotate} onValueChange={(value) => updatePreference('autoRotate', value)} colors={colors} />
      <ToggleRow icon="maximize" title="Auto perspective" detail="Straighten angled document photos" value={preferences.autoPerspective} onValueChange={(value) => updatePreference('autoPerspective', value)} colors={colors} />
      <ToggleRow icon="zap" title="Auto enhance" detail="Apply Print Ready after import" value={preferences.autoEnhance} onValueChange={(value) => updatePreference('autoEnhance', value)} colors={colors} />
      <SectionLabel>App</SectionLabel>
      <ToggleRow icon="clock" title="Save processing history" detail="Keep completed documents available locally" value={preferences.saveHistory} onValueChange={(value) => updatePreference('saveHistory', value)} colors={colors} />
      <ToggleRow icon="moon" title="Dark mode" detail="Follows your device appearance" value={preferences.themeMode === 'dark'} onValueChange={(value) => updatePreference('themeMode', value ? 'dark' : 'light')} colors={colors} />
      <View style={[styles.about, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.aboutIcon, { backgroundColor: colors.accent }]}><Feather name="shield" size={20} color={colors.primary} /></View><View style={styles.aboutCopy}><Text style={[styles.aboutTitle, { color: colors.foreground }]}>About DocBright</Text><Text style={[styles.aboutText, { color: colors.mutedForeground }]}>Local-first document enhancement. Built to preserve the details that matter.</Text><Text style={[styles.version, { color: colors.mutedForeground }]}>Version 1.0.0</Text></View></View>
    </ScrollView>
  </View>;
}

function SettingRow({ icon, title, detail, colors, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string; colors: ReturnType<typeof useColors>; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.rowIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={17} color={colors.primary} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text></View><Feather name="chevron-right" size={17} color={colors.mutedForeground} /></Pressable>;
}

function ToggleRow({ icon, title, detail, value, onValueChange, colors }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string; value: boolean; onValueChange: (value: boolean) => void; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.row, { borderBottomColor: colors.border }]}><View style={[styles.rowIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={17} color={colors.primary} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.muted, true: `${colors.primary}70` }} thumbColor={value ? colors.primary : colors.mutedForeground} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowDetail: { fontSize: 11, lineHeight: 16 },
  about: { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 26 },
  aboutIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  aboutCopy: { flex: 1, gap: 4 },
  aboutTitle: { fontSize: 15, fontWeight: '700' },
  aboutText: { fontSize: 12, lineHeight: 18 },
  version: { fontSize: 11, marginTop: 4 },
});
