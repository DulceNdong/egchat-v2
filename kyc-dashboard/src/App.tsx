import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/core/auth/AuthContext';
import { ThemeProvider } from '@/core/theme/ThemeContext';
import { SessionGuard } from '@/core/session/SessionGuard';
import { RoleGuard } from '@/core/auth/RoleGuard';

// BANGE pages
import BangeLogin    from '@/apps/bange/pages/BangeLogin';
import BangeQueue    from '@/apps/bange/pages/BangeQueue';
import BangeCaseDetail from '@/apps/bange/pages/BangeCaseDetail';
import BangeReports  from '@/apps/bange/pages/BangeReports';

// Company pages
import CompanyLogin  from '@/apps/company/pages/CompanyLogin';
import CompanyHome   from '@/apps/company/pages/CompanyHome';
import CompanyUsers  from '@/apps/company/pages/CompanyUsers';
import CompanyUserDetail from '@/apps/company/pages/CompanyUserDetail';
import CompanyAML    from '@/apps/company/pages/CompanyAML';
import CompanySAR    from '@/apps/company/pages/CompanySAR';
import CompanySARDetail from '@/apps/company/pages/CompanySARDetail';
import CompanyReports from '@/apps/company/pages/CompanyReports';

// Root redirect based on entity
import RootRedirect  from '@/shared/components/RootRedirect';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SessionGuard>
            <Routes>
              {/* Root: redirige según entidad del admin */}
              <Route path="/" element={<RootRedirect />} />

              {/* ─── BANGE ─────────────────────────────── */}
              <Route path="/bange/login" element={<BangeLogin />} />
              <Route path="/bange" element={
                <RoleGuard entities={['BANGE']} />
              }>
                <Route path="queue"         element={<BangeQueue />} />
                <Route path="case/:id"      element={<BangeCaseDetail />} />
                <Route path="reports"       element={<BangeReports />} />
                <Route index element={<Navigate to="queue" replace />} />
              </Route>

              {/* ─── EMPRESA ───────────────────────────── */}
              <Route path="/company/login" element={<CompanyLogin />} />
              <Route path="/company" element={
                <RoleGuard entities={['OUR_COMPANY']} />
              }>
                <Route path="home"          element={<CompanyHome />} />
                <Route path="users"         element={<CompanyUsers />} />
                <Route path="users/:id"     element={<CompanyUserDetail />} />
                <Route path="aml"           element={<CompanyAML />} />
                <Route path="sar"           element={<CompanySAR />} />
                <Route path="sar/:id"       element={<CompanySARDetail />} />
                <Route path="reports"       element={<CompanyReports />} />
                <Route index element={<Navigate to="home" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SessionGuard>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
