/**
 * Layout compartido para todas las páginas del Dashboard BANGE.
 * Incluye: sidebar, header con contador en tiempo real, y área de contenido.
 */
import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutList, BarChart3, LogOut, Sun, Moon, RefreshCw } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { useTheme } from '@/core/theme/ThemeContext';
import { useKycStats } from '@/shared/hooks/useKycAdmin';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface BangeLayoutProps {
  children: ReactNode;
  title:    string;
}

export default function BangeLayout({ children, title }: BangeLayoutProps) {
  const { admin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: stats, isFetching } = useKycStats();

  async function handleLogout() {
    await logout();
    navigate('/bange/login');
  }

  const navItems = [
    { to: '/bange/queue',   icon: LayoutList, label: t('nav.queue'),   badge: stats?.pending_review },
    { to: '/bange/reports', icon: BarChart3,  label: t('nav.reports')  },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
        aria-label="Navegación principal"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm" aria-hidden="true">B</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">BANGE KYC</p>
            <p className="text-xs text-gray-400 truncate">{admin?.role}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1" aria-label="Menú">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span
                  className="ml-auto bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  aria-label={`${badge} pendientes`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 px-3 mb-2 truncate">{admin?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h1 className="font-semibold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex items-center gap-3">
            {/* Polling indicator */}
            {isFetching && (
              <RefreshCw
                className="w-4 h-4 text-brand-500 animate-spin"
                aria-label="Actualizando datos…"
              />
            )}
            {/* Idioma */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'fr' : 'es')}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
              aria-label="Cambiar idioma"
            >
              {i18n.language === 'es' ? 'FR' : 'ES'}
            </button>
            {/* Tema */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
