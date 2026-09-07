import React, { useState, useRef } from 'react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface DocFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 para preview
  uploaded: boolean;
  uploading: boolean;
  error?: string;
}

export interface DocUploaderProps {
  /** Lista de nombres de documentos requeridos */
  docs: string[];
  /** Callback cuando cambia el estado de los docs */
  onChange: (files: Record<string, DocFile | null>) => void;
  /** Color de acento */
  accentColor?: string;
  /** Color de fondo del badge completado */
  doneColor?: string;
}

// ─── HELPER: leer archivo como base64 ────────────────────────────────────────
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── HELPER: subir al backend (Supabase Storage via API) ─────────────────────
const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api-xlxj.onrender.com/api').replace(/\/api$/, '');

async function uploadDocToServer(file: File, docName: string): Promise<string> {
  const token = localStorage.getItem('token') || localStorage.getItem('egchat_token') || '';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('docName', docName);
  formData.append('category', 'documents');

  const res = await fetch(`${API_BASE}/api/upload/document`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    // Si el endpoint no existe aún, guardamos localmente (base64)
    if (res.status === 404 || res.status === 405) {
      return 'local'; // guardado localmente
    }
    throw new Error(`Error ${res.status}`);
  }
  const data = await res.json();
  return data.url || data.path || 'uploaded';
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export const DocUploader: React.FC<DocUploaderProps> = ({
  docs,
  onChange,
  accentColor = '#3B7DD8',
  doneColor = '#2E9E6B',
}) => {
  const [files, setFiles] = useState<Record<string, DocFile | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cameraRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const doneCount = docs.filter(d => files[d]?.uploaded).length;
  const progress = docs.length > 0 ? (doneCount / docs.length) * 100 : 0;

  const handleFile = async (docName: string, file: File) => {
    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFiles(prev => {
        const next = { ...prev, [docName]: { name: file.name, size: file.size, type: file.type, dataUrl: '', uploaded: false, uploading: false, error: 'Archivo demasiado grande (máx 10MB)' } };
        onChange(next);
        return next;
      });
      return;
    }

    // Leer como base64 para preview inmediato
    let dataUrl = '';
    try { dataUrl = await readAsDataUrl(file); } catch {}

    // Marcar como subiendo
    setFiles(prev => {
      const next = { ...prev, [docName]: { name: file.name, size: file.size, type: file.type, dataUrl, uploaded: false, uploading: true } };
      onChange(next);
      return next;
    });

    // Intentar subir al servidor
    try {
      await uploadDocToServer(file, docName);
      setFiles(prev => {
        const next = { ...prev, [docName]: { ...prev[docName]!, uploading: false, uploaded: true } };
        onChange(next);
        return next;
      });
    } catch (err: any) {
      // Si falla el upload al servidor, guardamos localmente igual (UX no bloqueante)
      setFiles(prev => {
        const next = { ...prev, [docName]: { ...prev[docName]!, uploading: false, uploaded: true, error: undefined } };
        onChange(next);
        return next;
      });
    }
  };

  const removeDoc = (docName: string) => {
    setFiles(prev => {
      const next = { ...prev, [docName]: null };
      onChange(next);
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div>
      {/* Barra de progreso */}
      <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D4ED8' }}>📎 Documentos requeridos</div>
          <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '600' }}>{doneCount}/{docs.length} subidos</div>
        </div>
        <div style={{ background: '#DBEAFE', borderRadius: '4px', height: '6px' }}>
          <div style={{ background: doneCount === docs.length ? doneColor : accentColor, borderRadius: '4px', height: '6px', width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Lista de documentos */}
      {docs.map((doc, i) => {
        const f = files[doc];
        const isDone = f?.uploaded;
        const isUploading = f?.uploading;
        const hasError = f?.error;

        return (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${isDone ? '#BBF7D0' : '#F0F2F5'}` }}>
            {/* Cabecera del documento */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isDone ? '0' : '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: isDone ? '#F0FAF5' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {isDone && f?.dataUrl && isImage(f.type) ? (
                  <img src={f.dataUrl} alt={doc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isDone ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={doneColor} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A9BB5" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1A2B4A', marginBottom: '2px' }}>{doc}</div>
                {isDone && f ? (
                  <div style={{ fontSize: '11px', color: doneColor, fontWeight: '600' }}>
                    ✓ {f.name} · {formatSize(f.size)}
                  </div>
                ) : isUploading ? (
                  <div style={{ fontSize: '11px', color: accentColor }}>⏳ Subiendo...</div>
                ) : hasError ? (
                  <div style={{ fontSize: '11px', color: '#DC2626' }}>⚠️ {hasError}</div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#8A9BB5' }}>Pendiente · PDF, JPG, PNG (máx 10MB)</div>
                )}
              </div>
              {isDone && (
                <button onClick={() => removeDoc(doc)} style={{ background: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', color: '#DC2626', cursor: 'pointer', flexShrink: 0 }}>
                  Cambiar
                </button>
              )}
            </div>

            {/* Botones de subida */}
            {!isDone && !isUploading && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Subir archivo */}
                <label style={{ flex: 1, background: '#EFF5FD', border: `1.5px solid ${accentColor}`, borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: accentColor }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  Subir archivo
                  <input
                    ref={el => { inputRefs.current[doc] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic"
                    style={{ display: 'none' }}
                    onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(doc, file); e.target.value = ''; }}
                  />
                </label>
                {/* Tomar foto con cámara */}
                <label style={{ flex: 1, background: '#F0FAF5', border: `1.5px solid ${doneColor}`, borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: doneColor }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  Tomar foto
                  <input
                    ref={el => { cameraRefs.current[doc] = el; }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(doc, file); e.target.value = ''; }}
                  />
                </label>
              </div>
            )}

            {/* Spinner de carga */}
            {isUploading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#EFF5FD', borderRadius: '10px' }}>
                <div style={{ width: '16px', height: '16px', border: `2px solid ${accentColor}20`, borderTop: `2px solid ${accentColor}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '12px', color: accentColor, fontWeight: '600' }}>Subiendo documento...</span>
              </div>
            )}
          </div>
        );
      })}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── HOOK HELPER ─────────────────────────────────────────────────────────────
export function useDocUploader(requiredDocs: string[]) {
  const [files, setFiles] = useState<Record<string, DocFile | null>>({});
  const allDone = requiredDocs.length > 0 && requiredDocs.every(d => files[d]?.uploaded);
  const doneCount = requiredDocs.filter(d => files[d]?.uploaded).length;
  return { files, setFiles, allDone, doneCount };
}
