import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, QrCode, Search } from 'lucide-react';

interface AddContactModalProps {
  onClose: () => void;
  onAddContact: (phone: string, name?: string) => void;
  existingContacts?: any[];
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  onClose,
  onAddContact,
  existingContacts = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'number' | 'qr'>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Buscar usuarios por teléfono
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Mockup: Aquí iría la búsqueda real del backend
    // Por ahora simula búsqueda local
    if (query.trim().length > 0) {
      const filtered = [
        { phone: '+240123456789', name: 'Juan Pérez' },
        { phone: '+240987654321', name: 'María García' },
        { phone: '+240555555555', name: 'Carlos López' }
      ].filter(
        (u) => u.phone.includes(query.replace(/\s/g, '')) ||
               u.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  // Agregar contacto por teléfono
  const handleAddByPhone = () => {
    if (phoneNumber.trim().length >= 9) {
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : '+240' + phoneNumber.replace(/\D/g, '').slice(-9);

      onAddContact(formattedPhone);
      onClose();
    }
  };

  // Iniciar cámara para QR
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  // Procesar QR capturado (mock)
  const captureQR = async () => {
    // Aquí iría la lógica real de lectura de QR con biblioteca como jsQR o html5-qrcode
    // Por ahora es un mockup
    console.log('QR capture - implementar con biblioteca QR');
    alert('Funcionalidad de escaneo QR - próximamente con integración real');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 5000
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#fff',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        padding: '16px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: 0,
            color: '#111827'
          }}>
            Agregar Contacto
          </h2>
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
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <button
            onClick={() => selectedTab !== 'number' && (setSelectedTab('number'), setCameraActive(false))}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: selectedTab === 'number' ? '#22c55e' : 'transparent',
              color: selectedTab === 'number' ? '#fff' : '#6B7280',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Phone size={16} />
            Por Teléfono
          </button>

          <button
            onClick={() => selectedTab !== 'qr' && setSelectedTab('qr')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: selectedTab === 'qr' ? '#22c55e' : 'transparent',
              color: selectedTab === 'qr' ? '#fff' : '#6B7280',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <QrCode size={16} />
            Escanear QR
          </button>
        </div>

        {/* Por Teléfono */}
        {selectedTab === 'number' && (
          <div>
            {/* Buscar */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                display: 'block',
                marginBottom: '6px'
              }}>
                Número de teléfono o nombre
              </label>
              <div style={{
                position: 'relative',
                display: 'flex'
              }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9CA3AF'
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Ej: +240123456789 o Juan"
                  style={{
                    width: '100%',
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    padding: '10px 12px 10px 36px',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div style={{
                background: '#F9FAFB',
                borderRadius: '10px',
                marginBottom: '16px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {searchResults.map((user, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onAddContact(user.phone, user.name);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: idx < searchResults.length - 1 ? '0 0 1px 0 solid #E5E7EB' : 'none',
                      borderBottom: idx < searchResults.length - 1 ? '1px solid #E5E7EB' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '2px'
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      {user.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Entrada manual */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                display: 'block',
                marginBottom: '6px'
              }}>
                O escribe el teléfono directamente
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+240 123 456 789"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Botón Agregar */}
            <button
              onClick={handleAddByPhone}
              disabled={phoneNumber.trim().length < 9}
              style={{
                width: '100%',
                padding: '12px',
                background: phoneNumber.trim().length >= 9 ? '#22c55e' : '#D1D5DB',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: phoneNumber.trim().length >= 9 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Agregar Contacto
            </button>
          </div>
        )}

        {/* Escanear QR */}
        {selectedTab === 'qr' && (
          <div>
            {!cameraActive ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  margin: '20px auto',
                  background: '#F3F4F6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={48} style={{ color: '#22c55e' }} />
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  margin: '0 0 16px',
                  lineHeight: '1.5'
                }}>
                  Escanea el código QR de un contacto para agregarlo instantáneamente
                </p>
                <button
                  onClick={startCamera}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#00B4E6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  Iniciar Cámara
                </button>
              </div>
            ) : (
              <div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    background: '#000'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <button
                    onClick={captureQR}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Capturar QR
                  </button>
                  <button
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#E5E7EB',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};