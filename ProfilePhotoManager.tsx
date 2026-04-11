import React, { useState, useRef, useCallback } from 'react';
import { CameraModal } from './CameraModal';
import { PhotoEditorModal } from './PhotoEditorModal';
import { Avatar } from './Avatar';

interface Props {
  type: 'contact' | 'group';
  currentPhoto?: string;
  initials: string;
  name: string;
  onPhotoChange: (photoUrl: string) => void;
  onClose: () => void;
}

export const ProfilePhotoManager: React.FC<Props> = ({
  type,
  currentPhoto,
  initials,
  name,
  onPhotoChange,
  onClose
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [tempPhoto, setTempPhoto] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoTaken = useCallback((photoUrl: string) => {
    setTempPhoto(photoUrl);
    setShowCamera(false);
    setShowEditor(true);
  }, []);

  const handlePhotoSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        setTempPhoto(photoUrl);
        setShowEditor(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePhotoEdited = useCallback((editedPhotoUrl: string) => {
    setTempPhoto(editedPhotoUrl);
    onPhotoChange(editedPhotoUrl);
    setShowEditor(false);
  }, [onPhotoChange]);

  const handleRemovePhoto = useCallback(() => {
    onPhotoChange('');
    setTempPhoto('');
  }, [onPhotoChange]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 5000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #f0f2f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Foto de {type === 'contact' ? 'Contacto' : 'Grupo'}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#6b7280'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 6 6 18 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Vista Previa */}
        <div style={{
          padding: '30px',
          textAlign: 'center',
          background: '#f9fafb'
        }}>
          <div style={{ marginBottom: '20px' }}>
            {tempPhoto || currentPhoto ? (
              <img
                src={tempPhoto || currentPhoto}
                alt={name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #e5e7eb'
                }}
              />
            ) : (
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                border: '4px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: '#6b7280'
                }}>
                  {initials}
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            {name}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {tempPhoto || currentPhoto ? 'Foto actual' : 'Sin foto de perfil'}
          </div>
        </div>

        {/* Acciones */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #f0f2f5',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Tomar Foto */}
          <button
            onClick={() => setShowCamera(true)}
            style={{
              background: '#00b4e6',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Tomar foto
          </button>

          {/* Elegir de Galería */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '14px',
              color: '#374151',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            Elegir de galería
          </button>

          {/* Editar Foto (si existe) */}
          {(tempPhoto || currentPhoto) && (
            <button
              onClick={() => setShowEditor(true)}
              style={{
                background: '#10b981',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-5 9.5-9.5z"></path>
              </svg>
              Editar foto
            </button>
          )}

          {/* Eliminar Foto (si existe) */}
          {(tempPhoto || currentPhoto) && (
            <button
              onClick={handleRemovePhoto}
              style={{
                background: '#ef4444',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2"></path>
              </svg>
              Eliminar foto
            </button>
          )}

          {/* Cancelar */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '14px',
              color: '#6b7280',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        style={{ display: 'none' }}
      />

      {/* Modal de Cámara */}
      {showCamera && (
        <CameraModal
          chatId="profile"
          onClose={() => setShowCamera(false)}
          onPhotoTaken={handlePhotoTaken}
        />
      )}

      {/* Modal de Editor */}
      {showEditor && (
        <PhotoEditorModal
          photoUrl={tempPhoto || currentPhoto || ''}
          onClose={() => setShowEditor(false)}
          onPhotoSaved={handlePhotoEdited}
        />
      )}
    </div>
  );
};
