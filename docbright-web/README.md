<div align="center">

<img src="public/favicon.svg" width="80" height="80" alt="DocBright Logo" />

# DocBright Desktop

**A privacy-first browser document enhancer. No uploads. No cloud. No traces.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

## ✨ What Is DocBright?

DocBright is a **local-first document enhancer** that runs entirely in your browser. Drop in scanned pages, ID photos, handwritten notes, or any image — choose an enhancement preset — and get a crisp, print-ready JPEG in seconds.

**Nothing ever leaves your machine.** There is no backend, no API key, no account, and no analytics. Processing happens in the browser's `<canvas>` API — pure JavaScript, zero network.

---

## 🖥️ Preview

> Drop scans → pick a preset → enhance → download.  
> A dark, cyberpunk-inspired UI built for focus and speed.

---

## ⚡ Features

| Feature | Detail |
|---|---|
| 🔒 **100% Local** | All processing happens in your browser — nothing is uploaded |
| 🖼️ **6 Enhancement Presets** | Print Ready, Document Clear, Natural, B&W, Strong Text, Photo Recovery |
| 📦 **Batch Processing** | Enhance all files in one click |
| 🗜️ **ZIP Export** | Bundle all completed files into a single ZIP |
| 🔄 **Rotate & Re-enhance** | Rotate 90° and re-process without re-uploading |
| 💾 **Session Persistence** | Queue is saved to `localStorage` — survives page refresh |
| 🎨 **Dark Neon UI** | Glass panels, gradient text, and smooth micro-animations |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) ≥ 18
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/0utLawzz/Document-Enhanser.git
cd Document-Enhanser/docbright-web

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you're done.

### Build for Production

```bash
npm run build
# Output is in: dist/
```

Preview the production build:
```bash
npm run preview
```

---

## 🎨 Enhancement Presets

| Preset | Best For |
|---|---|
| 🖨️ **Print Ready** | Everyday scans — balanced lift for clean paper output |
| 📄 **Document Clear** | Brightens uneven paper and shadow gradients |
| 🌿 **Natural** | Subtle correction that preserves original tone |
| ⚫ **Black & White** | High-contrast monochrome text — perfect for text docs |
| 🔤 **Strong Text** | Extra edge sharpening for small or faded type |
| 📸 **Photo Recovery** | Gentle lift for faded colour pages and old photos |

---

## 🧠 How It Works

DocBright uses a custom **adaptive lighting correction** algorithm implemented with the Canvas 2D API:

1. **Grid Lighting Map** — divides the image into a grid and samples average luminance per cell
2. **Bicubic-style Interpolation** — smoothly blends the grid into a per-pixel lighting estimate
3. **Adaptive Black/White Point** — detects the actual tonal range (not just 0–255) and stretches it
4. **Shadow Lift** — selectively brightens dark regions while preserving detail
5. **Contrast + Brightness Pass** — applies preset-specific contrast and brightness
6. **Unsharp Mask** — sharpens edges using a fast per-pixel Laplacian kernel
7. **Saturation Control** — adjusts colour saturation (or converts to monochrome for B&W preset)

All of this runs synchronously on the raw `ImageData` buffer — no WASM, no workers, no dependencies beyond the browser.

---

## 📁 Project Structure

```
docbright-web/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── error-boundary.tsx   # React error boundary
│   ├── lib/
│   │   ├── documents.ts         # Core enhancement engine + types
│   │   └── utils.ts             # Helper utilities
│   ├── App.tsx                  # Main application
│   ├── index.css                # Design system & styles
│   └── main.tsx                 # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Tech Stack

- **[Vite 6](https://vitejs.dev)** — lightning-fast dev server and build tool
- **[React 19](https://react.dev)** — UI framework
- **[TypeScript 5](https://www.typescriptlang.org)** — type safety
- **[Lucide React](https://lucide.dev)** — icon set
- **[JSZip](https://stuk.github.io/jszip/)** — client-side ZIP bundling
- **[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** — image processing engine

---

## 🔒 Privacy Guarantee

- **No network requests are made** for image processing
- Files are read via the browser's `FileReader` API — local only
- The queue is persisted in `localStorage` — never sent anywhere
- There is no telemetry, tracking, or analytics of any kind

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](../LICENSE) for more information.

---

<div align="center">

Built with ❤️ — **private by default, powerful by design.**

</div>
