import React, { useEffect, useState } from 'react';
import { amlApi, type AmlAlert, type AmlSar } from '../api/kycApi';

interface Props { dark?: boolean; }

const FLAG_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  LARGE_TRANSACTION: { label: 'Transacción grande',   icon: '💰', color: 'amber' },
  VELOCITY:          { label: 'Velocidad inusual',    icon: '⚡', color: 'orange' },
  STRUCTURING:       { label: 'Fraccionamiento',      icon: '🧩', color: 'violet' },
  HIGH_RISK_COUNTRY: { label: 'País de alto riesgo',  icon: '🌍', color: 'red' },
  SUDDEN_ACTIVITY:   { label: 'Actividad repentina',  icon: '📈', color: 'blue' },
  MANUAL:            { label: 'Revisión manual',      icon: '👁', color: 'slate' },
};

const SAR_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT:          { label: 'Borrador',      cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  APPROVED:       { label: 'Aprobado',      cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  SENT_TO_ANIF:   { label: 'Enviado ANIF', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  UNDER_REVIEW:   { label: 'En revisión',  cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
};

export function AmlPage({ dark }: Props) {
  const [alerts,    setAlerts]    = useState<AmlAlert[]>([]);
  const [sars,      setSars]      = useState<AmlSar[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'alerts' | 'sars'>('alerts');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes,     setNotes]     = useState('');

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
      setReviewing(null); setNotes('');
    } catch (e: any) { alert(e.message); }
  };

  const bg   = dark ? 'bg-slate-900' : 'bg-slate-50';
  const card = dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const text = dark ? 'text-slate-200' : 'text-slate-800';
  const sub  = dark ? 'text-slate-400' : 'text-slate-500';
  const inp  = dark ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-blue-500' : 'border-slate-200 focus:border-blue-400';

  return (
    <div className={`flex flex-col h-full ${bg}`}>
      {/* Header */}
      <div className={`px-6 py-5 border-b ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-xl font-bold ${text}`}>Monitorización AML</h1>
            <p className={`text-sm mt-0.5 ${sub}`}>
              {alerts.length} alertas pendientes · {sars.length} SARs registrados
            </p>
          </div>
          {/* Badge alertas pendientes */}
          {alerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-600 dark:text-amber-400 text-sm font-semibold">{alerts.length} pendientes</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'alerts'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20'
                : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Alertas
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${tab === 'alerts' ? 'bg-white/20' : dark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
              {alerts.length}
            </span>
          </button>
          <button
            onClick={() => setTab('sars')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === 'sars'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : dark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            SARs
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${tab === 'sars' ? 'bg-white/20' : dark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
              {sars.length}
            </span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className={`text-sm ${sub}`}>Cargando datos AML...</span>
          </div>
        )}

        {/* ── ALERTAS ── */}
        {tab === 'alerts' && !loading && (
          <div className="space-y-3 fade-in">
            {!alerts.length && (
              <div className={`flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border ${card}`}>
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className={`font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Sin alertas pendientes</p>
                <p className={`text-sm ${sub}`}>Todo está bajo control</p>
              </div>
            )}
            {alerts.map(a => {
              const flag = FLAG_LABELS[a.flag_type] ?? { label: a.flag_type, icon: '⚠️', color: 'slate' };
              return (
                <div key={a.id} className={`border rounded-2xl p-5 transition-all ${reviewing === a.id ? (dark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-300 bg-blue-50') : `${card}`}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {flag.icon}
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${text}`}>{flag.label}</div>
                        <div className={`text-xs mt-0.5 ${sub}`}>
                          {new Date(a.flagged_at).toLocaleString('es-ES')} · ID: {a.user_id.slice(0,8)}…
                        </div>
                      </div>
                    </div>
                    <div className={`text-right`}>
                      <div className={`text-lg font-bold ${text}`}>
                        {parseFloat(String(a.amount)).toLocaleString('es-ES')}
                      </div>
                      <div className={`text-xs ${sub}`}>{a.currency}</div>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{a.flag_reason}</p>

                  {reviewing === a.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notas de revisión..."
                        rows={2}
                        className={`w-full border rounded-xl px-3 py-2 text-sm resize-none outline-none ${inp}`}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(a.id, 'confirm')}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          Confirmar sospecha
                        </button>
                        <button
                          onClick={() => handleReview(a.id, 'dismiss')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${dark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                        >
                          Descartar
                        </button>
                        <button
                          onClick={() => { setReviewing(null); setNotes(''); }}
                          className={`px-3 py-2.5 rounded-xl text-sm ${dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >✕</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewing(a.id)}
                      className="text-sm text-blue-500 hover:text-blue-400 font-semibold flex items-center gap-1"
                    >
                      Revisar
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SARs ── */}
        {tab === 'sars' && !loading && (
          <div className="space-y-3 fade-in">
            {!sars.length && (
              <div className={`flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border ${card}`}>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <p className={`font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>Sin SARs registrados</p>
              </div>
            )}
            {sars.map(s => {
              const stCfg = SAR_STATUS[s.status] ?? { label: s.status, cls: 'bg-slate-100 text-slate-600' };
              return (
                <div key={s.id} className={`border rounded-2xl p-5 ${s.overdue ? (dark ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50') : card}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${stCfg.cls}`}>
                      {stCfg.label}
                    </span>
                    {s.overdue && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        PLAZO VENCIDO
                      </span>
                    )}
                  </div>
                  <p className={`font-semibold text-sm mb-1 ${text}`}>{s.subject_name}</p>
                  <p className={`text-sm mb-3 line-clamp-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{s.description}</p>
                  <div className={`flex items-center justify-between text-xs ${sub} pt-3 border-t ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <span>Detectado: {new Date(s.detected_at).toLocaleDateString('es-ES')}</span>
                    <span>Plazo: {new Date(s.deadline_at).toLocaleDateString('es-ES')}</span>
                    <span className={`font-bold ${text}`}>{parseFloat(String(s.amount_involved || 0)).toLocaleString('es-ES')} XAF</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
