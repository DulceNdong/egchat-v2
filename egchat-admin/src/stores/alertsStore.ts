import { create } from 'zustand';

export interface AdminAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  module: string;
  title: string;
  description?: string;
  created_at: string;
  is_resolved: boolean;
}

interface AlertsState {
  alerts: AdminAlert[];
  unreadCount: number;
  addAlert: (alert: AdminAlert) => void;
  resolveAlert: (id: string) => void;
  markAllRead: () => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) =>
    set((s) => ({
      alerts: [alert, ...s.alerts].slice(0, 100),
      unreadCount: s.unreadCount + (alert.severity === 'critical' ? 1 : 0),
    })),

  resolveAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, is_resolved: true } : a)),
    })),

  markAllRead: () => set({ unreadCount: 0 }),
}));
