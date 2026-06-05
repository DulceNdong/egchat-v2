import React, { useEffect, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { adminAPI } from '../../api/adminClient';
import { ROLE_LABELS, ROLE_COLORS, type AdminRole } from '../../utils/rbac';
import { fmtDate } from '../../utils/formatters';

export const UserManagement: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>(MOCK_ADMINS);
  const [form, setForm] = useState({ email: '', role: 'support' as AdminRole });
  const [msg, setMsg] = useState('');
  const ROLES: AdminRole[] = ['super_admin','operations','support','finance','security','auditor'];

  const load = () => adminAPI.getAdmins().then(setAdmins).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createAdmin({ ...form, password: 'TempPass123!' });
      setMsg('✅ Admin creado. Se le enviará email con contraseña temporal.');
      setForm({ email: '', role: 'support' });
      load();
    } catch (err: any) { setMsg(`❌ ${err.message}`); }
  };

  const deactivate = async (id: string, email: string) => {
    if (!confirm(`¿Desactivar ${email}?`)) return;
    try { await adminAPI.deactivateAdmin(id); load(); } catch {}
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', marginBottom: '20px' }}>👥 Gestión de Administradores</h2>

      {/* Crear admin */}
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', marginBottom: '24px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '14px', textTransform: 'uppercase' }}>Nuevo Administrador</div>
        <form onSubmit={create} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="nuevo@egchat.gq"
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Rol</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as AdminRole }))}
              style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <button type="submit" style={{ background: 'rgba(0,200,160,0.15)', border: '1px solid rgba(0,200,160,0.3)', borderRadius: '8px', padding: '9px 18px', color: '#00c8a0', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Crear Admin
          </button>
        </form>
        {msg && <div style={{ marginTop: '10px', fontSize: '13px', color: msg.startsWith('✅') ? '#22c55e' : '#ef4444' }}>{msg}</div>}
      </div>

      {/* Lista admins */}
      <div style={{ background: '#1e293b', borderRadius: '14px', padding: '18px', border: '1px solid #334155' }}>
        <DataTable
          columns={[
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Rol', render: r => (
              <span style={{ fontSize: '11px', fontWeight: '700', color: ROLE_COLORS[r.role as AdminRole], background: `${ROLE_COLORS[r.role as AdminRole]}20`, padding: '2px 8px', borderRadius: '10px' }}>
                {ROLE_LABELS[r.role as AdminRole]}
              </span>
            )},
            { key: 'last_login', label: 'Último login', render: r => r.last_login ? fmtDate(r.last_login) : 'Nunca' },
            { key: 'is_active', label: 'Estado', render: r => <StatusBadge status={r.is_active ? 'ok' : 'down'} label={r.is_active ? 'Activo' : 'Inactivo'} /> },
            { key: 'actions', label: '', render: r => (
              <button onClick={() => deactivate(r.id, r.email)} disabled={r.role === 'super_admin'}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '4px 10px', color: '#ef4444', fontSize: '11px', cursor: 'pointer', opacity: r.role === 'super_admin' ? 0.3 : 1 }}>
                Desactivar
              </button>
            )},
          ]}
          data={admins}
        />
      </div>
    </div>
  );
};

const MOCK_ADMINS = [
  { id: '1', email: 'superadmin@egchat.gq', role: 'super_admin', last_login: new Date().toISOString(), is_active: true },
  { id: '2', email: 'ops@egchat.gq', role: 'operations', last_login: new Date(Date.now() - 3600000).toISOString(), is_active: true },
  { id: '3', email: 'finance@egchat.gq', role: 'finance', last_login: null, is_active: true },
];
