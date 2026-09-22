/**
 * Visor de documentos KYC — muestra imágenes con URL firmada temporal (5min).
 * SEGURIDAD:
 *  - No botón de descarga
 *  - CSS user-select: none + pointer-events: none
 *  - contextmenu deshabilitado
 *  - URL firmada expira en 5 min (obtenida del backend)
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kycAdminApi } from '@/api/endpoints';
import { ZoomIn, X } from 'lucide-react';

interface DocumentViewerProps {
  applicationId: string;
  docType:       'front' | 'back' | 'selfie';
  label:         string;
}

export function DocumentViewer({ applicationId, docType, label }: DocumentViewerProps) {
  const [zoomed, setZoomed] = useState(false);

  // Obtener URL firmada (refresca cada 4 min para no expirar)
  const { data, isLoading, error } = useQuery({
    queryKey: ['doc-url', applicationId, docType],
    queryFn:  () => kycAdminApi.getSignedDocUrl(applicationId, docType),
    staleTime: 4 * 60 * 1000,    // 4 min
    refetchInterval: 4 * 60 * 1000,
    enabled: !!applicationId,
    retry: 1,
  });

  // Prevenir descarga via drag, contextmenu y Print Screen awareness
  const preventSave = useCallback((e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
    return false;
  }, []);

  useEffect(() => {
    if (!zoomed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [zoomed]);

  const url = data?.url;

  return (
    <>
      {/* Miniatura */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div
          className="relative h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group cursor-pointer"
          onClick={() => url && setZoomed(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && url && setZoomed(true)}
          aria-label={`Ver ${label} en pantalla completa`}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full text-center p-2">
              <p className="text-xs text-gray-400">No disponible</p>
            </div>
          )}

          {url && (
            <>
              {/* Imagen con protección */}
              <img
                src={url}
                alt={label}
                className="doc-image w-full h-full object-cover"
                onContextMenu={preventSave}
                onDragStart={preventSave}
                draggable={false}
              />
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de zoom */}
      {zoomed && url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada: ${label}`}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setZoomed(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white"
              aria-label="Cerrar vista ampliada"
              autoFocus
            >
              <X className="w-6 h-6" />
            </button>

            {/* Imagen ampliada — mismas protecciones */}
            <img
              src={url}
              alt={label}
              className="doc-image w-full rounded-lg shadow-2xl max-h-[80vh] object-contain"
              onContextMenu={preventSave}
              onDragStart={preventSave}
              draggable={false}
            />

            <p className="text-center text-white/50 text-xs mt-3">
              🔒 Documento confidencial — visualización temporal · No disponible para descarga
            </p>
          </div>
        </div>
      )}
    </>
  );
}
