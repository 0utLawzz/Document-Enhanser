import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import JSZip from 'jszip';
import jpeg from 'jpeg-js';
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

type EnhancementProfile = {
  shadowLift: number;
  contrast: number;
  brightness: number;
  saturation: number;
  sharpen: number;
  whiteBackground: number;
  monochrome?: boolean;
};

function getEnhancementProfile(preset: Preset): EnhancementProfile {
  switch (preset) {
    case 'Natural':
      return { shadowLift: 0.22, contrast: 1.04, brightness: 2, saturation: 1.01, sharpen: 0.08, whiteBackground: 0.12 };
    case 'Document Clear':
      return { shadowLift: 0.42, contrast: 1.1, brightness: 5, saturation: 1, sharpen: 0.14, whiteBackground: 0.28 };
    case 'Black & White':
      return { shadowLift: 0.5, contrast: 1.2, brightness: 5, saturation: 0, sharpen: 0.18, whiteBackground: 0.34, monochrome: true };
    case 'Strong Text':
      return { shadowLift: 0.36, contrast: 1.2, brightness: 4, saturation: 0.98, sharpen: 0.23, whiteBackground: 0.2 };
    case 'Photo Recovery':
      return { shadowLift: 0.58, contrast: 1.06, brightness: 8, saturation: 1.03, sharpen: 0.12, whiteBackground: 0.34 };
    case 'Print Ready':
    default:
      return { shadowLift: 0.5, contrast: 1.12, brightness: 6, saturation: 1, sharpen: 0.16, whiteBackground: 0.32 };
  }
}

async function processImage(document: DocumentItem, degrees = document.rotation, preset = document.preset) {
  if (Platform.OS === 'web') {
    return processImageOnWeb(document, degrees, preset);
  }
  return processImageOnNative(document, degrees, preset);
}

function clamp(value: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function luminance(red: number, green: number, blue: number) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function percentile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
}

function buildLightingMap(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  gridWidth: number,
  gridHeight: number,
) {
  const map = new Float32Array(gridWidth * gridHeight);
  const cellWidth = width / gridWidth;
  const cellHeight = height / gridHeight;

  for (let gy = 0; gy < gridHeight; gy += 1) {
    const startY = Math.floor(gy * cellHeight);
    const endY = Math.min(height, Math.ceil((gy + 1) * cellHeight));
    for (let gx = 0; gx < gridWidth; gx += 1) {
      const startX = Math.floor(gx * cellWidth);
      const endX = Math.min(width, Math.ceil((gx + 1) * cellWidth));
      let total = 0;
      let samples = 0;
      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const index = (y * width + x) * 4;
          total += luminance(pixels[index], pixels[index + 1], pixels[index + 2]);
          samples += 1;
        }
      }
      map[gy * gridWidth + gx] = samples ? total / samples : 255;
    }
  }

  // A small box blur makes the lighting estimate ignore text and stamps.
  const blurred = new Float32Array(map.length);
  for (let gy = 0; gy < gridHeight; gy += 1) {
    for (let gx = 0; gx < gridWidth; gx += 1) {
      let total = 0;
      let count = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = Math.min(gridWidth - 1, Math.max(0, gx + ox));
          const ny = Math.min(gridHeight - 1, Math.max(0, gy + oy));
          total += map[ny * gridWidth + nx];
          count += 1;
        }
      }
      blurred[gy * gridWidth + gx] = total / count;
    }
  }
  return blurred;
}

function sampleLightingMap(map: Float32Array, gridWidth: number, gridHeight: number, x: number, y: number, width: number, height: number) {
  const gx = (x / Math.max(1, width - 1)) * (gridWidth - 1);
  const gy = (y / Math.max(1, height - 1)) * (gridHeight - 1);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(gridWidth - 1, x0 + 1);
  const y1 = Math.min(gridHeight - 1, y0 + 1);
  const xWeight = gx - x0;
  const yWeight = gy - y0;
  const top = map[y0 * gridWidth + x0] * (1 - xWeight) + map[y0 * gridWidth + x1] * xWeight;
  const bottom = map[y1 * gridWidth + x0] * (1 - xWeight) + map[y1 * gridWidth + x1] * xWeight;
  return top * (1 - yWeight) + bottom * yWeight;
}

function enhancePixels(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number, preset: Preset) {
  const framePixels = pixels instanceof Uint8ClampedArray ? pixels : new Uint8ClampedArray(pixels);
  const profile = getEnhancementProfile(preset);
  const gridWidth = Math.min(72, Math.max(18, Math.ceil(width / 28)));
  const gridHeight = Math.min(72, Math.max(18, Math.ceil(height / 28)));
  const lightingMap = buildLightingMap(framePixels, width, height, gridWidth, gridHeight);
  const luminanceSamples: number[] = [];
  const sampleStep = Math.max(1, Math.floor(Math.max(width, height) / 160));

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const index = (y * width + x) * 4;
      luminanceSamples.push(luminance(framePixels[index], framePixels[index + 1], framePixels[index + 2]));
    }
  }

  const blackPoint = percentile(luminanceSamples, 0.015);
  const whitePoint = Math.max(220, percentile(luminanceSamples, 0.985));
  const range = Math.max(80, whitePoint - blackPoint);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = framePixels[index];
      const green = framePixels[index + 1];
      const blue = framePixels[index + 2];
      const originalLuma = luminance(red, green, blue);
      const localBackground = sampleLightingMap(lightingMap, gridWidth, gridHeight, x, y, width, height);
      const shadowAmount = clamp((218 - localBackground) / 218, 0, 1) * profile.shadowLift;
      const liftedLuma = originalLuma + (255 - originalLuma) * shadowAmount * 0.48;
      const normalized = clamp((liftedLuma - blackPoint) / range * 255);
      const contrasted = clamp((normalized - 128) * profile.contrast + 128 + profile.brightness);
      const backgroundLift = Math.max(0, contrasted - 190) * profile.whiteBackground * 0.22;
      let targetLuma = clamp(contrasted + backgroundLift);

      if (profile.sharpen && x > 0 && y > 0 && x + 1 < width && y + 1 < height) {
        const upIndex = index - width * 4;
        const downIndex = index + width * 4;
        const up = luminance(framePixels[upIndex], framePixels[upIndex + 1], framePixels[upIndex + 2]);
        const down = luminance(framePixels[downIndex], framePixels[downIndex + 1], framePixels[downIndex + 2]);
        const left = luminance(framePixels[index - 4], framePixels[index - 3], framePixels[index - 2]);
        const right = luminance(framePixels[index + 4], framePixels[index + 5], framePixels[index + 6]);
        const detail = originalLuma - (up + down + left + right) / 4;
        targetLuma = clamp(targetLuma + detail * profile.sharpen);
      }

      const ratio = targetLuma / Math.max(18, originalLuma);
      const colorSaturation = profile.monochrome ? 0 : profile.saturation;
      const adjustedRed = red * ratio;
      const adjustedGreen = green * ratio;
      const adjustedBlue = blue * ratio;
      framePixels[index] = clamp(targetLuma + (adjustedRed - originalLuma) * colorSaturation);
      framePixels[index + 1] = clamp(targetLuma + (adjustedGreen - originalLuma) * colorSaturation);
      framePixels[index + 2] = clamp(targetLuma + (adjustedBlue - originalLuma) * colorSaturation);
    }
  }

  return framePixels;
}

function base64ToBytes(base64: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const outputLength = Math.floor((clean.length * 3) / 4) - (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0);
  const bytes = new Uint8Array(outputLength);
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of clean) {
    if (character === '=') break;
    buffer = (buffer << 6) | alphabet.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset] = (buffer >> bits) & 255;
      offset += 1;
    }
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    result += alphabet[first >> 2];
    result += alphabet[((first & 3) << 4) | (second === undefined ? 0 : second >> 4)];
    result += second === undefined ? '=' : alphabet[((second & 15) << 2) | (third === undefined ? 0 : third >> 6)];
    result += third === undefined ? '=' : alphabet[third & 63];
  }
  return result;
}

async function processImageOnNative(document: DocumentItem, degrees: number, preset: Preset) {
  const encodedInput = await FileSystem.readAsStringAsync(document.originalUri, { encoding: FileSystem.EncodingType.Base64 });
  const decoded = jpeg.decode(base64ToBytes(encodedInput), { useTArray: true, formatAsRGBA: true });
  const pixels = enhancePixels(decoded.data, decoded.width, decoded.height, preset);
  const encoded = jpeg.encode({ data: new Uint8Array(pixels), width: decoded.width, height: decoded.height }, 96);
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) throw new Error('Device cache is unavailable');
  const outputUri = `${cacheDirectory}docbright_${document.id}_${degrees}.jpg`;
  await FileSystem.writeAsStringAsync(outputUri, bytesToBase64(encoded.data), { encoding: FileSystem.EncodingType.Base64 });
  if (!degrees) return { uri: outputUri, width: decoded.width, height: decoded.height };
  const rotated = await ImageManipulator.manipulateAsync(outputUri, [{ rotate: degrees }], {
    compress: 0.96,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return rotated;
}

async function processImageOnWeb(document: DocumentItem, degrees: number, preset: Preset) {
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
  context.drawImage(image, -image.width / 2, -image.height / 2);
  const frame = context.getImageData(0, 0, canvas.width, canvas.height);
  frame.data.set(enhancePixels(frame.data, canvas.width, canvas.height, preset));
  context.putImageData(frame, 0, 0);
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
      const result = await processImage(current, current.rotation, preset);
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
        const result = await processImage(item, item.rotation, item.preset);
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
      const result = await processImage({ ...current, rotation }, rotation, current.preset);
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
