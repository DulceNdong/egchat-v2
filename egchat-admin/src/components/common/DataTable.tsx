import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, loading, emptyMessage = 'Sin datos' }: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {columns.map((col) => (
              <th key={String(col.key)} style={{
                padding: '10px 14px', textAlign: 'left', fontSize: '11px',
                fontWeight: '700', color: '#64748b', textTransform: 'uppercase',
                letterSpacing: '0.5px', borderBottom: '1px solid #334155',
                width: col.width,
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Cargando...</td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {columns.map((col) => (
                  <td key={String(col.key)} style={{ padding: '10px 14px', fontSize: '13px', color: '#e2e8f0' }}>
                    {col.render ? col.render(row) : row[col.key as string]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
