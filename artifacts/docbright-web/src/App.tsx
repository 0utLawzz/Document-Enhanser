import JSZip from 'jszip';
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  FileImage,
  FolderOpen,
  HardDriveDownload,
  Info,
  LoaderCircle,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import {
  cleanName,
  enhanceImage,
  formatBytes,
  outputName,
  PRESETS,
  type DocumentItem,
  type DocumentStatus,
  type Preset,
} from '@/lib/documents';

const STORAGE_KEY = 'docbright-desktop-queue-v1';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = uri;
  });
}

function statusText(status: DocumentStatus) {
  if (status === 'completed') return 'READY';
  if (status === 'processing') return 'WORKING';
  if (status === 'failed') return 'FAILED';
  return 'WAITING';
}

function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [storageWarning, setStorageWarning] = useState('');
  const [batchPreset, setBatchPreset] = useState<Preset>('Print Ready');
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'DocBright Desktop — Local Document Enhancer';
    const description = 'Make scanned documents clearer and print-ready entirely in your browser.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDocuments(JSON.parse(stored) as DocumentItem[]);
    } catch {
      setStorageWarning('Local queue data could not be restored. New work will still stay in this browser.');
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (documents.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      setStorageWarning('The browser storage limit was reached. Download completed files, then remove older queue items.');
    }
  }, [documents, hydrated]);

  const addFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) {
      setErrorMessage('Choose JPG, PNG, WEBP, or another image file to begin.');
      return;
    }
    setIsAdding(true);
    setErrorMessage('');
    try {
      const added = await Promise.all(imageFiles.map(async (file, index) => {
        const originalUri = await fileToDataUrl(file);
        const size = await readImageSize(originalUri);
        return {
          id: makeId(),
          name: cleanName(file.name, `Document_${String(index + 1).padStart(3, '0')}`),
          originalUri,
          createdAt: new Date().toISOString(),
          status: 'waiting' as const,
          preset: batchPreset,
          width: size.width,
          height: size.height,
          size: file.size,
          rotation: 0,
        };
      }));
      setDocuments((current) => [...added, ...current]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'One or more files could not be added.');
    } finally {
      setIsAdding(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void addFiles(event.target.files);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  };
  const handleDropzoneKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const enhanceOne = async (item: DocumentItem, preset = item.preset) => {
    setActiveAction(item.id);
    setErrorMessage('');
    setDocuments((current) => current.map((candidate) => candidate.id === item.id
      ? { ...candidate, status: 'processing', preset, error: undefined }
      : candidate));
    try {
      const result = await enhanceImage(item.originalUri, item.rotation, preset);
      setDocuments((current) => current.map((candidate) => candidate.id === item.id
        ? { ...candidate, enhancedUri: result.uri, status: 'completed', preset, width: result.width, height: result.height }
        : candidate));
    } catch {
      setDocuments((current) => current.map((candidate) => candidate.id === item.id
        ? { ...candidate, status: 'failed', error: 'Canvas could not process this image.' }
        : candidate));
      setErrorMessage(`Could not enhance ${item.name}. Try adding it again.`);
    } finally {
      setActiveAction('');
    }
  };

  const enhanceAll = async () => {
    const waiting = documents.filter((item) => item.status !== 'processing');
    setActiveAction('all');
    for (const item of waiting) await enhanceOne(item, batchPreset);
    setActiveAction('');
  };

  const rotate = async (item: DocumentItem) => {
    const rotation = (item.rotation + 90) % 360;
    if (!item.enhancedUri) {
      setDocuments((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, rotation } : candidate));
      return;
    }
    setActiveAction(item.id);
    setDocuments((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, rotation, status: 'processing' } : candidate));
    try {
      const result = await enhanceImage(item.originalUri, rotation, item.preset);
      setDocuments((current) => current.map((candidate) => candidate.id === item.id
        ? { ...candidate, enhancedUri: result.uri, width: result.width, height: result.height, status: 'completed' }
        : candidate));
    } catch {
      setDocuments((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: 'failed' } : candidate));
    } finally {
      setActiveAction('');
    }
  };

  const downloadOne = (item: DocumentItem) => {
    if (!item.enhancedUri) return;
    const link = document.createElement('a');
    link.href = item.enhancedUri;
    link.download = outputName(item);
    link.click();
  };

  const downloadAll = async () => {
    const completed = documents.filter((item) => item.status === 'completed' && item.enhancedUri);
    if (!completed.length) {
      setErrorMessage('Enhance at least one document before creating a ZIP.');
      return;
    }
    setActiveAction('zip');
    setErrorMessage('');
    try {
      const zip = new JSZip();
      completed.forEach((item, index) => {
        const base64 = item.enhancedUri!.split(',')[1];
        zip.file(`${String(index + 1).padStart(3, '0')}_${outputName(item)}`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `DocBright_Export_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch {
      setErrorMessage('The ZIP could not be created. Try downloading the files individually.');
    } finally {
      setActiveAction('');
    }
  };

  const deleteOne = (id: string) => setDocuments((current) => current.filter((item) => item.id !== id));
  const clearAll = () => {
    setDocuments([]);
    setConfirmClear(false);
    localStorage.removeItem(STORAGE_KEY);
  };
  const updatePreset = (id: string, preset: Preset) => {
    setDocuments((current) => current.map((item) => item.id === id ? { ...item, preset } : item));
  };

  const completedCount = documents.filter((item) => item.status === 'completed').length;
  const processingCount = documents.filter((item) => item.status === 'processing').length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-brand">DOCBRIGHT<span className="brand-dot">.</span><span className="brand-sub">DESKTOP</span></a>
        <div className="topbar-note"><b>LOCAL MODE</b>&nbsp; · &nbsp;NO SERVER REQUIRED</div>
      </header>

      <main className="workspace">
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">DOCUMENT WORKSTATION / 01</p>
            <h1 id="page-title">BRIGHTER<br />SCANS.</h1>
          </div>
          <p className="hero-copy"><strong>Clear, print-ready documents.</strong><br />A conservative browser enhancer for the pages that matter. Your files stay on this PC.</p>
        </section>

        <div className="work-grid">
          <section className="main-column" aria-label="Document queue">
            <div className="panel">
              <div
                className={`dropzone${isDragging ? ' dragging' : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Upload image files"
                data-testid="dropzone-upload"
                onClick={() => inputRef.current?.click()}
                onKeyDown={handleDropzoneKey}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="dropzone-inner">
                  <div className="drop-icon"><Upload size={23} strokeWidth={2.5} /></div>
                  <h2>{isAdding ? 'READING FILES...' : 'DROP SCANS HERE'}</h2>
                  <p>Upload one or many image files. Processing begins only when you choose a preset and press enhance.</p>
                  <button className="upload-button" type="button" data-testid="button-browse-files" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>
                    <FolderOpen size={15} /> Browse files
                  </button>
                  <input ref={inputRef} type="file" accept="image/*" multiple hidden data-testid="input-file-upload" onChange={handleInput} />
                </div>
              </div>
            </div>

            {errorMessage && <p className="error-line" role="alert" data-testid="status-error"><AlertTriangle size={14} /> {errorMessage}</p>}
            {storageWarning && <p className="error-line" role="status" data-testid="status-storage-warning"><Info size={14} /> {storageWarning}</p>}

            <div className="panel">
              <div className="panel-header">
                <h2>QUEUE / WORKBENCH</h2>
                <span className="count" data-testid="text-queue-count">{documents.length} FILE{documents.length === 1 ? '' : 'S'}</span>
              </div>
              {!hydrated ? (
                <div className="loading-state" data-testid="state-loading"><div className="skeleton long" /><div className="skeleton" /><div className="skeleton" /></div>
              ) : documents.length === 0 ? (
                <div className="empty-state" data-testid="state-empty">
                  <div className="empty-mark"><FileImage size={27} /></div>
                  <h3>YOUR QUEUE IS CLEAR</h3>
                  <p>Drop a scan above to create your first local work item. Original files are never overwritten.</p>
                </div>
              ) : (
                <div className="queue-list">
                  {documents.map((item) => (
                    <article className="queue-item" key={item.id} data-testid={`card-document-${item.id}`}>
                      <div className="preview-pair">
                        <figure className="preview-box">
                          <img src={item.originalUri} alt={`Original scan: ${item.name}`} data-testid={`img-original-${item.id}`} />
                          <figcaption>Original</figcaption>
                        </figure>
                        <figure className="preview-box">
                          {item.enhancedUri ? <img src={item.enhancedUri} alt={`Enhanced scan: ${item.name}`} data-testid={`img-enhanced-${item.id}`} /> : <div className="preview-empty"><Sparkles size={17} />ENHANCE TO<br />PREVIEW</div>}
                          <figcaption>Enhanced</figcaption>
                        </figure>
                      </div>
                      <div className="item-content">
                        <div className="item-title-row">
                          <h3 className="item-name" title={item.name} data-testid={`text-document-name-${item.id}`}>{item.name}</h3>
                          <span className={`status ${item.status}`} data-testid={`status-document-${item.id}`}>{statusText(item.status)}</span>
                        </div>
                        <div className="item-meta">
                          <span><b>{item.width} × {item.height}</b> PX</span>
                          <span><b>{formatBytes(item.size)}</b></span>
                          <span><b>ROT {item.rotation}°</b></span>
                        </div>
                        {item.error && <div className="item-meta"><span>{item.error}</span></div>}
                        <div className="item-actions">
                          <select className="preset-select" aria-label={`Enhancement preset for ${item.name}`} value={item.preset} data-testid={`select-preset-${item.id}`} onChange={(event) => updatePreset(item.id, event.target.value as Preset)}>
                            {PRESETS.map((preset) => <option value={preset.name} key={preset.name}>{preset.name}</option>)}
                          </select>
                          <button className="button small teal" type="button" disabled={activeAction === item.id} data-testid={`button-enhance-${item.id}`} onClick={() => void enhanceOne(item)}>
                            {activeAction === item.id ? <LoaderCircle size={13} className="spin" /> : <Sparkles size={13} />} {item.enhancedUri ? 'Re-enhance' : 'Enhance'}
                          </button>
                          <button className="button small secondary icon-only" type="button" disabled={activeAction === item.id} aria-label={`Rotate ${item.name}`} title="Rotate 90 degrees" data-testid={`button-rotate-${item.id}`} onClick={() => void rotate(item)}><RotateCw size={14} /></button>
                          <button className="button small secondary icon-only" type="button" disabled={!item.enhancedUri} aria-label={`Download ${item.name}`} title="Download JPG" data-testid={`button-download-${item.id}`} onClick={() => downloadOne(item)}><HardDriveDownload size={14} /></button>
                          <button className="button small danger icon-only" type="button" aria-label={`Delete ${item.name}`} title="Remove from queue" data-testid={`button-delete-${item.id}`} onClick={() => deleteOne(item.id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="rail" aria-label="Enhancement controls">
            <section className="panel">
              <div className="panel-header"><h2>BATCH CONTROLS</h2><ChevronDown size={18} /></div>
              <div className="control-body">
                <div className="control-block">
                  <label className="section-label" htmlFor="batch-preset">Apply preset to all</label>
                  <select id="batch-preset" className="rail-select" value={batchPreset} data-testid="select-batch-preset" onChange={(event) => setBatchPreset(event.target.value as Preset)}>
                    {PRESETS.map((preset) => <option value={preset.name} key={preset.name}>{preset.name}</option>)}
                  </select>
                  <p>{PRESETS.find((preset) => preset.name === batchPreset)?.detail}</p>
                </div>
                <div className="control-block">
                  <button className="button teal full-button" type="button" disabled={!documents.length || !!activeAction} data-testid="button-enhance-all" onClick={() => void enhanceAll()}><Sparkles size={15} /> Enhance all files</button>
                  <button className="button secondary full-button" type="button" disabled={!completedCount || !!activeAction} data-testid="button-download-all" onClick={() => void downloadAll()}>{activeAction === 'zip' ? <LoaderCircle size={15} className="spin" /> : <Archive size={15} />} Download completed ZIP</button>
                </div>
                <div className="control-block">
                  <div className="stat-line"><span>In queue</span><strong data-testid="text-stat-queue">{documents.length}</strong></div>
                  <div className="stat-line"><span>Completed</span><strong data-testid="text-stat-completed">{completedCount}</strong></div>
                  <div className="stat-line"><span>Working now</span><strong data-testid="text-stat-processing">{processingCount}</strong></div>
                </div>
              </div>
            </section>

            <section className="privacy-panel" data-testid="panel-privacy">
              <div className="privacy-label"><ShieldCheck size={14} /> Local privacy</div>
              <h3>NO CLOUD.<br />NO COPIES.</h3>
              <p>Images are read by your browser's Canvas API. The queue is persisted only in this browser's local storage. Nothing is uploaded or shared.</p>
            </section>

            <section className="panel">
              <div className="control-body">
                <div className="stamp">ORIGINALS LOCKED</div>
                <div className="control-block">
                  <p>DocBright writes enhanced JPGs beside your originals conceptually, never over them. Rotate and re-enhance as often as needed.</p>
                </div>
                <button className="button danger full-button" type="button" disabled={!documents.length} data-testid="button-clear-all" onClick={() => setConfirmClear(true)}><Trash2 size={15} /> Clear all queue</button>
              </div>
            </section>
          </aside>
        </div>
        <footer className="footer-note"><span>DOCBRIGHT DESKTOP / PRIVATE BY DEFAULT</span><span>CANVAS ENHANCEMENT ENGINE · JPG OUTPUT</span></footer>
      </main>

      {confirmClear && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmClear(false); }}>
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-title">
            <h2 id="clear-title">CLEAR THE QUEUE?</h2>
            <p>This removes all uploaded originals, enhanced previews, and the saved local browser state. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="button secondary" type="button" data-testid="button-cancel-clear" onClick={() => setConfirmClear(false)}>Keep files</button>
              <button className="button danger" type="button" data-testid="button-confirm-clear" onClick={clearAll}><X size={15} /> Clear everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;