// PIN de las operaciones que mueven saldo (comercios, servicios, seguros, taxi,
// djangue y CEMAC). El servidor comprueba el PIN con bcrypt y responde
// PIN_REQUIRED / PIN_INVALID, así que aquí solo se recoge, se ejecuta la
// operación y, si el PIN no era válido, se vuelve a pedir sin cerrar el modal.
// Vive en la raíz para no anidar modales dentro de otros modales, que en iOS
// el segundo se queda sin mostrar.
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { authAPI } from '../api';
import { PinInputModal } from '../components/ui/PinInputModal';
import { SetupPinModal } from '../components/ui/SetupPinModal';
import { t as tr } from '../translations';

interface PaymentPinValue {
  /**
   * Pide el PIN y ejecuta la operación con él. Devuelve null si el usuario
   * cancela. Si el PIN no es válido se vuelve a pedir con el aviso en pantalla.
   */
  runWithPin: <T>(exec: (pin: string) => Promise<T>, subtitle?: string) => Promise<T | null>;
}

const PaymentPinContext = createContext<PaymentPinValue | null>(null);

export const usePaymentPin = (): PaymentPinValue => {
  const ctx = useContext(PaymentPinContext);
  if (!ctx) throw new Error('usePaymentPin debe usarse dentro de PaymentPinProvider');
  return ctx;
};

interface Pending {
  exec: (pin: string) => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export const PaymentPinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  // Cambia la clave del modal para vaciar los dígitos tras un PIN rechazado.
  const [attempt, setAttempt] = useState(0);
  const pendingRef = useRef<Pending | null>(null);

  const finish = (value: any, error?: any) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setVisible(false);
    setSetupVisible(false);
    setLoading(false);
    setPinError(undefined);
    if (!pending) return;
    if (error) pending.reject(error);
    else pending.resolve(value);
  };

  const runWithPin = useCallback(
    <T,>(exec: (pin: string) => Promise<T>, sub?: string): Promise<T | null> => {
      // Una sola operación a la vez: si llega otra, la anterior se cancela.
      pendingRef.current?.resolve(null);
      return new Promise<T | null>((resolve, reject) => {
        pendingRef.current = { exec, resolve, reject };
        setSubtitle(sub);
        setPinError(undefined);
        setLoading(false);
        setAttempt(a => a + 1);
        // La fuente de verdad es el servidor. Si la consulta falla se pide el
        // PIN igual: con un PIN guardado la operación fallaría sin él.
        authAPI
          .hasPinConfigured()
          .then(r => {
            if (r?.hasPin) setVisible(true);
            else setSetupVisible(true);
          })
          .catch(() => setVisible(true));
      });
    },
    [],
  );

  const submit = async (pin: string) => {
    const pending = pendingRef.current;
    if (!pending) return;
    setLoading(true);
    setPinError(undefined);
    try {
      const result = await pending.exec(pin);
      finish(result);
    } catch (e: any) {
      const msg = String(e?.message || '');
      const pinFailure = e?.status === 403 && /pin/i.test(msg);
      if (pinFailure && !setupVisible && /incorrect/i.test(msg)) {
        // PIN equivocado: el modal sigue abierto, avisa y deja reescribirlo.
        setLoading(false);
        setPinError(msg);
        setAttempt(a => a + 1);
        return;
      }
      if (pinFailure && !setupVisible) {
        // El servidor no tiene PIN aunque la consulta dijera que sí: crearlo.
        setLoading(false);
        setVisible(false);
        setSetupVisible(true);
        setAttempt(a => a + 1);
        return;
      }
      finish(null, e);
    }
  };

  return (
    <PaymentPinContext.Provider value={{ runWithPin }}>
      {children}
      <PinInputModal
        key={`pin-${attempt}`}
        visible={visible}
        // Con la operación ya enviada no se puede cerrar: el cobro sigue en el
        // servidor y el usuario creería que no se hizo.
        onClose={() => { if (!loading) finish(null); }}
        onSuccess={submit}
        subtitle={subtitle}
        loading={loading}
        error={pinError}
      />
      <SetupPinModal
        visible={setupVisible}
        onClose={() => { if (!loading) finish(null); }}
        onSuccess={pin => submit(pin ?? '')}
        title={tr('xtConfigurarPINDePagos')}
      />
    </PaymentPinContext.Provider>
  );
};
