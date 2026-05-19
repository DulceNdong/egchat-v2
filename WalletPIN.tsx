import React from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
const PIN_KEY = 'egchat_wallet_pin';
const PIN_SET_KEY = 'egchat_wallet_pin_set';

export const walletPIN = {
  isSet: () => localStorage.getItem(PIN_SET_KEY) === '1',
  verify: (pin: string) => localStorage.getItem(PIN_KEY) === pin,
  save: (pin: string) => { localStorage.setItem(PIN_KEY, pin); localStorage.setItem(PIN_SET_KEY, '1'); },
  clear: () => { localStorage.removeItem(PIN_KEY); localStorage.removeItem(PIN_SET_KEY); },
};

// ── Teclado numérico ────────────────────────────────────────────────────────
const PinDots: React.FC<{ value: string; length?: number }> = ({ value, length = 6 }) => (
  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '24px 0 8px' }}>
    {Array.from({ length }).map((_, i) => (
      <div key={i} style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: i < value.length ? '#1a73e8' : 'transparent',
        border: `2px solid ${i < value.length ? '#1a73e8' : '#d1d5db'}`,
        transition: 'all 0.15s',
      }} />
    ))}
  </div>
);

const NumPad: React.FC<{ onPress: (k: string) => void }> = ({ onPress }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '0 16px' }}>
      {keys.map((k, i) => (
        <button key={i} onClick={() => k && onPress(k)}
          style={{
            height: '60px', borderRadius: '14px',
            background: k === '⌫' ? '#fee2e2' : k === '' ? 'transparent' : '#f3f4f6',
            border: 'none', cursor: k ? 'pointer' : 'default',
            fontSize: k === '⌫' ? '20px' : '22px',
            fontWeight: '700', color: k === '⌫' ? '#ef4444' : '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s',
          }}>
          {k}
        </button>
      ))}
    </div>
  );
};

// ── Modal de configuración de PIN (primera vez) ─────────────────────────────
interface SetupPINProps {
  onDone: () => void;
  onCancel: () => void;
}

export const SetupPINModal: React.FC<SetupPINProps> = ({ onDone, onCancel }) => {
  const [step, setStep] = React.useState<'create' | 'confirm'>('create');
  const [pin1, setPin1] = React.useState('');
  const [pin2, setPin2] = React.useState('');
  const [error, setError] = React.useState('');
  const PIN_LEN = 6;

  const handlePress = (k: string) => {
    setError('');
    if (step === 'create') {
      if (k === '⌫') { setPin1(p => p.slice(0, -1)); return; }
      if (pin1.length >= PIN_LEN) return;
      const next = pin1 + k;
      setPin1(next);
      if (next.length === PIN_LEN) setTimeout(() => setStep('confirm'), 200);
    } else {
      if (k === '⌫') { setPin2(p => p.slice(0, -1)); return; }
      if (pin2.length >= PIN_LEN) return;
      const next = pin2 + k;
      setPin2(next);
      if (next.length === PIN_LEN) {
        setTimeout(() => {
          if (next === pin1) { walletPIN.save(pin1); onDone(); }
          else { setError('Los PINs no coinciden. Inténtalo de nuevo.'); setPin1(''); setPin2(''); setStep('create'); }
        }, 200);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 5000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '420px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
        </div>
        {/* Header */}
        <div style={{ padding: '8px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              {step === 'create' ? 'Crear PIN de pago' : 'Confirmar PIN'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
              {step === 'create' ? 'Elige un PIN de 4 dígitos para proteger tus pagos' : 'Introduce el PIN de nuevo para confirmar'}
            </div>
          </div>
          <button onClick={onCancel} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '16px' }}>✕</button>
        </div>
        {/* Icono */}
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        </div>
        {/* Dots */}
        <PinDots value={step === 'create' ? pin1 : pin2} />
        {/* Error */}
        {error && <div style={{ textAlign: 'center', fontSize: '13px', color: '#ef4444', fontWeight: '600', marginBottom: '8px', padding: '0 20px' }}>{error}</div>}
        {/* Numpad */}
        <NumPad onPress={handlePress} />
      </div>
    </div>
  );
};

// ── Modal de verificación de PIN (antes de pagar) ───────────────────────────
interface VerifyPINProps {
  amount: number;
  recipient: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VerifyPINModal: React.FC<VerifyPINProps> = ({ amount, recipient, onSuccess, onCancel }) => {
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [attempts, setAttempts] = React.useState(0);
  const PIN_LEN = 6;

  const handlePress = (k: string) => {
    setError('');
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= PIN_LEN) return;
    const next = pin + k;
    setPin(next);
    if (next.length === PIN_LEN) {
      setTimeout(() => {
        if (walletPIN.verify(next)) {
          onSuccess();
        } else {
          const att = attempts + 1;
          setAttempts(att);
          setError(att >= 3 ? 'Demasiados intentos fallidos. Inténtalo más tarde.' : 'PIN incorrecto. Inténtalo de nuevo.');
          setPin('');
        }
      }, 200);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 5100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '420px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: '#e5e7eb' }} />
        </div>
        {/* Header */}
        <div style={{ padding: '8px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>Confirmar pago</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Introduce tu PIN para autorizar</div>
          </div>
          <button onClick={onCancel} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '16px' }}>✕</button>
        </div>
        {/* Resumen del pago */}
        <div style={{ margin: '12px 20px 0', background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enviando a</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>{recipient}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{amount.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600' }}>XAF</span></div>
          </div>
        </div>
        {/* Dots */}
        <PinDots value={pin} />
        {/* Error */}
        {error && <div style={{ textAlign: 'center', fontSize: '13px', color: '#ef4444', fontWeight: '600', marginBottom: '8px', padding: '0 20px' }}>{error}</div>}
        {/* Numpad */}
        <NumPad onPress={handlePress} />
        {/* Cancelar */}
        <button onClick={onCancel} style={{ width: '100%', background: 'none', border: 'none', color: '#9ca3af', fontSize: '14px', cursor: 'pointer', padding: '12px', marginTop: '4px' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};
