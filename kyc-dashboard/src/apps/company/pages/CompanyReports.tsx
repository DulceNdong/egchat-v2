/**
 * Generador de informe mensual para BANGE — exportable a PDF.
 * Diseño profesional con iconos Lucide y preview visual de secciones.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText, Loader2, Calendar, Users, ShieldAlert,
  FileWarning, Scale, Download, CheckCircle2, Lock,
  ChevronRight, ArrowDownToLine, FileSpreadsheet,
} from 'lucide-react';
import { useKycStats } from '@/shared/hooks/useKycAdmin';
import { useCanDo } from '@/core/auth/RoleGuard';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import CompanyLayout from '../components/CompanyLayout';

// Secciones del informe con icono, color y descripción
const REPORT_SECTIONS = [
  {
    num:         '01',
    title:       'Usuarios y KYC',
    description: 'Solicitudes, aprobaciones, rechazos y distribución de riesgo',
    icon:        Users,
    color:       'text-blue-600 dark:text-blue-400',
    iconBg:      'bg-blue-50 dark:bg-blue-950/30',
    border:      'border-blue-100 dark:border-blue-900/30',
  },
  {
    num:         '02',
    title:       'Monitorización AML',
    description: 'Transacciones flaggeadas, screening hits y alertas activas',
    icon:        ShieldAlert,
    color:       'text-amber-600 dark:text-amber-400',
    iconBg:      'bg-amber-50 dark:bg-amber-950/30',
    border:      'border-amber-100 dark:border-amber-900/30',
  },
  {
    num:         '03',
    title:       'DOS / SAR',
    description: 'Declaraciones de Operaciones Sospechosas enviadas a la ANIF',
    icon:        FileWarning,
    color:       'text-red-600 dark:text-red-400',
    iconBg:      'bg-red-50 dark:bg-red-950/30',
    border:      'border-red-100 dark:border-red-900/30',
  },
  {
    num:         '04',
    title:       'Declaración de Cumplimiento',
    description: 'Conformidad COBAC R-2023/01 · CEMAC N°02/24 · Ley N°2/2008',
    icon:        Scale,
    color:       'text-purple-600 dark:text-purple-400',
    iconBg:      'bg-purple-50 dark:bg-purple-950/30',
    border:      'border-purple-100 dark:border-purple-900/30',
  },
];

export default function CompanyReports() {
  const { t }     = useTranslation();
  const canExport = useCanDo(['SUPER_ADMIN', 'COMPLIANCE_OFFICER']);
  const { data: stats } = useKycStats();

  const [month,      setMonth]      = useState(() => format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [generating, setGenerating] = useState(false);

  const monthDate  = new Date(`${month}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd   = endOfMonth(monthDate);
  const monthLabel = format(monthDate, 'MMMM yyyy');

  async function generatePDF() {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // ── Portada ──────────────────────────────────────────────
      doc.setFillColor(6, 40, 61);
      doc.rect(0, 0, 210, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('INFORME MENSUAL KYC/AML', 14, 25);
      doc.setFontSize(13);
      doc.text(`EGChat · BANGE — ${monthLabel}`, 14, 38);
      doc.setFontSize(9);
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 52);
      doc.text('Cumplimiento: COBAC R-2023/01 · CEMAC N°02/24', 14, 57);
      doc.setTextColor(0, 0, 0);

      // ── Sección 1: KYC ───────────────────────────────────────
      doc.setFontSize(13);
      doc.text('1. Resumen de Usuarios y KYC', 14, 75);
      autoTable(doc, {
        startY: 80,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total solicitudes KYC',   String(stats?.total_applications ?? '—')],
          ['Aprobados (hoy)',          String(stats?.approved_today    ?? '—')],
          ['Rechazados (hoy)',         String(stats?.rejected_today    ?? '—')],
          ['Pendientes de revisión',   String(stats?.pending_review    ?? '—')],
          ['Alto riesgo',              String(stats?.high_risk_count   ?? '—')],
          ['Score de riesgo promedio', String(stats?.avg_risk_score    ?? '—')],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 200, 160] },
      });

      let y = (doc as any).lastAutoTable?.finalY ?? 130;

      // ── Sección 2: AML ───────────────────────────────────────
      y += 12;
      doc.setFontSize(13);
      doc.text('2. Monitorización AML', 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [['Indicador', 'Valor']],
        body: [
          ['Screening hits sin revisar', String(stats?.screening_hits_unreviewed ?? '—')],
          ['SAR vencidos (>72h)',         String(stats?.sars_overdue             ?? 0)],
          ['Transacciones flaggeadas',    'Ver sistema AML'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 200, 160] },
      });

      y = (doc as any).lastAutoTable?.finalY ?? 180;

      // ── Sección 3: SAR ───────────────────────────────────────
      y += 12;
      doc.setFontSize(13);
      doc.text('3. Declaraciones de Operaciones Sospechosas (DOS/SAR)', 14, y);
      doc.setFontSize(9);
      doc.text('Periodo: ' + format(monthStart, 'dd/MM/yyyy') + ' — ' + format(monthEnd, 'dd/MM/yyyy'), 14, y + 6);
      autoTable(doc, {
        startY: y + 12,
        head: [['Tipo', 'Estado', 'Ref. ANIF', 'Importe', 'Fecha envío']],
        body: [
          ['SAR', 'SENT_TO_ANIF', 'ANIF-2026-XXX', '—',       '—'],
          ['CTR', 'ACKNOWLEDGED', 'ANIF-2026-YYY', '6.2M XAF','—'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 200, 160] },
      });

      y = (doc as any).lastAutoTable?.finalY ?? 230;

      // ── Sección 4: Cumplimiento ──────────────────────────────
      if (y > 250) { doc.addPage(); y = 20; }
      y += 12;
      doc.setFontSize(13);
      doc.text('4. Declaración de Cumplimiento', 14, y);
      doc.setFontSize(9);
      doc.text([
        'El presente informe ha sido generado de conformidad con el Reglamento COBAC R-2023/01',
        'y el Reglamento CEMAC N°02/24 sobre prevención del blanqueo de capitales.',
        '',
        'La plataforma EGChat opera bajo licencia de Emisor de Dinero Electrónico concedida',
        'por la BEAC/COBAC a BANGE (Banco Nacional de Guinea Ecuatorial).',
        '',
        'Todos los datos están retenidos por un período mínimo de 10 años según el Art. 23',
        'del Reglamento COBAC R-2023/01.',
      ], 14, y + 8, { lineHeightFactor: 1.6 });

      // ── Pie de página ────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} — EGChat KYC/AML — Confidencial`, 14, 290);
        doc.text(`COBAC R-2023/01 · Ref: EGCHAT-${format(new Date(), 'yyyyMM')}-RPT`, 130, 290);
      }

      doc.save(`informe-mensual-kyc-${month}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <CompanyLayout title={t('reports.monthlyTitle')}>

      {/* ── Selector de mes ────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 mb-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-500" aria-hidden="true" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                {t('reports.month')}
              </label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                max={format(subMonths(new Date(), 1), 'yyyy-MM')}
                className="input w-44 text-sm"
                aria-label={t('reports.selectMonth')}
              />
            </div>
          </div>

          {/* Rango de fechas */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-mono text-gray-500">{format(monthStart, 'dd/MM/yyyy')}</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-mono text-gray-500">{format(monthEnd, 'dd/MM/yyyy')}</span>
          </div>

          {/* Periodo label */}
          <div className="px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/30">
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 capitalize">
              {monthLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Preview de secciones ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {REPORT_SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-xl border ${section.border} bg-white dark:bg-gray-900 shadow-sm`}
            >
              {/* Número */}
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-gray-400">{section.num}</span>
              </div>

              {/* Icono */}
              <div className={`w-10 h-10 rounded-xl ${section.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${section.color}`} aria-hidden="true" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{section.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{section.description}</p>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t('reports.sectionReady')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Botón generar ─────────────────────────────────────── */}
      {canExport ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={generatePDF}
            disabled={generating}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={generating}
          >
            {generating
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <ArrowDownToLine className="w-5 h-5" />}
            <span>{generating ? t('reports.generating') : t('reports.generatePDF')}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Documento confidencial — uso interno BANGE</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{t('reports.noPermission')}</p>
        </div>
      )}

      {/* ── Nota legal ────────────────────────────────────────── */}
      <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
        <Scale className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          {t('reports.legalNote')}
        </p>
      </div>

    </CompanyLayout>
  );
}
