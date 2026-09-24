/**
 * Visor de documentos KYC — visualización segura con URL firmada temporal (5 min).
 * SEGURIDAD: sin descarga, sin drag, sin contextmenu, imagen no seleccionable.
 */
import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ZoomIn, X, Upload, Loader2 } from 'lucide-react';
import { kycAdminApi } from '@/api/endpoints';
import toast from 'react-hot-toast';

interface DocumentViewerProps {
  applicationId: string;
  docType:       'front' | 'back' | 'selfie';
  label:         string;
  allowUpload?:  boolean;
}

export function DocumentViewer({
  applicationId,
  docType,
  label,
  allowUpload = false,
}: DocumentViewerProps) {
  const [zoomed,    setZoomed]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // URL firmada — se refresca cada 4 min antes de que expire (5 min)
  const { data, isLoading, error } = useQuery({
    queryKey: ['doc-url', applicationId, docType],
    queryFn:  () => kycAdminApi.getSignedDocUrl(applicationId, docType),
    staleTime:       4 * 60 * 1000,
    refetchInterval: 4 * 60 * 1000,
    enabled: !!applicationId,
    retry: 1,
  });

  const preventSave = useCallback((e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setZoomed(false);
      document.removeEventListener('keydown', handleEsc);
    }
  }, []);

  const openZoom = useCallback(() => {
    if (!data?.url) return;
    setZoomed(true);
    document.addEventListener('keydown', handleEsc);
  }, [data?.url, handleEsc]);

  const closeZoom = useCallback(() => {
    setZoomed(false);
    document.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);

  // Upload manual (solo si allowUpload=true)
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Solo se permiten imágenes o PDF');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('El archivo supera 20 MB');
      return;
    }
    setUploading(true);
    try {
      await kycAdminApi.uploadDocAdmin(applicationId, docType, file);
      toast.success(`${label} subido correctamente`);
      qc.invalidateQueries({ queryKey: ['doc-url', applicationId, docType] });
      qc.invalidateQueries({ queryKey: ['kyc', 'detail', applicationId] });
    } catch {
      toast.error(`Error al subir ${label}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const url = data?.url;

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>

        {/* Miniatura */}
        <div
          className={`relative h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${url ? 'group cursor-pointer' : ''}`}
          onClick={openZoom}
          role={url ? 'button' : undefined}
          tabIndex={url ? 0 : undefined}
          onKeyDown={e => e.key === 'Enter' && openZoom()}
          aria-label={url ? `Ver ${label} en pantalla completa` : undefined}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && (error || !url) && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-gray-400">No disponible</p>
            </div>
          )}

          {url && (
            <>
              <img
                src={url}
                alt={label}
                className="doc-image w-full h-full object-cover"
                onContextMenu={preventSave}
                onDragStart={preventSave}
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </div>
            </>
          )}
        </div>

        {/* Botón subir (opcional) */}
        {allowUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              aria-label={`Subir ${label}`}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`flex items-center justify-center gap-1.5 w-full px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                url
                  ? 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-400 hover:text-brand-600'
                  : 'border-dashed border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100'
              }`}
            >
              {uploading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Subiendo…</>
                : <><Upload className="w-3 h-3" /> {url ? 'Reemplazar' : 'Subir imagen'}</>
              }
            </button>
          </>
        )}
      </div>

      {/* Modal zoom */}
      {zoomed && url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={closeZoom}
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada: ${label}`}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeZoom}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
              aria-label="Cerrar vista ampliada"
              autoFocus
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={url}
              alt={label}
              className="doc-image w-full max-h-[80vh] object-contain rounded-lg select-none"
              onContextMenu={preventSave}
              onDragStart={preventSave}
              draggable={false}
            />
            <p className="text-center text-white/40 text-xs mt-3">
              🔒 Documento confidencial — solo visualización
            </p>
          </div>
        </div>
      )}
    </>
  );
}
