import React, { useEffect, useState } from 'react';
import { adminApi, type Stats } from '../api/adminApi';

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: number | string;
  sub?: string; color: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 border-l-4 shadow-sm ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-black text-gray-900">{value}</span>
      </div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function RiskBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="text-gray-500">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatsPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Cargando métricas...
    </div>
  );

  if (error) return (
    <div className="p-8 text-red-600">⚠️ {error}</div>
  );

  const k = stats!.kyc;
  const a = stats!.aml;

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Panel de Control KYC</h1>
        <p className="text-sm text-gray-500 mt-0.5">Métricas en tiempo real</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📋" label="Total casos"      value={k.total}         color="border-blue-500"   sub={`+${k.new_today} hoy`} />
        <StatCard icon="⏳" label="Pendientes"       value={k.pending}       color="border-yellow-500" sub="Requieren revisión" />
        <StatCard icon="✅" label="Aprobados"        value={k.approved}      color="border-green-500"  sub={`${k.total > 0 ? Math.round(k.approved / k.total * 100) : 0}% tasa aprobación`} />
        <StatCard icon="❌" label="Rechazados"       value={k.rejected}      color="border-red-500"    sub="" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🔍" label="Revisión manual"  value={k.manual_review} color="border-purple-500" sub="Requieren analista" />
        <StatCard icon="📊" label="Score medio"      value={`${k.avg_risk_score}/100`} color="border-indigo-500" sub="Risk score promedio" />
        <StatCard icon="⚠️" label="Alertas AML"     value={a.pending_alerts} color="border-orange-500" sub="Pendientes de revisión" />
        <StatCard icon="📅" label="Esta semana"      value={k.new_this_week} color="border-teal-500"   sub="Casos nuevos" />
      </div>

      {/* Distribución de riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Distribución de riesgo</h2>
          <RiskBar label="🔴 Alto riesgo"   value={k.high_risk}   total={k.total} color="bg-red-500" />
          <RiskBar label="🟡 Riesgo medio" value={k.medium_risk}  total={k.total} color="bg-yellow-400" />
          <RiskBar label="🟢 Bajo riesgo"  value={k.low_risk}     total={k.total} color="bg-green-500" />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Estado de casos</h2>
          <RiskBar label="✅ Aprobados"     value={k.approved}      total={k.total} color="bg-green-500" />
          <RiskBar label="⏳ Pendientes"    value={k.pending}       total={k.total} color="bg-yellow-400" />
          <RiskBar label="🔍 Revisión"      value={k.manual_review} total={k.total} color="bg-purple-500" />
          <RiskBar label="❌ Rechazados"    value={k.rejected}      total={k.total} color="bg-red-500" />
        </div>
      </div>
    </div>
  );
}
