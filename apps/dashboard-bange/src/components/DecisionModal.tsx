// DecisionModal — Modal de aprobación/rechazo de casos KYC
import React, { useState } from 'react';
import { kycApi } from '../api/kycApi';

interface Props {
  caseId:    string;
  caseName:  string;
  onDone:    () => void;
  onCancel:  () => void;
}

type Action = 'approve' | 'reject' | 'request_info';

export function DecisionModal({ caseId, caseName, onDone, onCancel }: Props) {
  const [action,    setAction]    = useState<Action>('approve');
  const [notes,     setNotes]     = useState('');
  const [reason,    setReason]    = useState('');
  const [isFinal,   setIsFinal]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const REJECT_REASONS = [
    'Documento no legible o de baja calidad',
    'Documento expirado',
    'Datos del documento no coinciden con los declarados',
    'Selfie no coincide con el documento',
    'Prueba de vida fallida',
    'Match en lista de sanciones',
    'Persona Políticamente Expuesta sin justificación',
    'Información financiera inconsistente',
    'Sospecha de fraude o falsificación',
    'Otro motivo',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'reject' && !reason) {
      setError('Selecciona el motivo del rechazo');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (action === 'approve') {
        await kycApi.approve(caseId, notes);
      } else if (action === 'reject') {
        await kycApi.reject(caseId, reason, isFinal);
      } else {
        await kycApi.requestInfo(caseId, notes);
      }
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-gray-900">Decisión sobre el caso</h2>
            <p className="text-sm text-gray-500 mt-0.5">{caseName}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Cerrar modal"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo de acción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Acción</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'approve',      label: '✅ Aprobar',        cls: 'border-green-300 bg-green-50 text-green-700' },
                { val: 'reject',       label: '❌ Rechazar',        cls: 'border-red-300 bg-red-50 text-red-700' },
                { val: 'request_info', label: '❓ Pedir info',     cls: 'border-blue-300 bg-blue-50 text-blue-700' },
              ] as const).map(btn => (
                <button
                  key={btn.val}
                  type="button"
                  onClick={() => setAction(btn.val)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    action === btn.val ? btn.cls : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Motivo del rechazo */}
          {action === 'reject' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-red-400 outline-none"
                  aria-label="Motivo del rechazo"
                >
                  <option value="">Seleccionar motivo...</option>
                  {REJECT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFinal}
                  onChange={e => setIsFinal(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold text-red-600">Rechazo definitivo</span> — el usuario no podrá reintentar
                </span>
              </label>
            </>
          )}

          {/* Notas / mensaje */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {action === 'request_info' ? 'Mensaje para el usuario *' : 'Notas internas (opcional)'}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={
                action === 'approve'      ? 'Añade notas de la revisión...' :
                action === 'request_info' ? 'Explica qué información necesitas...' :
                'Añade contexto adicional...'
              }
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:border-blue-400 outline-none"
              required={action === 'request_info'}
              aria-label="Notas adicionales"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] py-3 rounded-xl text-sm font-bold text-white transition ${
                action === 'approve'      ? 'bg-green-600 hover:bg-green-700' :
                action === 'reject'       ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Procesando...' :
               action === 'approve'      ? 'Confirmar aprobación' :
               action === 'reject'       ? 'Confirmar rechazo' :
                                           'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
