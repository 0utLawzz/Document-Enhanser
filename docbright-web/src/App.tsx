import JSZip from 'jszip';
import {
  AlertTriangle,
  Archive,
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
  Zap,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import {
  cleanName,
  enhanceImage,
  formatBytes,
  outputName,
  PRESETS,
  type DocumentItem,
  type DocumentStatus,
  type Preset,
} from './lib/documents';

const STORAGE_KEY = 'docbright-queue-v2';

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
  return 'QUEUED';
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
    document.title = 'DocBright — Local Document Enhancer';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDocuments(JSON.parse(stored) as DocumentItem[]);
    } catch {
      setStorageWarning('Local queue could not be restored. New work will still save here.');
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
      setStorageWarning('Browser storage limit reached. Download completed files, then remove older items.');
    }
  }, [documents, hydrated]);

  const addFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) {
      setErrorMessage('Choose JPG, PNG, WEBP, or another image file to begin.');
      return;
    }
    setIsAdding(true);
    setErrorMessage('');
    try {
      const added = await Promise.all(
        imageFiles.map(async (file, index) => {
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
        }),
      );
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
    setDocuments((current) =>
      current.map((c) => (c.id === item.id ? { ...c, status: 'processing', preset, error: undefined } : c)),
    );
    try {
      const result = await enhanceImage(item.originalUri, item.rotation, preset);
      setDocuments((current) =>
        current.map((c) =>
          c.id === item.id
            ? { ...c, enhancedUri: result.uri, status: 'completed', preset, width: result.width, height: result.height }
            : c,
        ),
      );
    } catch {
      setDocuments((current) =>
        current.map((c) => (c.id === item.id ? { ...c, status: 'failed', error: 'Canvas could not process this image.' } : c)),
      );
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
      setDocuments((current) => current.map((c) => (c.id === item.id ? { ...c, rotation } : c)));
      return;
    }
    setActiveAction(item.id);
    setDocuments((current) =>
      current.map((c) => (c.id === item.id ? { ...c, rotation, status: 'processing' } : c)),
    );
    try {
      const result = await enhanceImage(item.originalUri, rotation, item.preset);
      setDocuments((current) =>
        current.map((c) =>
          c.id === item.id
            ? { ...c, enhancedUri: result.uri, width: result.width, height: result.height, status: 'completed' }
            : c,
        ),
      );
    } catch {
      setDocuments((current) =>
        current.map((c) => (c.id === item.id ? { ...c, status: 'failed' } : c)),
      );
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
      setErrorMessage('The ZIP could not be created. Try downloading files individually.');
    } finally {
      setActiveAction('');
    }
  };

  const deleteOne = (id: string) =>
    setDocuments((current) => current.filter((item) => item.id !== id));

  const clearAll = () => {
    setDocuments([]);
    setConfirmClear(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updatePreset = (id: string, preset: Preset) => {
    setDocuments((current) => current.map((item) => (item.id === id ? { ...item, preset } : item)));
  };

  const completedCount = documents.filter((item) => item.status === 'completed').length;
  const processingCount = documents.filter((item) => item.status === 'processing').length;
  const waitingCount = documents.filter((item) => item.status === 'waiting').length;

  return (
    <div className="app-shell">
      {/* ── Topbar ── */}
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-brand">
          DOC<span className="brand-accent">BRIGHT</span>
          <span className="brand-sub">DESKTOP</span>
        </a>
        <div className="topbar-pills">
          <span className="pill pill-green" data-testid="pill-local">
            <span className="pill-dot" />
            LOCAL MODE
          </span>
          <span className="pill pill-cyan">
            <ShieldCheck size={11} />
            PRIVATE
          </span>
        </div>
      </header>

      <main className="workspace">
        {/* ── Hero ── */}
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-left">
            <p className="eyebrow">Document Workstation v2</p>
            <h1 id="page-title">
              BRIGHTER<br />SCANS.
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-copy">
              <strong>Crystal-clear, print-ready documents.</strong><br />
              A privacy-first browser enhancer. Your files never leave this machine — no uploads, no cloud, no tracking.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="num" data-testid="stat-queue">{documents.length}</span>
                <span className="lbl">In queue</span>
              </div>
              <div className="hero-stat">
                <span className="num" data-testid="stat-done">{completedCount}</span>
                <span className="lbl">Enhanced</span>
              </div>
              <div className="hero-stat">
                <span className="num" data-testid="stat-working">{processingCount}</span>
                <span className="lbl">Working</span>
              </div>
            </div>
          </div>
        </section>

        <div className="work-grid">
          {/* ── Main Column ── */}
          <section className="main-column" aria-label="Document queue">

            {/* Dropzone */}
            <div className="panel">
              <div
                className={`dropzone${isDragging ? ' dragging' : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Upload image files"
                data-testid="dropzone-upload"
                onClick={() => inputRef.current?.click()}
                onKeyDown={handleDropzoneKey}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="dropzone-inner">
                  <div className="drop-icon-wrap">
                    {isAdding
                      ? <LoaderCircle size={28} className="spin" />
                      : <Upload size={28} strokeWidth={1.5} />
                    }
                  </div>
                  <h2>{isAdding ? 'READING FILES...' : 'DROP SCANS HERE'}</h2>
                  <p>
                    Drop one or many image files. JPG, PNG, WEBP and more are supported.
                    Processing begins only when you press Enhance.
                  </p>
                  <button
                    className="upload-button"
                    type="button"
                    data-testid="button-browse-files"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  >
                    <FolderOpen size={15} />
                    Browse files
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    data-testid="input-file-upload"
                    onChange={handleInput}
                  />
                </div>
              </div>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <p className="alert alert-error" role="alert" data-testid="status-error">
                <AlertTriangle size={14} />
                {errorMessage}
              </p>
            )}
            {storageWarning && (
              <p className="alert alert-info" role="status" data-testid="status-storage-warning">
                <Info size={14} />
                {storageWarning}
              </p>
            )}

            {/* Queue Panel */}
            <div className="panel">
              <div className="panel-header">
                <h2>QUEUE / WORKBENCH</h2>
                <span className="badge" data-testid="text-queue-count">
                  {documents.length} FILE{documents.length === 1 ? '' : 'S'}
                </span>
              </div>

              {!hydrated ? (
                <div className="loading-state" data-testid="state-loading">
                  <div className="skeleton long" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-state" data-testid="state-empty">
                  <div className="empty-mark"><FileImage size={28} /></div>
                  <h3>YOUR QUEUE IS CLEAR</h3>
                  <p>Drop a scan above to create your first work item. Original files are never overwritten.</p>
                </div>
              ) : (
                <div className="queue-list">
                  {documents.map((item) => (
                    <article
                      className="queue-item"
                      key={item.id}
                      data-testid={`card-document-${item.id}`}
                    >
                      {/* Preview Pair */}
                      <div className="preview-pair">
                        <figure className="preview-box">
                          <img
                            src={item.originalUri}
                            alt={`Original scan: ${item.name}`}
                            data-testid={`img-original-${item.id}`}
                          />
                          <figcaption>Original</figcaption>
                        </figure>
                        <figure className="preview-box">
                          {item.enhancedUri ? (
                            <img
                              src={item.enhancedUri}
                              alt={`Enhanced: ${item.name}`}
                              data-testid={`img-enhanced-${item.id}`}
                            />
                          ) : (
                            <div className="preview-empty">
                              <Sparkles size={18} />
                              ENHANCE TO PREVIEW
                            </div>
                          )}
                          <figcaption>Enhanced</figcaption>
                        </figure>
                      </div>

                      {/* Item Content */}
                      <div className="item-content">
                        <div className="item-title-row">
                          <h3 className="item-name" title={item.name} data-testid={`text-document-name-${item.id}`}>
                            {item.name}
                          </h3>
                          <span
                            className={`status-badge ${item.status}`}
                            data-testid={`status-document-${item.id}`}
                          >
                            {statusText(item.status)}
                          </span>
                        </div>

                        <div className="item-meta">
                          <span><b>{item.width} × {item.height}</b> PX</span>
                          <span><b>{formatBytes(item.size)}</b></span>
                          <span><b>ROT {item.rotation}°</b></span>
                          <span><b>{item.preset}</b></span>
                        </div>

                        {item.error && (
                          <div className="item-meta" style={{ color: 'var(--red)' }}>
                            <span>{item.error}</span>
                          </div>
                        )}

                        <div className="item-actions">
                          <select
                            className="preset-select"
                            aria-label={`Enhancement preset for ${item.name}`}
                            value={item.preset}
                            data-testid={`select-preset-${item.id}`}
                            onChange={(e) => updatePreset(item.id, e.target.value as Preset)}
                          >
                            {PRESETS.map((p) => (
                              <option value={p.name} key={p.name}>
                                {p.icon} {p.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="button teal small"
                            type="button"
                            disabled={activeAction === item.id}
                            data-testid={`button-enhance-${item.id}`}
                            onClick={() => void enhanceOne(item)}
                          >
                            {activeAction === item.id
                              ? <LoaderCircle size={13} className="spin" />
                              : <Sparkles size={13} />}
                            {item.enhancedUri ? 'Re-enhance' : 'Enhance'}
                          </button>
                          <button
                            className="button secondary small icon-only"
                            type="button"
                            disabled={activeAction === item.id}
                            aria-label={`Rotate ${item.name}`}
                            title="Rotate 90°"
                            data-testid={`button-rotate-${item.id}`}
                            onClick={() => void rotate(item)}
                          >
                            <RotateCw size={14} />
                          </button>
                          <button
                            className="button secondary small icon-only"
                            type="button"
                            disabled={!item.enhancedUri}
                            aria-label={`Download ${item.name}`}
                            title="Download JPG"
                            data-testid={`button-download-${item.id}`}
                            onClick={() => downloadOne(item)}
                          >
                            <HardDriveDownload size={14} />
                          </button>
                          <button
                            className="button danger small icon-only"
                            type="button"
                            aria-label={`Delete ${item.name}`}
                            title="Remove from queue"
                            data-testid={`button-delete-${item.id}`}
                            onClick={() => deleteOne(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Rail ── */}
          <aside className="rail" aria-label="Enhancement controls">

            {/* Batch Controls */}
            <section className="panel">
              <div className="panel-header">
                <h2>BATCH CONTROLS</h2>
                <Zap size={18} style={{ color: 'var(--cyan)' }} />
              </div>
              <div className="control-body">
                <div className="control-block">
                  <label className="section-label" htmlFor="batch-preset">Apply preset to all</label>
                  <select
                    id="batch-preset"
                    className="rail-select"
                    value={batchPreset}
                    data-testid="select-batch-preset"
                    onChange={(e) => setBatchPreset(e.target.value as Preset)}
                  >
                    {PRESETS.map((p) => (
                      <option value={p.name} key={p.name}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                  <p>{PRESETS.find((p) => p.name === batchPreset)?.detail}</p>
                </div>

                <div className="control-block">
                  <button
                    className="button primary full-button"
                    type="button"
                    disabled={!documents.length || !!activeAction}
                    data-testid="button-enhance-all"
                    onClick={() => void enhanceAll()}
                  >
                    {activeAction === 'all'
                      ? <LoaderCircle size={15} className="spin" />
                      : <Sparkles size={15} />}
                    Enhance all files
                  </button>
                  <button
                    className="button secondary full-button"
                    type="button"
                    disabled={!completedCount || !!activeAction}
                    data-testid="button-download-all"
                    onClick={() => void downloadAll()}
                  >
                    {activeAction === 'zip'
                      ? <LoaderCircle size={15} className="spin" />
                      : <Archive size={15} />}
                    Download ZIP
                  </button>
                </div>

                <div className="control-block">
                  <div className="stat-line">
                    <span>In queue</span>
                    <strong data-testid="text-stat-queue">{documents.length}</strong>
                  </div>
                  <div className="stat-line">
                    <span>Completed</span>
                    <strong data-testid="text-stat-completed">{completedCount}</strong>
                  </div>
                  <div className="stat-line">
                    <span>Working</span>
                    <strong data-testid="text-stat-processing">{processingCount}</strong>
                  </div>
                  <div className="stat-line">
                    <span>Waiting</span>
                    <strong data-testid="text-stat-waiting">{waitingCount}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy Panel */}
            <section className="privacy-panel" data-testid="panel-privacy">
              <div className="privacy-icon">
                <ShieldCheck size={14} />
                Local privacy
              </div>
              <h3>NO CLOUD.<br />NO COPIES.</h3>
              <p>
                Images are processed by your browser's Canvas API. The queue lives only in your
                browser's local storage. Nothing is uploaded or shared — ever.
              </p>
            </section>

            {/* Originals Locked */}
            <section className="panel">
              <div className="control-body">
                <div className="stamp">🔒 ORIGINALS LOCKED</div>
                <div className="control-block">
                  <p>
                    DocBright only writes enhanced JPGs — originals are never touched.
                    Rotate and re-enhance as often as needed.
                  </p>
                </div>
                <button
                  className="button danger full-button"
                  type="button"
                  disabled={!documents.length}
                  data-testid="button-clear-all"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 size={15} />
                  Clear all queue
                </button>
              </div>
            </section>
          </aside>
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <span className="footer-brand">DOCBRIGHT DESKTOP</span>
          <span>Canvas Enhancement Engine · JPG Output · Private by Default</span>
          <span>v2.0 · {new Date().getFullYear()}</span>
        </footer>
      </main>

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmClear(false); }}
        >
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-title">
            <h2 id="clear-title">CLEAR THE QUEUE?</h2>
            <p>
              This removes all uploaded originals, enhanced previews, and the saved local queue.
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                type="button"
                data-testid="button-cancel-clear"
                onClick={() => setConfirmClear(false)}
              >
                Keep files
              </button>
              <button
                className="button danger"
                type="button"
                data-testid="button-confirm-clear"
                onClick={clearAll}
              >
                <X size={15} />
                Clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
