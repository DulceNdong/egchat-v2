// AmlPage — Página de alertas AML y SARs
import React, { useEffect, useState } from 'react';
import { amlApi, type AmlAlert, type AmlSar } from '../api/kycApi';

const FLAG_LABELS: Record<string, string> = {
  LARGE_TRANSACTION: '💰 Transacción grande',
  VELOCITY:          '⚡ Velocidad',
  STRUCTURING:       '🧩 Fraccionamiento',
  HIGH_RISK_COUNTRY: '🌍 País de alto riesgo',
  SUDDEN_ACTIVITY:   '👤 Actividad repentina',
  MANUAL:            '👁 Manual',
};

export function AmlPage() {
  const [alerts,   setAlerts]   = useState<AmlAlert[]>([]);
  const [sars,     setSars]     = useState<AmlSar[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'alerts' | 'sars'>('alerts');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes,    setNotes]    = useState('');

  useEffect(() => {
    Promise.all([amlApi.alerts(), amlApi.sars()])
      .then(([a, s]) => { setAlerts(a.alerts); setSars(s.sars); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (id: string, decision: 'confirm' | 'dismiss') => {
    try {
      await amlApi.reviewAlert(id, decision, notes);
      setAlerts(prev => prev.filter(a => a.id !== id));
      setReviewing(null);
      setNotes('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Monitorización AML</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {alerts.length} alertas pendientes · {sars.length} SARs
        </p>
        <div className="flex gap-2 mt-4">
          {(['alerts', 'sars'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'alerts' ? `⚠️ Alertas (${alerts.length})` : `📄 SARs (${sars.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Cargando...
          </div>
        )}

        {/* ── ALERTAS ──────────────────────────────────────────── */}
        {tab === 'alerts' && !loading && (
          <div className="space-y-3">
            {!alerts.length && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">✅</span>
                Sin alertas pendientes
              </div>
            )}
            {alerts.map(a => (
              <div
                key={a.id}
                className={`border-2 rounded-xl p-4 ${reviewing === a.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {FLAG_LABELS[a.flag_type] ?? a.flag_type}
                    </span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(a.flagged_at).toLocaleString('es-ES')} · Usuario: {a.user_id.slice(0,8)}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {parseFloat(String(a.amount)).toLocaleString('es-ES')} {a.currency}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{a.flag_reason}</p>

                {reviewing === a.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Notas de revisión..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-blue-400 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(a.id, 'confirm')}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        ⚠️ Confirmar sospecha
                      </button>
                      <button
                        onClick={() => handleReview(a.id, 'dismiss')}
                        className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition"
                      >
                        ✓ Descartar
                      </button>
                      <button
                        onClick={() => { setReviewing(null); setNotes(''); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewing(a.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Revisar →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SARs ─────────────────────────────────────────────── */}
        {tab === 'sars' && !loading && (
          <div className="space-y-3">
            {!sars.length && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">📄</span>
                Sin SARs registrados
              </div>
            )}
            {sars.map(s => (
              <div
                key={s.id}
                className={`border-2 rounded-xl p-4 ${s.overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    s.status === 'DRAFT'          ? 'bg-gray-100 text-gray-600' :
                    s.status === 'APPROVED'       ? 'bg-green-100 text-green-700' :
                    s.status === 'SENT_TO_ANIF'   ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {s.status}
                  </span>
                  {s.overdue && (
                    <span className="text-xs text-red-600 font-bold">⚠️ PLAZO VENCIDO</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{s.subject_name}</p>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Detectado: {new Date(s.detected_at).toLocaleDateString('es-ES')}</span>
                  <span>Plazo: {new Date(s.deadline_at).toLocaleDateString('es-ES')}</span>
                  <span className="font-semibold text-gray-700">
                    {parseFloat(String(s.amount_involved || 0)).toLocaleString('es-ES')} XAF
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
