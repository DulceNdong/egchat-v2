/**
 * Layout Dashboard Empresa — sidebar con nav completa y header.
 */
import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, AlertTriangle, FileWarning, BarChart2, LogOut, Sun, Moon, RefreshCw } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { useTheme } from '@/core/theme/ThemeContext';
import { useKycStats, useFlaggedTransactions } from '@/shared/hooks/useKycAdmin';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface CompanyLayoutProps { children: ReactNode; title: string; }

export default function CompanyLayout({ children, title }: CompanyLayoutProps) {
  const { admin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: stats, isFetching } = useKycStats();
  const { data: flagged } = useFlaggedTransactions({ page: 1, page_size: 1, reviewed: false });

  async function handleLogout() {
    await logout();
    navigate('/company/login');
  }

  const amlCount = flagged?.total ?? 0;

  const navItems = [
    { to: '/company/home',    icon: Home,         label: t('nav.home')    },
    { to: '/company/users',   icon: Users,        label: t('nav.users'),  badge: stats?.pending_review },
    { to: '/company/aml',     icon: AlertTriangle,label: t('nav.aml'),    badge: amlCount, badgeColor: 'bg-amber-500' },
    { to: '/company/sar',     icon: FileWarning,  label: t('nav.sar'),    badge: stats?.sars_overdue, badgeColor: 'bg-red-600' },
    { to: '/company/reports', icon: BarChart2,    label: t('nav.reports') },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <aside className="w-60 flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800" aria-label="Navegación principal">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm" aria-hidden="true">E</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">EGChat Admin</p>
            <p className="text-xs text-gray-400 truncate">{admin?.role}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Menú">
          {navItems.map(({ to, icon: Icon, label, badge, badgeColor = 'bg-brand-500' }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span className={`${badgeColor} text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}
                  aria-label={`${badge} elementos`}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 px-3 mb-2 truncate">{admin?.email}</p>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full">
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h1 className="font-semibold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex items-center gap-3">
            {isFetching && <RefreshCw className="w-4 h-4 text-brand-500 animate-spin" aria-label="Actualizando datos…" />}
            <button onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'fr' : 'es')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
              aria-label="Cambiar idioma">
              {i18n.language === 'es' ? 'FR' : 'ES'}
            </button>
            <button onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}>
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6" id="main-content">{children}</main>
      </div>
    </div>
  );
}
