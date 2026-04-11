import React, { useState, useEffect } from 'react';
import QRGenerator from './QRGenerator';
import CountrySelector from './CountrySelector';
import { useTranslation } from './translations';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  language: string;
}

interface Props {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onComplete }) => {
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'ES',
    name: 'España',
    flag: 'es',
    dialCode: '+34',
    language: 'es'
  });
  const [currentLanguage, setCurrentLanguage] = useState('es');
  
  const { t, direction } = useTranslation(currentLanguage);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Detectar idioma del navegador
    const browserLang = navigator.language.split('-')[0];
    const supportedLanguages = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'zh'];
    
    if (supportedLanguages.includes(browserLang)) {
      setCurrentLanguage(browserLang);
    }
    
    // Detectar país del usuario
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_code;
        const matchingCountry = {
          code: country,
          name: data.country_name,
          flag: country.toLowerCase(),
          dialCode: data.calling_code,
          language: browserLang || 'en'
        };
        setSelectedCountry(matchingCountry);
        setCurrentLanguage(matchingCountry.language);
      })
      .catch(() => {
        // Usar valores por defecto si falla la detección
      });
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setCurrentLanguage(country.language);
    
    // Guardar preferencias
    localStorage.setItem('egchat_country', JSON.stringify(country));
    localStorage.setItem('egchat_language', country.language);
  };

  const handleStart = () => {
    // Guardar que ya se mostró la bienvenida
    localStorage.setItem('egchat_welcome_shown', 'true');
    localStorage.setItem('egchat_startup', JSON.stringify({
      firstLaunch: new Date().toISOString(),
      version: '2.0.0',
      country: selectedCountry,
      language: currentLanguage,
      features: {
        profilePhotos: true,
        groupManagement: true,
        transfers: true,
        videoCalls: true,
        pwaOffline: true,
        qrRegistration: true,
        multiLanguage: true,
        countryDetection: true
      }
    }));
    
    onComplete();
  };

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(59, 130, 246, 0.95) 50%, rgba(139, 92, 246, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        direction: direction
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Logo EGCHAT Girando */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'spin 2s linear infinite',
            backdropFilter: 'blur(10px)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M17 8v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/>
              <circle cx="9" cy="13" r="2"/>
              <circle cx="15" cy="13" r="2"/>
            </svg>
          </div>
          
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              EGCHAT
            </h1>
            <p style={{
              fontSize: '16px',
              margin: 0,
              opacity: 0.9,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {t.welcome.subtitle}
            </p>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(59, 130, 246, 0.85) 50%, rgba(139, 92, 246, 0.85) 100%)',
      backdropFilter: 'blur(30px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      direction: direction
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRadius: '24px',
        padding: '32px 24px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center'
      }}>
        {/* Logo EGCHAT con animación sutil */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'pulse 3s ease-in-out infinite',
            backdropFilter: 'blur(10px)'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M17 8v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/>
              <circle cx="9" cy="13" r="2"/>
              <circle cx="15" cy="13" r="2"/>
            </svg>
          </div>
        </div>

        <div style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          color: 'white', 
          marginBottom: '12px',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          {t.welcome.title}
        </div>

        <div style={{ 
          fontSize: '14px', 
          color: 'rgba(255, 255, 255, 0.9)', 
          marginBottom: '20px',
          lineHeight: '1.5',
          textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {t.welcome.subtitle}
        </div>

        {/* Selector de País */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            {t.auth.country}
          </div>
          <CountrySelector
            onCountrySelect={handleCountrySelect}
            selectedCountry={selectedCountry}
          />
        </div>

        {/* Características con iconos estilo WhatsApp */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '16px', 
          padding: '16px', 
          marginBottom: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
            {t.welcome.features.title}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6' }}>
            {t.welcome.features.items.map((item: string, index: number) => (
              <div key={index} style={{ 
                marginBottom: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Funcional */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowQR(!showQR)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            {showQR ? t.welcome.buttons.hideQR : t.welcome.buttons.showQR}
          </button>

          {showQR && (
            <div style={{ marginTop: '16px' }}>
              <QRGenerator 
                showQR={showQR}
                onGenerated={(qrData) => {
                  console.log('QR funcional generado:', qrData);
                }}
              />
            </div>
          )}
        </div>

        {/* Botón Principal */}
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            background: 'rgba(16, 185, 129, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {t.welcome.buttons.start}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
          
          @media (max-width: 480px) {
            .welcome-container {
              padding: 20px 16px;
              margin: 20px;
            }
          }
        `
      }} />
    </div>
  );
};

export default WelcomeScreen;
