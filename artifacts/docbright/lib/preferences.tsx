import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

type Preferences = {
  defaultPreset: string;
  outputFormat: 'jpg' | 'png';
  quality: 'high' | 'maximum';
  autoCrop: boolean;
  autoRotate: boolean;
  autoPerspective: boolean;
  autoEnhance: boolean;
  saveHistory: boolean;
  themeMode: ThemeMode;
};

const defaultPreferences: Preferences = {
  defaultPreset: 'Print Ready',
  outputFormat: 'jpg',
  quality: 'high',
  autoCrop: true,
  autoRotate: true,
  autoPerspective: true,
  autoEnhance: true,
  saveHistory: true,
  themeMode: 'system',
};

const PreferencesContext = createContext<{
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}>({
  preferences: defaultPreferences,
  updatePreference: () => undefined,
});

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    AsyncStorage.getItem('@docbright/preferences').then((stored) => {
      if (!stored) return;
      try {
        const next = { ...defaultPreferences, ...JSON.parse(stored) };
        setPreferences(next);
        Appearance.setColorScheme(next.themeMode === 'system' ? null : next.themeMode);
      } catch {
        setPreferences(defaultPreferences);
      }
    });
  }, []);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (key === 'themeMode') {
      const mode = value as ThemeMode;
      Appearance.setColorScheme(mode === 'system' ? null : mode);
    }
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      AsyncStorage.setItem('@docbright/preferences', JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  };

  const value = useMemo(() => ({ preferences, updatePreference }), [preferences]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
