/**
 * ServicesView.tsx
 * Vista de servicios extraída de App.tsx.
 * ~87 líneas menos en App.tsx.
 */

import React from 'react';

interface ServicesViewProps {
  viewPadding:             { top: string; bottom: string };
  device:                  { isMobile: boolean; isTablet: boolean; isDesktop: boolean };
  renderIcon:              (icon: string, size: number) => React.ReactNode;
  setCurrentView:          (v: string) => void;
  setShowRechargeModal:    (v: boolean) => void;
  setShowInternetModal:    (v: boolean) => void;
  setShowCanalesModal:     (v: boolean) => void;
  setCanalesScreen:        (v: string) => void;
  setShowBancosModal:      (v: boolean) => void;
  setShowSegurosModal:     (v: boolean) => void;
  setShowFacturasModal:    (v: boolean) => void;
  setShowSaludModal:       (v: boolean) => void;
  setShowSuperModal:       (v: boolean) => void;
  setShowActividadModal:   (v: boolean) => void;
  setShowFinModal:         (v: string) => void;
  setFinStep:              (v: string) => void;
  setFinData:              (v: object) => void;
  setBancosInitScreen:     (v: string) => void;
  setShowSvcModal:         (v: string) => void;
  setSvcStep:              (v: string) => void;
  setSvcData:              (v: object) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = React.memo(({
  viewPadding, device, renderIcon,
  setCurrentView,
  setShowRechargeModal, setShowInternetModal, setShowCanalesModal, setCanalesScreen,
  setShowBancosModal, setShowSegurosModal, setShowFacturasModal,
  setShowSaludModal, setShowSuperModal, setShowActividadModal,
  setShowFinModal, setFinStep, setFinData,
  setBancosInitScreen, setShowSvcModal, setSvcStep, setSvcData,
}) => {

  const Btn = ({ label, icon, color, onClick }: { label: string; icon: string; color: string; onClick: () => void }) => (
    <button onClick={onClick} className="svc-btn"
      style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px 4px 8px', transition: 'transform 0.15s ease', WebkitTapHighlightColor: 'transparent' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#fff', border: `1.5px solid ${color}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {renderIcon(icon, 26)}
      </div>
      <span style={{ fontSize: '11px', color: '#374151', fontWeight: '500', textAlign: 'center', lineHeight: 1.3, maxWidth: '58px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </button>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#FFFFFF', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 4px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#9CA3AF' }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: device.isDesktop ? 'repeat(6,1fr)' : device.isTablet ? 'repeat(5,1fr)' : 'repeat(4,1fr)', padding: '4px 8px 8px' }}>
        {children}
      </div>
      <div style={{ height: '8px', background: '#F7F8FA' }} />
    </div>
  );

  return (
    <div style={{ paddingTop: viewPadding.top, height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F8FA' }}>
      <div className="scroll-container" style={{ flex: 1, overflowY: 'scroll', paddingBottom: device.isMobile ? 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)' : '24px' }}>

        <Section title="Básicos">
          <Btn label="Recarga..." icon="recharge"  color="#07C160" onClick={() => setShowRechargeModal(true)} />
          <Btn label="Internet"  icon="world"      color="#1485EE" onClick={() => setShowInternetModal(true)} />
          <Btn label="Canales"   icon="services"   color="#8B5CF6" onClick={() => { setCanalesScreen('home'); setShowCanalesModal(true); }} />
        </Section>

        <Section title="Servicios Financieros">
          <Btn label="Bancos"    icon="banking"    color="#1485EE" onClick={() => setShowBancosModal(true)} />
          <Btn label="Seguros"   icon="seguros"    color="#2E9E6B" onClick={() => setShowSegurosModal(true)} />
          <Btn label="Facturas"  icon="factura"    color="#C47D2A" onClick={() => setShowFacturasModal(true)} />
          <Btn label="Inversión" icon="invest"     color="#6B5BD6" onClick={() => { setShowFinModal('invest'); setFinStep('main'); setFinData({}); }} />
          <Btn label="Tarjetas"  icon="tarjeta"    color="#C0392B" onClick={() => { setBancosInitScreen('cards'); setShowBancosModal(true); }} />
          <Btn label="Historial" icon="historial"  color="#5A7090" onClick={() => setCurrentView('historial-completo')} />
        </Section>

        <Section title="Servicios Públicos">
          <Btn label="Electrici..." icon="electricidad" color="#C47D2A" onClick={() => { setShowSvcModal('elec');      setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Agua"         icon="rain"          color="#1485EE" onClick={() => { setShowSvcModal('agua');      setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Salud"        icon="salud"         color="#C0392B" onClick={() => setShowSaludModal(true)} />
          <Btn label="Educación"    icon="edu"           color="#6B5BD6" onClick={() => { setShowSvcModal('edu');       setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Correos"      icon="mensajes"      color="#C47D2A" onClick={() => { setShowSvcModal('correos');   setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Impuest..."   icon="gobierno"      color="#C0392B" onClick={() => { setShowSvcModal('impuestos'); setSvcStep('main'); setSvcData({}); }} />
        </Section>

        <Section title="Servicios Diarios">
          <Btn label="Supermercado" icon="comercio"    color="#2E9E6B" onClick={() => setShowSuperModal(true)} />
          <Btn label="Comida"       icon="money"       color="#C0392B" onClick={() => { setShowSvcModal('comida');      setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Restaurante"  icon="restaurante" color="#C47D2A" onClick={() => { setShowSvcModal('restaurante'); setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Hotel"        icon="hotel"       color="#1485EE" onClick={() => { setShowSvcModal('hotel');       setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Vuelos"       icon="vuelos"      color="#6B5BD6" onClick={() => { setShowSvcModal('vuelos');      setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Gasolinera"   icon="gasolinera"  color="#C47D2A" onClick={() => { setShowSvcModal('gasolinera'); setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Tienda"       icon="tienda"      color="#2E9E6B" onClick={() => { setShowSvcModal('tienda');      setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Lavandería"   icon="lavanderia"  color="#1485EE" onClick={() => { setShowSvcModal('lavanderia'); setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Belleza"      icon="belleza"     color="#C0392B" onClick={() => { setShowSvcModal('belleza');     setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Noticias"     icon="noticias"    color="#6B5BD6" onClick={() => { setShowSvcModal('noticias');    setSvcStep('main'); setSvcData({}); }} />
        </Section>

        <Section title="Herramientas">
          <Btn label="ID Digital"  icon="id-card"    color="#6B5BD6" onClick={() => { setShowSvcModal('id');         setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Lia-25"      icon="ai"         color="#1485EE" onClick={() => setCurrentView('Lia-25')} />
          <Btn label="Actividad"   icon="historial"  color="#0E7FA8" onClick={() => setShowActividadModal(true)} />
          <Btn label="Emergencia"  icon="emergencia" color="#C0392B" onClick={() => { setShowSvcModal('emergencia'); setSvcStep('main'); setSvcData({}); }} />
          <Btn label="Ajustes"     icon="ajustes"    color="#5A7090" onClick={() => setCurrentView('ajustes')} />
        </Section>

      </div>
    </div>
  );
});

ServicesView.displayName = 'ServicesView';
