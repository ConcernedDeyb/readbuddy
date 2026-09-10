import { AppNotification, NotificationRole } from './types';

const DEFAULT_STUDENT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-st-1',
    role: 'student',
    title: 'New Phil-IRI Reading Test Assigned',
    message: 'Teacher Maria assigned "The Proud Little Dragonfly" for your reading evaluation. Practice oral reading and comprehension.',
    timestamp: '15m ago',
    createdAt: Date.now() - 15 * 60 * 1000,
    read: false,
    category: 'assignment',
    actionSection: 'tests',
    actionLabel: 'Start Test Now',
    priority: 'high',
  },
  {
    id: 'notif-st-2',
    role: 'student',
    title: 'Oral Reading Assessment Graded',
    message: 'You scored 94% on "Ang Alamat ng Pinya"! Your reading tier is now evaluated at Independent Level.',
    timestamp: '2h ago',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    read: false,
    category: 'assessment',
    actionSection: 'history',
    actionLabel: 'View Diagnostics',
    priority: 'normal',
  },
  {
    id: 'notif-st-3',
    role: 'student',
    title: 'Reading Streak Milestone Reached',
    message: 'Fantastic effort! You maintained a 4-day active reading streak this week. Keep up the daily reading habit!',
    timestamp: 'Yesterday',
    createdAt: Date.now() - 26 * 60 * 60 * 1000,
    read: false,
    category: 'milestone',
    actionSection: 'overview',
    actionLabel: 'View Progress',
    priority: 'normal',
  },
  {
    id: 'notif-st-4',
    role: 'student',
    title: 'Buddy AI Vocabulary Flashcards Ready',
    message: 'Buddy AI generated 5 vocabulary practice cards in your Scholar Notebook to review tricky words.',
    timestamp: '2d ago',
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
    read: true,
    category: 'system',
    actionSection: 'notebook',
    actionLabel: 'Open Notebook',
    priority: 'low',
  },
  {
    id: 'notif-st-5',
    role: 'student',
    title: 'Reading Session Audio Saved',
    message: 'Your oral reading audio recording was saved and phoneme alignment computed successfully.',
    timestamp: '3d ago',
    createdAt: Date.now() - 72 * 60 * 60 * 1000,
    read: true,
    category: 'system',
    actionSection: 'history',
    actionLabel: 'Review History',
    priority: 'low',
  },
];

const DEFAULT_TEACHER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-tc-1',
    role: 'teacher',
    title: 'Student Reading Assessment Submitted',
    message: 'Sofia Dela Cruz completed Phil-IRI passage "The Honest Woodcutter" (Word Recognition: 92%, Comprehension: 85%).',
    timestamp: '10m ago',
    createdAt: Date.now() - 10 * 60 * 1000,
    read: false,
    category: 'assessment',
    actionSection: 'tests',
    actionLabel: 'Review Submission',
    priority: 'high',
  },
  {
    id: 'notif-tc-2',
    role: 'teacher',
    title: 'Frustration Tier Intervention Alert',
    message: 'Juan Santos achieved 62% accuracy on oral reading. Targeted intervention & practice passage recommended.',
    timestamp: '1h ago',
    createdAt: Date.now() - 60 * 60 * 1000,
    read: false,
    category: 'class',
    actionSection: 'students',
    actionLabel: 'Inspect Student',
    priority: 'high',
  },
  {
    id: 'notif-tc-3',
    role: 'teacher',
    title: 'New Student Enrolled in Section',
    message: 'Mark Bautista was enrolled in Grade 4 - St. Aloysius.',
    timestamp: '3h ago',
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    read: false,
    category: 'class',
    actionSection: 'classes',
    actionLabel: 'View Class Roster',
    priority: 'normal',
  },
  {
    id: 'notif-tc-4',
    role: 'teacher',
    title: 'Class Oral Reading Benchmark',
    message: 'Grade 4 - St. Aloysius reached an 86% average accuracy benchmark across all Phil-IRI passages!',
    timestamp: 'Yesterday',
    createdAt: Date.now() - 25 * 60 * 60 * 1000,
    read: true,
    category: 'milestone',
    actionSection: 'classes',
    actionLabel: 'View Classes',
    priority: 'normal',
  },
  {
    id: 'notif-tc-5',
    role: 'teacher',
    title: 'Acoustic Model Cache Ready',
    message: 'VRAM-optimized Whisper & Phoneme alignment model is initialized and ready for oral reading diagnostics.',
    timestamp: '2d ago',
    createdAt: Date.now() - 50 * 60 * 60 * 1000,
    read: true,
    category: 'system',
    actionSection: 'overview',
    actionLabel: 'System Status',
    priority: 'low',
  },
];

const DEFAULT_PRINCIPAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-pr-1',
    role: 'principal',
    title: 'School-Wide Phil-IRI Diagnostics Compiled',
    message: 'Grade 7 cohort oral reading results compiled: 88.4% average accuracy. 42 students assessed at Independent reader tier.',
    timestamp: '25m ago',
    createdAt: Date.now() - 25 * 60 * 1000,
    read: false,
    category: 'assessment',
    actionSection: 'students',
    actionLabel: 'View Student Progress',
    priority: 'high',
  },
  {
    id: 'notif-pr-2',
    role: 'principal',
    title: 'Faculty Roster & Class Assignment Active',
    message: 'Teacher Jhon Mark Durano actively managing Section St. John (Grade 7). All student profiles verified.',
    timestamp: '2h ago',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    read: false,
    category: 'class',
    actionSection: 'teachers',
    actionLabel: 'Manage Faculty',
    priority: 'normal',
  },
  {
    id: 'notif-pr-3',
    role: 'principal',
    title: 'DepEd Phil-IRI Remedial Intervention Alert',
    message: '3 students in Section St. John evaluated in Frustration reading tier (<90% word accuracy). Targeted phonics intervention recommended.',
    timestamp: '5h ago',
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    read: false,
    category: 'assessment',
    actionSection: 'students',
    actionLabel: 'Inspect Students',
    priority: 'high',
  },
  {
    id: 'notif-pr-4',
    role: 'principal',
    title: 'SMCC Institutional Literacy Milestone',
    message: 'Basic education students completed over 500 guided oral reading minutes this term across all classes.',
    timestamp: 'Yesterday',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    category: 'milestone',
    actionSection: 'overview',
    actionLabel: 'Executive Overview',
    priority: 'normal',
  },
  {
    id: 'notif-pr-5',
    role: 'principal',
    title: 'Institutional Audit & Faculty Governance Log',
    message: 'Authentication activity logs and faculty credentials audit generated successfully.',
    timestamp: '2d ago',
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
    read: true,
    category: 'system',
    actionSection: 'logs',
    actionLabel: 'Review School Logs',
    priority: 'low',
  },
];

const DEFAULT_ADMIN_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-ad-1',
    role: 'admin',
    title: 'ASR VRAM Telemetry Normal',
    message: 'Whisper local model memory consumption stable at 1,400 MB / 8,192 MB budget.',
    timestamp: '30m ago',
    createdAt: Date.now() - 30 * 60 * 1000,
    read: false,
    category: 'system',
    actionSection: 'overview',
    actionLabel: 'View Telemetry',
    priority: 'normal',
  },
  {
    id: 'notif-ad-2',
    role: 'admin',
    title: 'PostgreSQL Schema & Database Sync',
    message: 'Database tables and dynamic seed schemas synchronized successfully with 0 errors.',
    timestamp: '3h ago',
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    read: false,
    category: 'system',
    actionSection: 'logs',
    actionLabel: 'View System Logs',
    priority: 'low',
  },
  {
    id: 'notif-ad-3',
    role: 'admin',
    title: 'Institutional Domain Gateway Active',
    message: 'Institutional domain @smccnasipit.edu.ph enforcement active for all authentications.',
    timestamp: 'Yesterday',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    category: 'system',
    actionSection: 'logs',
    actionLabel: 'Inspect Auth Logs',
    priority: 'low',
  },
];

export function getNotificationStorageKey(role: NotificationRole, userId?: string): string {
  const safeId = userId ? `_${userId.toLowerCase()}` : '';
  return `readbuddy_notifications_${role}${safeId}`;
}

export function loadNotifications(role: NotificationRole, userId?: string): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getNotificationStorageKey(role, userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Return role default seed if empty or never initialized
    const defaults =
      role === 'student'
        ? DEFAULT_STUDENT_NOTIFICATIONS
        : role === 'principal'
        ? DEFAULT_PRINCIPAL_NOTIFICATIONS
        : role === 'admin'
        ? DEFAULT_ADMIN_NOTIFICATIONS
        : DEFAULT_TEACHER_NOTIFICATIONS;
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  } catch {
    return role === 'student'
      ? DEFAULT_STUDENT_NOTIFICATIONS
      : role === 'principal'
      ? DEFAULT_PRINCIPAL_NOTIFICATIONS
      : role === 'admin'
      ? DEFAULT_ADMIN_NOTIFICATIONS
      : DEFAULT_TEACHER_NOTIFICATIONS;
  }
}

export function saveNotifications(role: NotificationRole, notifs: AppNotification[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getNotificationStorageKey(role, userId);
    localStorage.setItem(key, JSON.stringify(notifs));
    dispatchNotificationsUpdated();
  } catch (e) {
    console.error('Error saving notifications', e);
  }
}

export function markNotificationAsRead(role: NotificationRole, id: string, userId?: string): AppNotification[] {
  const current = loadNotifications(role, userId);
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(role, updated, userId);
  return updated;
}

export function markAllNotificationsAsRead(role: NotificationRole, userId?: string): AppNotification[] {
  const current = loadNotifications(role, userId);
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(role, updated, userId);
  return updated;
}

export function deleteNotification(role: NotificationRole, id: string, userId?: string): AppNotification[] {
  const current = loadNotifications(role, userId);
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(role, updated, userId);
  return updated;
}

export function clearAllNotifications(role: NotificationRole, userId?: string): AppNotification[] {
  saveNotifications(role, [], userId);
  return [];
}

export function dispatchNotificationsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('readbuddy_notifications_updated'));
  }
}
