/**
 * Modal de acciones KYC — Aprobar / Rechazar / Solicitar info / Bloquear.
 * Accesible: focus trap, ESC para cerrar, aria-modal.
 */
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import {
  useKycApprove, useKycReject, useKycRequestInfo, useKycBlock,
} from '@/shared/hooks/useKycAdmin';

type ActionType = 'approve' | 'reject' | 'request-info' | 'block';

interface ActionModalProps {
  applicationId: string;
  action:        ActionType;
  fullName:      string | null;
  onClose:       () => void;
  onSuccess:     () => void;
}

const REJECT_REASONS = [
  'Documento ilegible o de baja calidad',
  'Documento vencido',
  'Los datos no coinciden con el documento',
  'Prueba de vida fallida (posible deepfake)',
  'Match en lista de sanciones',
  'Identidad duplicada (ya existe en el sistema)',
  'Documentación incompleta',
  'Otro motivo',
];

const INFO_ITEMS = [
  'new_selfie',
  'proof_of_address',
  'proof_of_income',
  'bank_statement',
  'updated_document',
  'pep_declaration',
];

export function ActionModal({ applicationId, action, fullName, onClose, onSuccess }: ActionModalProps) {
  const { t } = useTranslation();
  const overlayRef  = useRef<HTMLDivElement>(null);
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  const [reason,       setReason]       = useState('');
  const [customReason, setCustomReason] = useState('');
  const [message,      setMessage]      = useState('');
  const [infoItems,    setInfoItems]    = useState<string[]>([]);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [confirmed,    setConfirmed]    = useState(false);

  const approve     = useKycApprove();
  const reject      = useKycReject();
  const requestInfo = useKycRequestInfo();
  const block       = useKycBlock();

  const isLoading = approve.isPending || reject.isPending || requestInfo.isPending || block.isPending;

  // Focus trap
  useEffect(() => {
    firstBtnRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const finalReason = reason === 'Otro motivo' ? customReason : reason;

  async function handleSubmit() {
    try {
      if (action === 'approve') {
        await approve.mutateAsync({ id: applicationId });
      } else if (action === 'reject') {
        await reject.mutateAsync({ id: applicationId, reason: finalReason });
      } else if (action === 'request-info') {
        await requestInfo.mutateAsync({
          id: applicationId, message, info_requested: infoItems, deadline_days: deadlineDays,
        });
      } else if (action === 'block') {
        await block.mutateAsync({ id: applicationId, reason: finalReason });
      }
      onSuccess();
    } catch {}
  }

  const configs = {
    approve:       { title: t('action.approveTitle'),  color: 'green',  icon: '✅' },
    reject:        { title: t('action.rejectTitle'),   color: 'red',    icon: '❌' },
    'request-info':{ title: t('action.infoTitle'),     color: 'amber',  icon: '⚠️' },
    block:         { title: t('action.blockTitle'),    color: 'gray',   icon: '🚫' },
  };
  const cfg = configs[action];

  const isValid = (() => {
    if (action === 'approve') return true;
    if (action === 'reject' || action === 'block') {
      const r = reason === 'Otro motivo' ? customReason.trim() : reason;
      return r.length >= 5 && (action !== 'block' || confirmed);
    }
    if (action === 'request-info') return message.trim().length >= 10;
    return false;
  })();

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="card w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{cfg.icon}</span>
            <div>
              <h2 id="action-modal-title" className="font-semibold">{cfg.title}</h2>
              {fullName && <p className="text-sm text-gray-500">{fullName}</p>}
            </div>
          </div>
          <button
            ref={firstBtnRef}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Aprobar: confirmación simple */}
          {action === 'approve' && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('action.approveConfirm', { name: fullName ?? applicationId })}
            </p>
          )}

          {/* Rechazar: motivos predefinidos */}
          {(action === 'reject' || action === 'block') && (
            <>
              <div>
                <label className="label">{t('action.reason')} <span className="text-red-500">*</span></label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="input"
                  aria-required="true"
                >
                  <option value="">{t('action.selectReason')}</option>
                  {REJECT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {reason === 'Otro motivo' && (
                <div>
                  <label className="label">{t('action.customReason')}</label>
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    className="input resize-none h-20 text-sm"
                    placeholder={t('action.customReasonPlaceholder')}
                    minLength={10}
                    aria-required="true"
                  />
                </div>
              )}
              {action === 'block' && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{t('action.blockWarning')}</p>
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={e => setConfirmed(e.target.checked)}
                      className="rounded border-red-300"
                    />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {t('action.blockConfirm')}
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {/* Solicitar info */}
          {action === 'request-info' && (
            <>
              <div>
                <label className="label">{t('action.messageToUser')} <span className="text-red-500">*</span></label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="input resize-none h-24 text-sm"
                  placeholder={t('action.messagePlaceholder')}
                  minLength={10}
                  aria-required="true"
                />
              </div>
              <div>
                <label className="label">{t('action.infoRequired')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {INFO_ITEMS.map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={infoItems.includes(item)}
                        onChange={e => setInfoItems(prev =>
                          e.target.checked ? [...prev, item] : prev.filter(i => i !== item)
                        )}
                        className="rounded border-gray-300"
                      />
                      {t(`infoItem.${item}`, { defaultValue: item })}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">{t('action.deadlineDays')}</label>
                <input
                  type="number"
                  min={1} max={30}
                  value={deadlineDays}
                  onChange={e => setDeadlineDays(Number(e.target.value))}
                  className="input w-24"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className={
              action === 'approve'        ? 'btn-primary' :
              action === 'reject'         ? 'btn-danger' :
              action === 'request-info'   ? 'btn-warning' :
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50'
            }
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? t('common.saving') : t(`action.confirm.${action}`)}
          </button>
        </div>
      </div>
    </div>
  );
}
