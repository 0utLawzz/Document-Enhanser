import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import JSZip from 'jszip';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';

export type DocumentStatus = 'waiting' | 'processing' | 'completed' | 'failed';
export type Preset = 'Natural' | 'Document Clear' | 'Print Ready' | 'Black & White' | 'Strong Text' | 'Photo Recovery';

export type DocumentItem = {
  id: string;
  name: string;
  originalUri: string;
  enhancedUri?: string;
  createdAt: string;
  status: DocumentStatus;
  preset: Preset;
  width: number;
  height: number;
  size?: number;
  rotation: number;
  error?: string;
};

type DocumentsContextValue = {
  documents: DocumentItem[];
  isLoading: boolean;
  addAssets: (assets: ImagePicker.ImagePickerAsset[]) => Promise<void>;
  enhanceDocument: (id: string, preset?: Preset) => Promise<void>;
  enhanceAll: (preset?: Preset) => Promise<void>;
  rotateDocument: (id: string, degrees: number) => Promise<void>;
  shareDocument: (document: DocumentItem) => Promise<void>;
  shareAll: () => Promise<void>;
  deleteDocument: (id: string) => void;
  clearHistory: () => void;
};

const STORAGE_KEY = '@docbright/documents';
const DocumentsContext = createContext<DocumentsContextValue | null>(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanName(name?: string, fallback = 'Document') {
  const base = (name ?? fallback).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
  return base || fallback;
}

function outputName(document: DocumentItem) {
  return `${cleanName(document.name)}_ENHANCED.jpg`;
}

async function persist(documents: DocumentItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

async function processImage(document: DocumentItem, degrees = document.rotation) {
  if (Platform.OS === 'web') {
    return processImageOnWeb(document, degrees);
  }
  const actions: ImageManipulator.Action[] = degrees ? [{ rotate: degrees }] : [];
  return ImageManipulator.manipulateAsync(document.originalUri, actions, {
    compress: 0.96,
    format: ImageManipulator.SaveFormat.JPEG,
  });
}

async function processImageOnWeb(document: DocumentItem, degrees: number) {
  const image = new globalThis.Image();
  image.src = document.originalUri;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to load image'));
  });
  const canvas = globalThis.document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const quarterTurn = Math.abs(degrees) % 180 === 90;
  canvas.width = quarterTurn ? image.height : image.width;
  canvas.height = quarterTurn ? image.width : image.height;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((degrees * Math.PI) / 180);
  const preset = document.preset;
  const filter = preset === 'Black & White'
    ? 'brightness(1.05) contrast(1.2) grayscale(1)'
    : preset === 'Strong Text'
      ? 'brightness(1.08) contrast(1.28) saturate(0.95)'
      : preset === 'Document Clear'
        ? 'brightness(1.06) contrast(1.14) saturate(0.98)'
        : preset === 'Photo Recovery'
          ? 'brightness(1.1) contrast(1.08) saturate(1.04)'
          : 'brightness(1.04) contrast(1.08) saturate(1.01)';
  context.filter = filter;
  context.drawImage(image, -image.width / 2, -image.height / 2);
  return {
    uri: canvas.toDataURL('image/jpeg', 0.96),
    width: canvas.width,
    height: canvas.height,
  };
}

export function DocumentsProvider({ children }: PropsWithChildren) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        setDocuments(JSON.parse(stored) as DocumentItem[]);
      } catch {
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  const update = useCallback((next: DocumentItem[]) => {
    setDocuments(next);
    persist(next).catch(() => undefined);
  }, []);

  const enhanceDocument = useCallback(async (id: string, preset: Preset = 'Print Ready') => {
    const current = documents.find((item) => item.id === id);
    if (!current) return;
    update(documents.map((item) => item.id === id ? { ...item, status: 'processing', preset, error: undefined } : item));
    try {
      const result = await processImage(current);
      update(documents.map((item) => item.id === id ? {
        ...item,
        enhancedUri: result.uri,
        status: 'completed',
        preset,
        width: result.width,
        height: result.height,
      } : item));
    } catch {
      update(documents.map((item) => item.id === id ? {
        ...item,
        status: 'failed',
        error: 'Something went wrong while processing this document.',
      } : item));
    }
  }, [documents, update]);

  const addAssets = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
    const added = assets.map((asset, index): DocumentItem => ({
      id: makeId(),
      name: cleanName(asset.fileName ?? undefined, `Document_${String(index + 1).padStart(3, '0')}`),
      originalUri: asset.uri,
      createdAt: new Date().toISOString(),
      status: 'waiting',
      preset: 'Print Ready',
      width: asset.width,
      height: asset.height,
      size: asset.fileSize,
      rotation: 0,
    }));
    const next = [...added, ...documents];
    update(next);
    for (const item of added) {
      update(next.map((candidate) => candidate.id === item.id ? { ...candidate, status: 'processing' } : candidate));
      try {
        const result = await processImage(item);
        const completed = next.map((candidate) => candidate.id === item.id ? {
          ...candidate,
          enhancedUri: result.uri,
          status: 'completed' as DocumentStatus,
          width: result.width,
          height: result.height,
        } : candidate);
        next.splice(0, next.length, ...completed);
        update(completed);
      } catch {
        const failed = next.map((candidate) => candidate.id === item.id ? {
          ...candidate,
          status: 'failed' as DocumentStatus,
          error: 'Unable to process image.',
        } : candidate);
        next.splice(0, next.length, ...failed);
        update(failed);
      }
    }
  }, [documents, update]);

  const rotateDocument = useCallback(async (id: string, degrees: number) => {
    const current = documents.find((item) => item.id === id);
    if (!current) return;
    const rotation = (current.rotation + degrees + 360) % 360;
    update(documents.map((item) => item.id === id ? { ...item, status: 'processing', rotation } : item));
    try {
      const result = await processImage({ ...current, rotation }, rotation);
      update(documents.map((item) => item.id === id ? { ...item, enhancedUri: result.uri, status: 'completed', width: result.width, height: result.height } : item));
    } catch {
      update(documents.map((item) => item.id === id ? { ...item, status: 'failed' } : item));
    }
  }, [documents, update]);

  const enhanceAll = useCallback(async (preset: Preset = 'Print Ready') => {
    const ids = documents.filter((item) => item.status !== 'processing').map((item) => item.id);
    for (const id of ids) {
      await enhanceDocument(id, preset);
    }
  }, [documents, enhanceDocument]);

  const shareDocument = useCallback(async (document: DocumentItem) => {
    if (!document.enhancedUri) {
      Alert.alert('Not ready yet', 'Enhance this document before exporting.');
      return;
    }
    if (Platform.OS === 'web') {
      const link = globalThis.document.createElement('a');
      link.href = document.enhancedUri;
      link.download = outputName(document);
      link.click();
      return;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(document.enhancedUri, { mimeType: 'image/jpeg', dialogTitle: outputName(document) });
    }
  }, []);

  const shareAll = useCallback(async () => {
    const completed = documents.filter((item) => item.status === 'completed' && item.enhancedUri);
    if (!completed.length) {
      Alert.alert('Nothing to export', 'Complete at least one document first.');
      return;
    }
    if (Platform.OS === 'web') {
      try {
        const zip = new JSZip();
        for (const [index, item] of completed.entries()) {
          const base64 = item.enhancedUri!.split(',')[1];
          zip.file(`${String(index + 1).padStart(3, '0')}_${outputName(item)}`, base64, { base64: true });
        }
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const link = globalThis.document.createElement('a');
        link.href = url;
        link.download = `DocBright_Export_${new Date().toISOString().slice(0, 10)}.zip`;
        link.click();
        URL.revokeObjectURL(url);
      } catch {
        Alert.alert('Export unavailable', 'Something went wrong while creating the export archive.');
      }
      return;
    }
    if (!(await Sharing.isAvailableAsync())) return;
    try {
      const zip = new JSZip();
      for (const [index, item] of completed.entries()) {
        const base64 = await FileSystem.readAsStringAsync(item.enhancedUri!, { encoding: FileSystem.EncodingType.Base64 });
        zip.file(`${String(index + 1).padStart(3, '0')}_${outputName(item)}`, base64, { base64: true });
      }
      const archive = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
      const uri = `${FileSystem.cacheDirectory}DocBright_Export_${new Date().toISOString().slice(0, 10)}.zip`;
      await FileSystem.writeAsStringAsync(uri, archive, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: 'application/zip', dialogTitle: `DocBright export · ${completed.length} documents` });
    } catch {
      Alert.alert('Export unavailable', 'Something went wrong while creating the export archive.');
    }
  }, [documents]);

  const deleteDocument = useCallback((id: string) => update(documents.filter((item) => item.id !== id)), [documents, update]);
  const clearHistory = useCallback(() => {
    setDocuments([]);
    persist([]).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ documents, isLoading, addAssets, enhanceDocument, enhanceAll, rotateDocument, shareDocument, shareAll, deleteDocument, clearHistory }), [documents, isLoading, addAssets, enhanceDocument, enhanceAll, rotateDocument, shareDocument, shareAll, deleteDocument, clearHistory]);
  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (!context) throw new Error('useDocuments must be used inside DocumentsProvider');
  return context;
}
