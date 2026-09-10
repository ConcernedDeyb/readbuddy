'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  BookOpen,
  Award,
  Sparkles,
  Users,
  ChevronRight,
  Clock,
  Inbox,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  AppNotification,
  NotificationRole,
  NotificationCategory,
} from './types';
import {
  loadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  saveNotifications,
} from './notificationData';
import {
  Card,
  SectionHeader,
  PrimaryButton,
  GhostButton,
  FONT_SERIF,
  FONT_SANS,
  FONT_MONO,
  CHALK_GREEN,
  TAN_BORDER,
  INK,
  MUTED,
} from '../_shared';

interface NotificationsSectionProps {
  role: NotificationRole;
  onNavigate: (section: string) => void;
  userId?: string;
}

export default function NotificationsSection({
  role,
  onNavigate,
  userId,
}: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshNotifs = () => {
    setNotifications(loadNotifications(role, userId));
  };

  useEffect(() => {
    refreshNotifs();
    const handleUpdate = () => refreshNotifs();
    window.addEventListener('readbuddy_notifications_updated', handleUpdate);
    return () => window.removeEventListener('readbuddy_notifications_updated', handleUpdate);
  }, [role, userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    ...(role === 'student' || role === 'teacher' ? [{ id: 'assignment', label: 'Assignments' }] : []),
    { id: 'assessment', label: 'Assessments' },
    { id: 'milestone', label: 'Milestones' },
    ...(role === 'teacher' || role === 'principal'
      ? [{ id: 'class', label: role === 'principal' ? 'Faculty & Classes' : 'Class & Roster' }]
      : []),
    { id: 'system', label: 'System' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const handleItemAction = (notif: AppNotification) => {
    markNotificationAsRead(role, notif.id, userId);
    refreshNotifs();
    if (notif.actionSection) {
      onNavigate(notif.actionSection);
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(role, userId);
    refreshNotifs();
  };

  const handleDelete = (id: string) => {
    deleteNotification(role, id, userId);
    refreshNotifs();
  };

  const handleClearAll = () => {
    clearAllNotifications(role, userId);
    refreshNotifs();
  };

  const handleRestoreDefaults = () => {
    localStorage.removeItem(`readbuddy_notifications_${role}${userId ? `_${userId.toLowerCase()}` : ''}`);
    refreshNotifs();
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-[#3D6B8A]" />;
      case 'assessment':
        return <Award className="w-4 h-4 text-[#2E7D4F]" />;
      case 'milestone':
        return <Sparkles className="w-4 h-4 text-[#E8873A]" />;
      case 'class':
        return <Users className="w-4 h-4 text-[#7A4A6B]" />;
      default:
        return <Bell className="w-4 h-4 text-[#1F4D3A]" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case 'assignment':
        return 'bg-[#E8F0F8] text-[#2C4E66] border-[#BCD4E6]';
      case 'assessment':
        return 'bg-[#E6F4EA] text-[#2E7D4F] border-[#BFE0CC]';
      case 'milestone':
        return 'bg-[#FCEDDE] text-[#B4602E] border-[#F0C99A]';
      case 'class':
        return 'bg-[#F3EAF0] text-[#5C3650] border-[#DFC5D6]';
      default:
        return 'bg-[#EBF2EE] text-[#1F4D3A] border-[#C8DBD0]';
    }
  };

  const accentColor =
    role === 'student'
      ? '#E8873A'
      : role === 'principal'
      ? '#4A3D6B'
      : role === 'admin'
      ? '#7A4A6B'
      : '#3D6B8A';

  const subtitle =
    role === 'student'
      ? 'Stay updated on reading assignments, evaluation marks, and milestone streaks.'
      : role === 'principal'
      ? 'Monitor faculty submissions, school-wide reading diagnostics, and institutional governance alerts.'
      : role === 'admin'
      ? 'Monitor system health, account audit alerts, and platform operational updates.'
      : 'Monitor student assessment submissions, reading level alerts, and class milestones.';

  return (
    <div className="space-y-6 rb-fade-in-up" style={{ fontFamily: FONT_SANS }}>
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionHeader
          title="Notification Center"
          subtitle={subtitle}
          accent={accentColor}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-[#FFFDF8] hover:bg-[#FCEDDE] text-[#1F4D3A] font-bold text-xs border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-[#FFFDF8] hover:bg-red-50 text-red-700 font-bold text-xs border-2 border-red-700 shadow-[2px_2px_0px_#B91C1C] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-3 py-1.5 rounded-xl bg-[#FFFDF8] hover:bg-[#F4EDE0] text-[#1F4D3A] font-bold text-xs border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Summary Stat Banners ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Alerts</span>
          <div className="text-2xl font-bold mt-1" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            {notifications.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A]">
          <span className="text-xs font-semibold text-[#B4602E] uppercase tracking-wide">Unread</span>
          <div className="text-2xl font-bold mt-1 text-[#E8873A]" style={{ fontFamily: FONT_SERIF }}>
            {unreadCount}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#FFFDF8] border-2 border-[#1F4D3A] shadow-[3px_3px_0px_#1F4D3A]">
          <span className="text-xs font-semibold text-[#2E7D4F] uppercase tracking-wide">Completed / Read</span>
          <div className="text-2xl font-bold mt-1 text-[#2E7D4F]" style={{ fontFamily: FONT_SERIF }}>
            {notifications.length - unreadCount}
          </div>
        </div>
      </div>

      {/* ─── Controls & Filter Toolbar ─── */}
      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#1F4D3A]/30 focus:outline-none focus:border-[#1F4D3A] focus:ring-1 focus:ring-[#1F4D3A]"
            />
          </div>

          {/* Unread Only Toggle */}
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
              unreadOnly
                ? 'bg-[#1F4D3A] text-white shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                : 'bg-white text-[#1F4D3A] border border-[#1F4D3A]/30 hover:bg-[#F3EFE6]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Unread Only</span>
          </button>
        </div>

        {/* Category Pills (horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1F4D3A] text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)] font-bold'
                    : 'bg-[#F4EDE0] text-gray-700 hover:bg-[#EBE2D0] border border-black/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ─── Notification List ─── */}
      {filteredNotifications.length === 0 ? (
        <Card className="py-14 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-3xl bg-[#F4EDE0] border-2 border-[#DED2B4] flex items-center justify-center mb-3 text-gray-400">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}>
            No notifications found
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            {unreadOnly
              ? 'No unread alerts matching your active filter criteria.'
              : 'Your notification center is completely clear.'}
          </p>
          {notifications.length === 0 && (
            <PrimaryButton accent={accentColor} onClick={handleRestoreDefaults}>
              Restore Sample Alerts
            </PrimaryButton>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              hoverable
              className={`transition-all ${
                !notif.read ? 'border-l-4 border-l-[#E8873A] bg-[#FFFDF8]' : 'bg-[#FAF7F0]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Left: icon + content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border shadow-[1px_1px_0px_rgba(0,0,0,0.06)] mt-0.5 ${getCategoryBadgeClass(
                      notif.category
                    )}`}
                  >
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border font-mono ${getCategoryBadgeClass(
                          notif.category
                        )}`}
                      >
                        {notif.category}
                      </span>
                      {!notif.read && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FCEDDE] text-[#B4602E] border border-[#F0C99A] font-mono">
                          New
                        </span>
                      )}
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.timestamp}
                      </span>
                    </div>

                    <h4
                      className="text-sm sm:text-base font-bold mb-1"
                      style={{ fontFamily: FONT_SERIF, color: !notif.read ? CHALK_GREEN : INK }}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto justify-between sm:justify-end">
                  {notif.actionLabel && notif.actionSection && (
                    <button
                      type="button"
                      onClick={() => handleItemAction(notif)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FCEDDE] text-[#1F4D3A] text-xs font-bold border border-[#1F4D3A]/30 shadow-[1.5px_1.5px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{notif.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => {
                          markNotificationAsRead(role, notif.id, userId);
                          refreshNotifs();
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#1F4D3A] hover:bg-gray-100 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(notif.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
