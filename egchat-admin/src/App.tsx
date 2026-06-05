import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Login } from './pages/Login';
import { ExecutiveDashboard } from './pages/Dashboard/Executive';
import { FinancialDashboard } from './pages/Dashboard/Financial';
import { StrategicDashboard } from './pages/Dashboard/Strategic';
import { OperationalDashboard } from './pages/Dashboard/Operational';
import { ChatDashboard } from './pages/Dashboard/Chat';
import { WalletDashboard } from './pages/Dashboard/Wallet';
import { SecurityDashboard } from './pages/Dashboard/Security';
import { InfrastructureDashboard } from './pages/Dashboard/Infrastructure';
import { SQLiteSyncDashboard } from './pages/Dashboard/SQLiteSync';
import { AuditDashboard } from './pages/Dashboard/Audit';
import { UserManagement } from './pages/Admin/UserManagement';
import { MODULES_FOR_ROLE } from './utils/rbac';

const TITLES: Record<string, string> = {
  '/dashboard/executive':    '🏛️ Centro de Control Ejecutivo',
  '/dashboard/financial':    '💹 Dashboard Financiero',
  '/dashboard/strategic':    '🎯 Dashboard Estratégico',
  '/dashboard/operational':  'Dashboard Operacional',
  '/dashboard/chat':         'Dashboard Chat',
  '/dashboard/wallet':       'Dashboard Wallet',
  '/dashboard/security':     'Dashboard Seguridad',
  '/dashboard/infrastructure':'Dashboard Infraestructura',
  '/dashboard/sqlite-sync':  'Sincronización SQLite',
  '/dashboard/audit':        'Dashboard Auditoría',
  '/admin/users':            'Gestión de Administradores',
};

function ProtectedLayout() {
  const admin = useAuthStore(s => s.admin);
  if (!admin) return <Navigate to="/login" replace />;

  const path = window.location.pathname;
  const title = TITLES[path] || 'Admin Portal';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title={title} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/dashboard/executive"    element={<ExecutiveDashboard />} />
            <Route path="/dashboard/financial"    element={<FinancialDashboard />} />
            <Route path="/dashboard/strategic"    element={<StrategicDashboard />} />
            <Route path="/dashboard/operational"   element={<OperationalDashboard />} />
            <Route path="/dashboard/chat"          element={<ChatDashboard />} />
            <Route path="/dashboard/wallet"        element={<WalletDashboard />} />
            <Route path="/dashboard/security"      element={<SecurityDashboard />} />
            <Route path="/dashboard/infrastructure" element={<InfrastructureDashboard />} />
            <Route path="/dashboard/sqlite-sync"   element={<SQLiteSyncDashboard />} />
            <Route path="/dashboard/audit"         element={<AuditDashboard />} />
            <Route path="/admin/users"             element={<UserManagement />} />
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DefaultRedirect() {
  const role = useAuthStore(s => s.admin?.role);
  const modules = role ? MODULES_FOR_ROLE[role] : [];
  const first = modules[0];
  const routes: Record<string, string> = {
    executive:      '/dashboard/executive',
    financial:      '/dashboard/financial',
    strategic:      '/dashboard/strategic',
    operational:    '/dashboard/operational', chat: '/dashboard/chat',
    wallet:         '/dashboard/wallet', security: '/dashboard/security',
    infrastructure: '/dashboard/infrastructure', sqlite_sync: '/dashboard/sqlite-sync',
    audit:          '/dashboard/audit', admin_users: '/admin/users',
  };
  return <Navigate to={first ? (routes[first.id] || '/dashboard/operational') : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
