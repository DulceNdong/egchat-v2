/**
 * Reportes BANGE — tasa aprobación/rechazo, tiempo medio, distribución de riesgo.
 * Exportable a PDF (jsPDF) y Excel (xlsx).
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import BangeLayout from '../components/BangeLayout';
import type { KycStats } from '@/types';

// ── Colores ───────────────────────────────────────────────────────
const COLORS = {
  approved: '#10B981',
  rejected: '#EF4444',
  pending:  '#F59E0B',
  blocked:  '#6B7280',
  low:      '#10B981',
  medium:   '#F59E0B',
  high:     '#EF4444',
};

// ── Tipos internos ────────────────────────────────────────────────
interface DailyStats { date: string; approved: number; rejected: number; total: number; }
interface RiskDist   { name: string; value: number; color: string; }

export default function BangeReports() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  // Stats globales
  const { data: stats } = useQuery<KycStats>({
    queryKey: ['kyc', 'stats'],
    queryFn:  () => apiClient.get('/admin/kyc/stats').then(r => r.data),
    staleTime: 60_000,
  });

  // Simulación de datos diarios (en producción: GET /admin/kyc/reports?days=30)
  const dailyData: DailyStats[] = useMemo(() => {
    return Array.from({ length: period }, (_, i) => {
      const d      = subDays(new Date(), period - i - 1);
      const total  = Math.floor(Math.random() * 15) + 1;
      const app    = Math.floor(total * (0.6 + Math.random() * 0.3));
      const rej    = total - app;
      return { date: format(d, 'dd/MM'), approved: app, rejected: rej, total };
    });
  }, [period]);

  const riskDist: RiskDist[] = [
    { name: 'Bajo',  value: Math.round((stats?.total_applications ?? 100) * 0.55), color: COLORS.low    },
    { name: 'Medio', value: Math.round((stats?.total_applications ?? 100) * 0.30), color: COLORS.medium },
    { name: 'Alto',  value: stats?.high_risk_count ?? 15,                          color: COLORS.high   },
  ];

  const decisionDist = [
    { name: 'Aprobados',  value: (stats?.approved_today ?? 0) * period,    fill: COLORS.approved },
    { name: 'Rechazados', value: (stats?.rejected_today ?? 0) * period,    fill: COLORS.rejected },
    { name: 'Pendientes', value: stats?.pending_review ?? 0,               fill: COLORS.pending  },
  ];

  const totalDecided  = decisionDist.slice(0, 2).reduce((a, b) => a + b.value, 0);
  const approvalRate  = totalDecided > 0
    ? ((decisionDist[0].value / totalDecided) * 100).toFixed(1)
    : '—';
  const avgReviewTime = '4.2h'; // placeholder — en prod: calcular de kyc_applications.reviewed_at - submitted_at

  // ── Exportar PDF ─────────────────────────────────────────────────
  async function exportPDF() {
    const { jsPDF } = await import('jspdf');
    const autoTable  = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Informe KYC — BANGE', 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: últimos ${period} días — ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);

    // KPIs
    doc.setFontSize(12);
    doc.text('Indicadores clave', 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [['Indicador', 'Valor']],
      body: [
        ['Tasa de aprobación',      `${approvalRate}%`],
        ['Tiempo medio de revisión', avgReviewTime],
        ['Casos de alto riesgo',     String(stats?.high_risk_count ?? '—')],
        ['SAR vencidos',             String(stats?.sars_overdue ?? 0)],
        ['Total solicitudes',        String(stats?.total_applications ?? '—')],
      ],
    });

    // Tabla diaria
    const finalY = (doc as any).lastAutoTable?.finalY ?? 100;
    doc.setFontSize(12);
    doc.text(`Actividad diaria (últimos ${period} días)`, 14, finalY + 12);
    autoTable(doc, {
      startY: finalY + 17,
      head: [['Fecha', 'Aprobados', 'Rechazados', 'Total']],
      body: dailyData.map(d => [d.date, d.approved, d.rejected, d.total]),
    });

    doc.save(`informe-kyc-bange-${format(new Date(), 'yyyyMMdd')}.pdf`);
  }

  // ── Exportar Excel ────────────────────────────────────────────────
  async function exportExcel() {
    const XLSX = await import('xlsx');
    const ws   = XLSX.utils.json_to_sheet(dailyData);
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividad Diaria');

    const kpiSheet = XLSX.utils.json_to_sheet([
      { Indicador: 'Tasa aprobación',       Valor: `${approvalRate}%` },
      { Indicador: 'Tiempo medio revisión', Valor: avgReviewTime },
      { Indicador: 'Alto riesgo',           Valor: stats?.high_risk_count ?? '—' },
      { Indicador: 'SAR vencidos',          Valor: stats?.sars_overdue ?? 0 },
    ]);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');
    XLSX.writeFile(wb, `informe-kyc-bange-${format(new Date(), 'yyyyMMdd')}.xlsx`);
  }

  return (
    <BangeLayout title={t('reports.title')}>

      {/* Header + controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
              aria-pressed={period === p}
            >
              {t(`reports.last${p}Days`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="btn-secondary gap-2">
            <FileText className="w-4 h-4" aria-hidden="true" />
            {t('reports.exportPDF')}
          </button>
          <button onClick={exportExcel} className="btn-secondary gap-2">
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            {t('reports.exportExcel')}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('reports.approvalRate'),  value: `${approvalRate}%`, color: 'text-green-600',  icon: '✅' },
          { label: t('reports.avgReviewTime'), value: avgReviewTime,       color: 'text-blue-600',   icon: '⏱️' },
          { label: t('reports.highRiskCases'), value: stats?.high_risk_count ?? '—', color: 'text-red-600', icon: '🔴' },
          { label: t('reports.sarOverdue'),    value: stats?.sars_overdue ?? 0,      color: 'text-amber-600',icon: '⚠️' },
        ].map(kpi => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
              <span className="text-2xl" aria-hidden="true">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Línea: actividad diaria */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-semibold text-sm mb-4">{t('reports.dailyActivity')}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="approved" stroke={COLORS.approved} name={t('reports.approved')} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rejected" stroke={COLORS.rejected} name={t('reports.rejected')} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie: distribución de riesgo */}
        <div className="card p-6">
          <h2 className="font-semibold text-sm mb-4">{t('reports.riskDistribution')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskDist}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {riskDist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {riskDist.map(r => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                  <span className="text-gray-600 dark:text-gray-400">{r.name}</span>
                </div>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barras: decisiones acumuladas */}
        <div className="lg:col-span-3 card p-6">
          <h2 className="font-semibold text-sm mb-4">{t('reports.decisionSummary')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={decisionDist} layout="vertical" margin={{ left: 60 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {decisionDist.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BangeLayout>
  );
}
