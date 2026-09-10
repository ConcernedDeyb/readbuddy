export type NotificationCategory = 'assignment' | 'assessment' | 'milestone' | 'system' | 'class';

export type NotificationRole = 'student' | 'teacher' | 'admin' | 'principal';

export interface AppNotification {
  id: string;
  role: NotificationRole;
  title: string;
  message: string;
  timestamp: string;
  createdAt: number;
  read: boolean;
  category: NotificationCategory;
  actionSection?: string;
  actionLabel?: string;
  priority?: 'low' | 'normal' | 'high';
}
