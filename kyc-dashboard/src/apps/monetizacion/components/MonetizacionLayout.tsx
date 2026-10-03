/**
 * Layout principal del portal de Monetización.
 * Sidebar + header, mismo patrón que CompanyLayout.
 */
import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Car, Ship,
  Wallet, Users, Briefcase, LogOut, Sun, Moon,
  Store,
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { useTheme } from '@/core/theme/ThemeContext';
import clsx from 'clsx';

interface MonetizacionLayoutProps {
  children: ReactNode;
  title: string;
}

const NAV_ITEMS = [
  { to: '/monetizacion/home',      icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/monetizacion/servicios', icon: Store,           label: 'Servicios'         },
  { to: '/monetizacion/empresas',  icon: Building2,       label: 'Empresas'          },
  { to: '/monetizacion/taxis',     icon: Car,             label: 'Taxis'             },
  { to: '/monetizacion/barcos',    icon: Ship,            label: 'Barcos'            },
  { to: '/monetizacion/monedero',  icon: Wallet,          label: 'Monedero'          },
  { to: '/monetizacion/perfiles',  icon: Users,           label: 'Perfiles Usuarios' },
  { to: '/monetizacion/negocios',  icon: Briefcase,       label: 'Perfiles Negocios' },
];

export default function MonetizacionLayout({ children, title }: MonetizacionLayoutProps) {
  const { admin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/monetizacion/login');
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800"
        aria-label="Navegación monetización"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
            <span className="text-black font-black text-sm" aria-hidden="true">💰</span>
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm text-white truncate">Monetización</p>
            <p className="text-xs text-gray-600 truncate">{admin?.role ?? 'Admin'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Menú">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300 border border-transparent',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <p className="text-xs text-gray-600 px-3 mb-2 truncate">{admin?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-800 hover:text-gray-300 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <h1 className="font-bold text-white text-sm">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              EGChat · Revenue
            </span>
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark'
                ? <Sun  className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-gray-500" />
              }
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-950" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
