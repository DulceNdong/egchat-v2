// CaseDetail — Panel lateral con el detalle completo del caso KYC
import React, { useEffect, useState } from 'react';
import { kycApi, type KycDetail } from '../api/kycApi';
import { StatusBadge, RiskBadge } from './StatusBadge';
import { DecisionModal } from './DecisionModal';

interface Props {
  caseId:  string;
  onClose: () => void;
  onDone:  () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold text-right max-w-[60%] ${highlight ? 'text-red-600' : 'text-gray-800'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

export function CaseDetail({ caseId, onClose, onDone }: Props) {
  const [detail,  setDetail]  = useState<KycDetail | null>(null);
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'info' | 'audit'>('info');
  const [showDecision, setShowDecision] = useState(false);

  useEffect(() => {
    Promise.all([
      kycApi.detail(caseId),
      kycApi.auditLog(caseId),
    ]).then(([d, l]) => {
      setDetail(d);
      setLogs(l.logs ?? []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!detail) return null;

  const canDecide = ['submitted','PENDING_REVIEW','MANUAL_REVIEW','under_review'].includes(detail.status);

  return (
    <>
      <div className="flex flex-col h-full" role="complementary" aria-label="Detalle del caso">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-lg">{detail.full_name || 'Sin nombre'}</h2>
              <StatusBadge status={detail.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">ID: {detail.application_id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
            aria-label="Cerrar panel de detalle"
          >✕</button>
        </div>

        {/* Score visual */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
          <RiskBadge risk={detail.risk_level} score={detail.risk_score} />
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full ${detail.risk_score < 30 ? 'bg-green-500' : detail.risk_score < 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${detail.risk_score}%` }}
              aria-valuenow={detail.risk_score}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <span className="text-sm font-bold text-gray-700">{detail.risk_score}/100</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['info', 'audit'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'info' ? '📋 Información' : '📜 Auditoría'}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'info' && (
            <>
              <Section title="Datos personales">
                <Row label="Nombre"          value={detail.full_name} />
                <Row label="Fecha nacimiento" value={detail.date_of_birth ? new Date(detail.date_of_birth).toLocaleDateString('es-ES') : null} />
                <Row label="Nacionalidad"    value={detail.nationality} />
                <Row label="Teléfono"        value={detail.user_phone} />
              </Section>

              <Section title="Documento">
                <Row label="Tipo"           value={detail.document_type} />
                <Row label="Número"         value={detail.document_number} />
                <Row label="OCR confidence" value={detail.ocr_confidence != null ? `${Math.round(detail.ocr_confidence * 100)}%` : null} />
              </Section>

              <Section title="Biometría">
                <Row
                  label="Face match"
                  value={detail.face_match_score != null ? `${Math.round(detail.face_match_score * 100)}%` : null}
                  highlight={detail.face_match_score != null && detail.face_match_score < 0.7}
                />
                <Row
                  label="Liveness"
                  value={detail.liveness_passed ? '✅ Pasado' : '❌ Fallido'}
                  highlight={!detail.liveness_passed}
                />
                <Row
                  label="Screening hits"
                  value={detail.screening_hits > 0 ? `⚠️ ${detail.screening_hits} coincidencias` : '✅ Sin coincidencias'}
                  highlight={detail.screening_hits > 0}
                />
              </Section>

              <Section title="Perfil financiero">
                <Row label="Profesión"       value={detail.profession} />
                <Row label="Ingresos/mes"    value={detail.monthly_income_range} />
                <Row label="Origen fondos"   value={detail.source_of_funds} />
                <Row
                  label="PEP"
                  value={detail.politically_exposed ? '⚠️ Sí' : 'No'}
                  highlight={detail.politically_exposed}
                />
              </Section>
            </>
          )}

          {tab === 'audit' && (
            <div className="space-y-2">
              {!logs.length && (
                <div className="text-center text-gray-400 py-8 text-sm">Sin registros de auditoría</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-700 uppercase">{log.action}</span>
                    <span className="text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleString('es-ES') : ''}</span>
                  </div>
                  <div className="text-gray-500">{log.performed_role} · {log.ip_address}</div>
                  {log.details && (
                    <pre className="mt-1 text-gray-400 text-xs overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        {canDecide && (
          <div className="border-t border-gray-100 px-4 py-3 bg-white">
            <button
              onClick={() => setShowDecision(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm"
              aria-label="Tomar decisión sobre este caso"
            >
              📋 Tomar decisión (Ctrl+A / Ctrl+R)
            </button>
          </div>
        )}
      </div>

      {showDecision && (
        <DecisionModal
          caseId={detail.application_id}
          caseName={detail.full_name}
          onDone={() => { setShowDecision(false); onDone(); }}
          onCancel={() => setShowDecision(false)}
        />
      )}
    </>
  );
}
