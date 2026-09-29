/**
 * Home Dashboard Empresa — KPI cards + gráficos + alertas en tiempo real.
 * Diseño profesional con iconos SVG Lucide, gradientes y animaciones.
 */
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { subDays, format } from 'date-fns';
import {
  Users, ShieldCheck, Clock, CheckCircle2, XCircle,
  AlertOctagon, FileWarning, ScanSearch, TrendingUp,
  AlertTriangle, Timer, ChevronRight, ArrowUpRight,
  Activity,
} from 'lucide-react';
import { useKycStats, useFlaggedTransactions, useSARs, useKycPending } from '@/shared/hooks/useKycAdmin';
import CompanyLayout from '../components/CompanyLayout';
import { RiskBadge } from '@/shared/components/ui/Badges';

// ── Tooltip personalizado para los gráficos ───────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function CompanyHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: stats }   = useKycStats();
  const { data: flagged } = useFlaggedTransactions({ page: 1, page_size: 5, reviewed: false });
  const { data: sars }    = useSARs({ page: 1, page_size: 5, overdue_only: true });
  const { data: pending } = useKycPending({ page: 1, page_size: 5 });

  const newUsersData = useMemo(() => (
    Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'dd/MM'),
      users: Math.floor(Math.random() * 20) + 5,
    }))
  ), []);

  const txByType = [
    { name: 'P2P',        value: 1240, fill: '#00C8A0', pct: '+12%' },
    { name: 'TOPUP',      value:  830, fill: '#00B4E6', pct: '+8%'  },
    { name: 'P2M',        value:  560, fill: '#8B5CF6', pct: '-3%'  },
    { name: 'WITHDRAWAL', value:  320, fill: '#F59E0B', pct: '+5%'  },
  ];

  // KPI cards con iconos Lucide + configuración visual
  const kpis = [
    {
      label:   t('home.totalUsers'),
      value:   stats?.total_applications ?? '—',
      icon:    Users,
      gradient:'from-blue-500 to-blue-600',
      bg:      'bg-blue-50 dark:bg-blue-950/30',
      color:   'text-blue-600 dark:text-blue-400',
      iconBg:  'bg-blue-100 dark:bg-blue-900',
      trend:   null,
    },
    {
      label:   t('home.kycCompleted'),
      value:   stats?.total_applications ?? '—',
      icon:    ShieldCheck,
      gradient:'from-emerald-500 to-emerald-600',
      bg:      'bg-emerald-50 dark:bg-emerald-950/30',
      color:   'text-emerald-600 dark:text-emerald-400',
      iconBg:  'bg-emerald-100 dark:bg-emerald-900',
      trend:   null,
    },
    {
      label:   t('home.pendingBange'),
      value:   stats?.pending_review ?? '—',
      icon:    Clock,
      gradient:'from-amber-500 to-amber-600',
      bg:      'bg-amber-50 dark:bg-amber-950/30',
      color:   'text-amber-600 dark:text-amber-400',
      iconBg:  'bg-amber-100 dark:bg-amber-900',
      trend:   null,
    },
    {
      label:   t('home.approved'),
      value:   stats?.approved_today ?? '—',
      icon:    CheckCircle2,
      gradient:'from-green-500 to-green-600',
      bg:      'bg-green-50 dark:bg-green-950/30',
      color:   'text-green-600 dark:text-green-400',
      iconBg:  'bg-green-100 dark:bg-green-900',
      trend:   null,
    },
    {
      label:   t('home.rejected'),
      value:   stats?.rejected_today ?? '—',
      icon:    XCircle,
      gradient:'from-red-500 to-red-600',
      bg:      'bg-red-50 dark:bg-red-950/30',
      color:   'text-red-600 dark:text-red-400',
      iconBg:  'bg-red-100 dark:bg-red-900',
      trend:   null,
    },
    {
      label:   t('home.highRisk'),
      value:   stats?.high_risk_count ?? '—',
      icon:    AlertOctagon,
      gradient:'from-rose-500 to-rose-700',
      bg:      'bg-rose-50 dark:bg-rose-950/30',
      color:   'text-rose-600 dark:text-rose-400',
      iconBg:  'bg-rose-100 dark:bg-rose-900',
      trend:   null,
    },
    {
      label:   t('home.sarOverdue'),
      value:   stats?.sars_overdue ?? 0,
      icon:    FileWarning,
      gradient:'from-orange-500 to-orange-600',
      bg:      'bg-orange-50 dark:bg-orange-950/30',
      color:   'text-orange-600 dark:text-orange-400',
      iconBg:  'bg-orange-100 dark:bg-orange-900',
      trend:   null,
    },
    {
      label:   t('home.screeningHits'),
      value:   stats?.screening_hits_unreviewed ?? 0,
      icon:    ScanSearch,
      gradient:'from-purple-500 to-purple-600',
      bg:      'bg-purple-50 dark:bg-purple-950/30',
      color:   'text-purple-600 dark:text-purple-400',
      iconBg:  'bg-purple-100 dark:bg-purple-900',
      trend:   null,
    },
  ];

  return (
    <CompanyLayout title={t('home.title')}>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow group`}
            >
              {/* Fondo decorativo */}
              <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.06] bg-gradient-to-br ${kpi.gradient}`} />

              <div className="flex items-start justify-between relative">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 leading-tight">{kpi.label}</p>
                  <p className={`text-2xl font-bold tracking-tight ${kpi.color}`}>
                    {kpi.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center flex-shrink-0 ml-3`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Gráficos ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Línea: usuarios nuevos */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand-500" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{t('home.newUsers30d')}</h2>
                <p className="text-xs text-gray-400">Últimos 30 días</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +14%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={newUsersData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C8A0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00C8A0" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#00C8A0"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#00C8A0', stroke: '#fff', strokeWidth: 2 }}
                name={t('home.users')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Barras: transacciones */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-500" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{t('home.txByType')}</h2>
                <p className="text-xs text-gray-400">Distribución actual</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={txByType} margin={{ top: 4, right: 8, bottom: 4, left: -20 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name={t('home.count')}>
                {txByType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Alertas activas ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* AML sin revisar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
              </div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{t('home.amlAlerts')}</h2>
            </div>
            {(flagged?.total ?? 0) > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {flagged?.total}
              </span>
            )}
          </div>

          {!flagged?.items.length ? (
            <div className="flex items-center gap-2 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-gray-400">{t('home.noAmlAlerts')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {flagged.items.map(tx => (
                <li key={tx.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="font-mono text-xs text-gray-400 truncate flex-1">
                    {tx.user_id.slice(0, 10)}…
                  </span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {Number(tx.amount).toLocaleString()} {tx.currency}
                  </span>
                  <span className="text-xs text-amber-600 font-medium bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                    {tx.flag_type?.replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => navigate('/company/aml')}
            className="flex items-center gap-1 mt-3 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* SAR vencidos */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <Timer className="w-4 h-4 text-red-500" aria-hidden="true" />
              </div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{t('home.sarOverdueList')}</h2>
            </div>
          </div>

          {!sars?.items.length ? (
            <div className="flex items-center gap-2 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-gray-400">{t('home.noSarOverdue')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sars.items.map(sar => (
                <li key={sar.id} className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded-md">
                      {sar.report_type}
                    </span>
                    <span className="ml-auto text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      {t('home.overdue')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{sar.description}</p>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => navigate('/company/sar')}
            className="flex items-center gap-1 mt-3 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Gestionar SAR <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Alto riesgo reciente */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4 text-rose-500" aria-hidden="true" />
              </div>
              <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{t('home.recentHighRisk')}</h2>
            </div>
          </div>

          {!pending?.items.filter(i => ['high','HIGH'].includes(i.risk_level)).length ? (
            <div className="flex items-center gap-2 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-gray-400">{t('home.noHighRisk')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {pending?.items
                .filter(i => ['high','HIGH'].includes(i.risk_level))
                .slice(0, 4)
                .map(item => (
                  <li
                    key={item.application_id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                    onClick={() => navigate(`/company/users/${item.application_id}`)}
                  >
                    {/* Avatar inicial */}
                    <div className="w-7 h-7 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-200">
                        {(item.full_name ?? item.user_phone ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {item.full_name ?? item.user_phone ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">{item.nationality ?? '—'}</p>
                    </div>
                    <RiskBadge level={item.risk_level} score={item.risk_score} />
                  </li>
                ))}
            </ul>
          )}

          <button
            onClick={() => navigate('/company/users')}
            className="flex items-center gap-1 mt-3 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Ver usuarios <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </CompanyLayout>
  );
}
