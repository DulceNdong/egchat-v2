import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Camera, Share2, LogOut, Edit2, X, Check } from 'lucide-react';

interface SettingsViewProps {
  userProfile: any;
  onLogout: () => void;
  onUpdateProfile: (profile: any) => void;
  onClose?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onLogout,
  onUpdateProfile,
  onClose
}) => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editedName, setEditedName] = useState(userProfile?.name || '');
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState<string>('');
  const [editingPhoto, setEditingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState(userProfile?.avatar_url || '');

  // Generar QR personal
  const generatePersonalQR = async () => {
    try {
      const qrData = {
        type: 'contact',
        app: 'EGCHAT',
        user: {
          id: userProfile.id,
          phone: userProfile.phone,
          name: userProfile.name,
          avatar: profilePhoto
        }
      };

      const qrImage = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: { dark: '#0d0d0d', light: '#ffffff' }
      });

      setQrImage(qrImage);
      setShowQR(true);
    } catch (error) {
      console.error('Error generando QR:', error);
    }
  };

  // Manejar cambio de foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoData = event.target?.result as string;
        setProfilePhoto(photoData);
        onUpdateProfile({ ...userProfile, avatar_url: photoData });
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar cambios de perfil
  const handleSaveProfile = () => {
    onUpdateProfile({
      ...userProfile,
      name: editedName,
      avatar_url: profilePhoto
    });
    setShowEditProfile(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,rgba(0,200,160,0.12) 0%,rgba(0,180,230,0.08) 50%,rgba(180,255,0,0.06) 100%)',
      padding: '20px',
      maxWidth: '420px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#111827' }}>
          Ajustes
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              color: '#6B7280'
            }}
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Perfil */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {/* Foto de Perfil */}
          <div style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#F3F4F6',
            border: '3px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Perfil" style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }} />
            ) : (
              <div style={{
                fontSize: '40px',
                fontWeight: '800',
                color: '#22c55e'
              }}>
                {userProfile?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              background: '#22c55e',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Camera size={18} />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />

          {/* Nombre y Teléfono */}
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: '0 0 8px',
            color: '#111827'
          }}>
            {userProfile?.name}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: '0 0 16px'
          }}>
            {userProfile?.phone}
          </p>

          {/* Botones de Acciones Rápidas */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexDirection: 'column'
          }}>
            <button
              onClick={() => setShowEditProfile(!showEditProfile)}
              style={{
                padding: '10px 16px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Edit2 size={16} />
              Editar Perfil
            </button>

            <button
              onClick={generatePersonalQR}
              style={{
                padding: '10px 16px',
                background: '#00B4E6',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Share2 size={16} />
              Compartir QR
            </button>
          </div>
        </div>
      </div>

      {/* Editar Perfil Modal */}
      {showEditProfile && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            margin: '0 0 12px',
            color: '#111827'
          }}>
            Editar Información
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6B7280',
              display: 'block',
              marginBottom: '4px'
            }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveProfile}
              style={{
                flex: 1,
                padding: '10px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              Guardar
            </button>
            <button
              onClick={() => setShowEditProfile(false)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && qrImage && (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '700',
            margin: '0 0 12px',
            color: '#111827'
          }}>
            Tu QR Personal
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#6B7280',
            margin: '0 0 16px'
          }}>
            Comparte este código para que otros te agreguen como contacto
          </p>

          <img
            src={qrImage}
            alt="QR Personal"
            style={{
              width: '180px',
              height: '180px',
              margin: '0 auto 16px',
              display: 'block',
              border: '2px solid #F3F4F6',
              borderRadius: '12px',
              padding: '8px'
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = qrImage;
                link.download = `egchat-qr-${userProfile?.phone}.png`;
                link.click();
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Descargar QR
            </button>
            <button
              onClick={() => setShowQR(false)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Más Opciones */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '700',
          margin: '0 0 12px',
          color: '#111827',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Más Opciones
        </h3>

        <button
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            marginBottom: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          ✔️ Privacidad y Seguridad
        </button>

        <button
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            marginBottom: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          🔔 Notificaciones
        </button>

        <button
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          ℹ️ Acerca de EGCHAT
        </button>

        <div style={{ borderTop: '1px solid #F0F2F5', marginTop: '12px', paddingTop: '12px' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <p style={{
        fontSize: '12px',
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        EGCHAT v2.5.1
      </p>
    </div>
  );
};