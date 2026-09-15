/**
 * Home Dashboard Empresa — KPI cards + gráficos + alertas en tiempo real.
 */
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { subDays, format } from 'date-fns';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useKycStats, useFlaggedTransactions, useSARs } from '@/shared/hooks/useKycAdmin';
import { useKycPending } from '@/shared/hooks/useKycAdmin';
import CompanyLayout from '../components/CompanyLayout';
import { RiskBadge } from '@/shared/components/ui/Badges';

export default function CompanyHome() {
  const { t } = useTranslation();

  const { data: stats }   = useKycStats();
  const { data: flagged } = useFlaggedTransactions({ page: 1, page_size: 5, reviewed: false });
  const { data: sars }    = useSARs({ page: 1, page_size: 5, overdue_only: true });
  const { data: pending } = useKycPending({ page: 1, page_size: 5 });

  // Simulación de series de tiempo (en producción: endpoint dedicado)
  const newUsersData = useMemo(() => (
    Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(new Date(), 29 - i), 'dd/MM'),
      users: Math.floor(Math.random() * 20) + 5,
    }))
  ), []);

  const txByType = [
    { name: 'P2P',        value: 1240, fill: '#00C8A0' },
    { name: 'TOPUP',      value:  830, fill: '#00B4E6' },
    { name: 'P2M',        value:  560, fill: '#8B5CF6' },
    { name: 'WITHDRAWAL', value:  320, fill: '#F59E0B' },
  ];

  const kpis = [
    { label: t('home.totalUsers'),    value: stats?.total_applications ?? '—',  icon: '👥', color: 'text-brand-600'   },
    { label: t('home.kycCompleted'),  value: stats?.total_applications ?? '—',  icon: '✅', color: 'text-green-600'   },
    { label: t('home.pendingBange'),  value: stats?.pending_review ?? '—',      icon: '⏳', color: 'text-amber-600'   },
    { label: t('home.approved'),      value: stats?.approved_today ?? '—',      icon: '🎉', color: 'text-green-500'   },
    { label: t('home.rejected'),      value: stats?.rejected_today ?? '—',      icon: '❌', color: 'text-red-600'     },
    { label: t('home.highRisk'),      value: stats?.high_risk_count ?? '—',     icon: '🔴', color: 'text-red-700'     },
    { label: t('home.sarOverdue'),    value: stats?.sars_overdue ?? 0,          icon: '⚠️', color: 'text-orange-600'  },
    { label: t('home.screeningHits'), value: stats?.screening_hits_unreviewed ?? 0, icon: '🔍', color: 'text-purple-600' },
  ];

  return (
    <CompanyLayout title={t('home.title')}>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => (
          <div key={kpi.label} className="card p-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
            <span className="text-2xl" aria-hidden="true">{kpi.icon}</span>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Usuarios nuevos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-500" aria-hidden="true" />
            <h2 className="font-semibold text-sm">{t('home.newUsers30d')}</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={newUsersData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#00C8A0" strokeWidth={2} dot={false} name={t('home.users')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transacciones por tipo */}
        <div className="card p-6">
          <h2 className="font-semibold text-sm mb-4">{t('home.txByType')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={txByType} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('home.count')}>
                {txByType.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas activas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Transacciones AML sin revisar */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <h2 className="font-semibold text-sm">{t('home.amlAlerts')}</h2>
            {(flagged?.total ?? 0) > 0 && (
              <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                {flagged?.total}
              </span>
            )}
          </div>
          {flagged?.items.length === 0 ? (
            <p className="text-sm text-gray-400">✅ {t('home.noAmlAlerts')}</p>
          ) : (
            <ul className="space-y-2" aria-label={t('home.amlAlerts')}>
              {flagged?.items.map(tx => (
                <li key={tx.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <span className="font-mono text-xs text-gray-500">{tx.user_id.slice(0, 8)}…</span>
                  <span className="font-medium">{Number(tx.amount).toLocaleString()} {tx.currency}</span>
                  <span className="ml-auto text-xs text-amber-600 font-medium">{tx.flag_type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SAR vencidos */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">⏰</span>
            <h2 className="font-semibold text-sm">{t('home.sarOverdueList')}</h2>
          </div>
          {sars?.items.length === 0 ? (
            <p className="text-sm text-gray-400">✅ {t('home.noSarOverdue')}</p>
          ) : (
            <ul className="space-y-2" aria-label={t('home.sarOverdueList')}>
              {sars?.items.map(sar => (
                <li key={sar.id} className="text-sm p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sar.report_type}</span>
                    <span className="ml-auto text-xs text-red-600 font-medium">
                      {t('home.overdue')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{sar.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Casos de alto riesgo recientes */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base" aria-hidden="true">🔴</span>
            <h2 className="font-semibold text-sm">{t('home.recentHighRisk')}</h2>
          </div>
          {pending?.items.filter(i => ['high','HIGH'].includes(i.risk_level)).length === 0 ? (
            <p className="text-sm text-gray-400">✅ {t('home.noHighRisk')}</p>
          ) : (
            <ul className="space-y-2">
              {pending?.items
                .filter(i => ['high','HIGH'].includes(i.risk_level))
                .slice(0, 4)
                .map(item => (
                  <li key={item.application_id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.full_name ?? item.user_phone ?? '—'}</p>
                      <p className="text-xs text-gray-500">{item.nationality}</p>
                    </div>
                    <RiskBadge level={item.risk_level} score={item.risk_score} />
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
}
