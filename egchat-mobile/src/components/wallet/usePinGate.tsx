import React, { useCallback, useState } from 'react';
import { authAPI } from '../../api';
import { PinInputModal } from '../ui/PinInputModal';
import { SetupPINModal } from './SetupPINModal';
import { t as tr } from '../../translations';

type PinAction = (pin: string) => Promise<void>;

/**
 * Una sola puerta de PIN para toda operación con dinero: si el usuario aún no
 * tiene PIN, se crea primero; si ya lo tiene, se pide antes de ejecutar.
 */
export function usePinGate(onBusinessError?: (message: string) => void) {
  const [action, setAction] = useState<PinAction | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [hasPin, setHasPin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = useCallback(async (fn: PinAction) => {
    setAction(() => fn);
    setError('');
    setLoading(false);
    let configured = true;
    try {
      const res = await authAPI.hasPinConfigured();
      configured = res?.hasPin !== false;
    } catch {
      // Sin respuesta no se puede afirmar que no haya PIN: se pide el PIN.
      configured = true;
    }
    setHasPin(configured);
    if (configured) setShowPin(true);
    else setShowSetup(true);
  }, []);

  const submit = useCallback(async (pin: string) => {
    if (!action) return;
    setLoading(true);
    setError('');
    try {
      await action(pin);
      setShowPin(false);
    } catch (e: any) {
      if (e?.status === 403) {
        setError(e?.message || tr('chtPinIncorrect'));
      } else {
        setShowPin(false);
        onBusinessError?.(e?.message || tr('xtErrorAlProcesarPago'));
      }
    } finally {
      setLoading(false);
    }
  }, [action, onBusinessError]);

  const close = useCallback(() => {
    setShowPin(false);
    setAction(null);
  }, []);

  const elements = (
    <>
      <PinInputModal
        visible={showPin}
        onClose={close}
        onSuccess={submit}
        loading={loading}
        error={error}
      />
      <SetupPINModal
        visible={showSetup}
        hasPin={false}
        onCancel={() => setShowSetup(false)}
        onDone={() => {
          setShowSetup(false);
          setHasPin(true);
          setShowPin(true);
        }}
      />
    </>
  );

  return { request, elements, hasPin, close };
}
