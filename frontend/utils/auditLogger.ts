// Centralized Audit & Activity Logger for ReadBuddy

export interface AuthLogEntry {
  id?: string;
  timestamp?: string;
  identifier: string;
  display_name: string;
  role: 'student' | 'teacher' | 'admin';
  method: 'Local Password' | 'SMCC Google SSO' | 'Microsoft 365 SAML' | 'Session Token';
  status: 'SUCCESS' | 'FAILED' | 'PASSWORD_RESET' | 'APPROVED' | 'REVOKED' | 'CREATED' | 'UPDATED' | 'DELETED';
  ip_address?: string;
  details: string;
}

export interface ActivityEntry {
  id?: string;
  timestamp?: string;
  user_name: string;
  role: 'student' | 'teacher' | 'admin';
  action: string;
  details: string;
  badge?: string;
}

export function recordAuthLog(entry: AuthLogEntry) {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('readbuddy_auth_logs');
    const logs: AuthLogEntry[] = saved ? JSON.parse(saved) : [];

    const newLog: AuthLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      identifier: entry.identifier,
      display_name: entry.display_name,
      role: entry.role,
      method: entry.method || 'Local Password',
      status: entry.status,
      ip_address: entry.ip_address || '192.168.1.100 (SMCC LAN)',
      details: entry.details,
    };

    // Prepend to show latest first, keep max 100 entries
    const updated = [newLog, ...logs.slice(0, 99)];
    localStorage.setItem('readbuddy_auth_logs', JSON.stringify(updated));
    window.dispatchEvent(new Event('readbuddy_auth_logs_updated'));
  } catch (e) {
    console.error('Failed to record auth log:', e);
  }
}

export function recordActivity(entry: ActivityEntry) {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('readbuddy_activities');
    const activities: ActivityEntry[] = saved ? JSON.parse(saved) : [];

    const newActivity: ActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      user_name: entry.user_name,
      role: entry.role,
      action: entry.action,
      details: entry.details,
      badge: entry.badge || (entry.role === 'admin' ? 'Admin' : entry.role === 'teacher' ? 'Faculty' : 'Learner'),
    };

    const updated = [newActivity, ...activities.slice(0, 99)];
    localStorage.setItem('readbuddy_activities', JSON.stringify(updated));
    window.dispatchEvent(new Event('readbuddy_activity_updated'));
  } catch (e) {
    console.error('Failed to record activity:', e);
  }
}
