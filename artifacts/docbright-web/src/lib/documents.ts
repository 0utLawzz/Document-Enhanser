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

export const PRESETS: Array<{ name: Preset; detail: string }> = [
  { name: 'Print Ready', detail: 'Balanced lift for clean paper output' },
  { name: 'Document Clear', detail: 'Brightens uneven paper and shadows' },
  { name: 'Natural', detail: 'Subtle correction that preserves tone' },
  { name: 'Black & White', detail: 'High contrast monochrome text' },
  { name: 'Strong Text', detail: 'Extra edge definition for small type' },
  { name: 'Photo Recovery', detail: 'Gentle lift for faded color pages' },
];

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
    case 'Natural': return { shadowLift: 0.22, contrast: 1.04, brightness: 2, saturation: 1.01, sharpen: 0.08, whiteBackground: 0.12 };
    case 'Document Clear': return { shadowLift: 0.42, contrast: 1.1, brightness: 5, saturation: 1, sharpen: 0.14, whiteBackground: 0.28 };
    case 'Black & White': return { shadowLift: 0.5, contrast: 1.2, brightness: 5, saturation: 0, sharpen: 0.18, whiteBackground: 0.34, monochrome: true };
    case 'Strong Text': return { shadowLift: 0.36, contrast: 1.2, brightness: 4, saturation: 0.98, sharpen: 0.23, whiteBackground: 0.2 };
    case 'Photo Recovery': return { shadowLift: 0.58, contrast: 1.06, brightness: 8, saturation: 1.03, sharpen: 0.12, whiteBackground: 0.34 };
    case 'Print Ready':
    default: return { shadowLift: 0.5, contrast: 1.12, brightness: 6, saturation: 1, sharpen: 0.16, whiteBackground: 0.32 };
  }
}

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));
const luminance = (red: number, green: number, blue: number) => red * 0.2126 + green * 0.7152 + blue * 0.0722;
const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ?? 0;
};

function buildLightingMap(pixels: Uint8ClampedArray, width: number, height: number, gridWidth: number, gridHeight: number) {
  const map = new Float32Array(gridWidth * gridHeight);
  const cellWidth = width / gridWidth;
  const cellHeight = height / gridHeight;
  for (let gy = 0; gy < gridHeight; gy += 1) {
    const startY = Math.floor(gy * cellHeight);
    const endY = Math.min(height, Math.ceil((gy + 1) * cellHeight));
    for (let gx = 0; gx < gridWidth; gx += 1) {
      const startX = Math.floor(gx * cellWidth);
      const endX = Math.min(width, Math.ceil((gx + 1) * cellWidth));
      let total = 0; let samples = 0;
      for (let y = startY; y < endY; y += 2) for (let x = startX; x < endX; x += 2) {
        const index = (y * width + x) * 4;
        total += luminance(pixels[index], pixels[index + 1], pixels[index + 2]); samples += 1;
      }
      map[gy * gridWidth + gx] = samples ? total / samples : 255;
    }
  }
  const blurred = new Float32Array(map.length);
  for (let gy = 0; gy < gridHeight; gy += 1) for (let gx = 0; gx < gridWidth; gx += 1) {
    let total = 0; let count = 0;
    for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) {
      const nx = Math.min(gridWidth - 1, Math.max(0, gx + ox));
      const ny = Math.min(gridHeight - 1, Math.max(0, gy + oy));
      total += map[ny * gridWidth + nx]; count += 1;
    }
    blurred[gy * gridWidth + gx] = total / count;
  }
  return blurred;
}

function sampleLightingMap(map: Float32Array, gridWidth: number, gridHeight: number, x: number, y: number, width: number, height: number) {
  const gx = (x / Math.max(1, width - 1)) * (gridWidth - 1);
  const gy = (y / Math.max(1, height - 1)) * (gridHeight - 1);
  const x0 = Math.floor(gx); const y0 = Math.floor(gy);
  const x1 = Math.min(gridWidth - 1, x0 + 1); const y1 = Math.min(gridHeight - 1, y0 + 1);
  const xWeight = gx - x0; const yWeight = gy - y0;
  const top = map[y0 * gridWidth + x0] * (1 - xWeight) + map[y0 * gridWidth + x1] * xWeight;
  const bottom = map[y1 * gridWidth + x0] * (1 - xWeight) + map[y1 * gridWidth + x1] * xWeight;
  return top * (1 - yWeight) + bottom * yWeight;
}

function enhancePixels(pixels: Uint8ClampedArray, width: number, height: number, preset: Preset) {
  const framePixels = new Uint8ClampedArray(pixels);
  const profile = getEnhancementProfile(preset);
  const gridWidth = Math.min(72, Math.max(18, Math.ceil(width / 28)));
  const gridHeight = Math.min(72, Math.max(18, Math.ceil(height / 28)));
  const lightingMap = buildLightingMap(framePixels, width, height, gridWidth, gridHeight);
  const luminanceSamples: number[] = [];
  const sampleStep = Math.max(1, Math.floor(Math.max(width, height) / 160));
  for (let y = 0; y < height; y += sampleStep) for (let x = 0; x < width; x += sampleStep) {
    const index = (y * width + x) * 4;
    luminanceSamples.push(luminance(framePixels[index], framePixels[index + 1], framePixels[index + 2]));
  }
  const blackPoint = percentile(luminanceSamples, 0.015);
  const whitePoint = Math.max(220, percentile(luminanceSamples, 0.985));
  const range = Math.max(80, whitePoint - blackPoint);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const index = (y * width + x) * 4;
    const red = framePixels[index]; const green = framePixels[index + 1]; const blue = framePixels[index + 2];
    const originalLuma = luminance(red, green, blue);
    const localBackground = sampleLightingMap(lightingMap, gridWidth, gridHeight, x, y, width, height);
    const shadowAmount = clamp((218 - localBackground) / 218, 0, 1) * profile.shadowLift;
    const liftedLuma = originalLuma + (255 - originalLuma) * shadowAmount * 0.48;
    const normalized = clamp((liftedLuma - blackPoint) / range * 255);
    const contrasted = clamp((normalized - 128) * profile.contrast + 128 + profile.brightness);
    const backgroundLift = Math.max(0, contrasted - 190) * profile.whiteBackground * 0.22;
    let targetLuma = clamp(contrasted + backgroundLift);
    if (profile.sharpen && x > 0 && y > 0 && x + 1 < width && y + 1 < height) {
      const upIndex = index - width * 4; const downIndex = index + width * 4;
      const up = luminance(framePixels[upIndex], framePixels[upIndex + 1], framePixels[upIndex + 2]);
      const down = luminance(framePixels[downIndex], framePixels[downIndex + 1], framePixels[downIndex + 2]);
      const left = luminance(framePixels[index - 4], framePixels[index - 3], framePixels[index - 2]);
      const right = luminance(framePixels[index + 4], framePixels[index + 5], framePixels[index + 6]);
      targetLuma = clamp(targetLuma + (originalLuma - (up + down + left + right) / 4) * profile.sharpen);
    }
    const ratio = targetLuma / Math.max(18, originalLuma);
    const colorSaturation = profile.monochrome ? 0 : profile.saturation;
    framePixels[index] = clamp(targetLuma + (red * ratio - originalLuma) * colorSaturation);
    framePixels[index + 1] = clamp(targetLuma + (green * ratio - originalLuma) * colorSaturation);
    framePixels[index + 2] = clamp(targetLuma + (blue * ratio - originalLuma) * colorSaturation);
  }
  return framePixels;
}

export async function enhanceImage(originalUri: string, degrees: number, preset: Preset) {
  const image = new globalThis.Image();
  image.src = originalUri;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Unable to load image')); });
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
  return { uri: canvas.toDataURL('image/jpeg', 0.96), width: canvas.width, height: canvas.height };
}

export function cleanName(name: string, fallback = 'Document') {
  const base = name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
  return base || fallback;
}
export function outputName(item: DocumentItem) { return `${cleanName(item.name)}_ENHANCED.jpg`; }
export function formatBytes(bytes?: number) {
  if (!bytes) return 'SIZE UNKNOWN';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}