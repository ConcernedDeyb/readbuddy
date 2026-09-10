'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  BookOpen,
  Award,
  Sparkles,
  Users,
  X,
  ChevronRight,
  Clock,
  Inbox,
  AlertCircle,
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
} from './notificationData';
import {
  FONT_SERIF,
  FONT_SANS,
  FONT_MONO,
  CHALK_GREEN,
  CREAM,
  INK,
  MUTED,
  TAN_BORDER,
} from '../_shared';

interface NotificationNavProps {
  role: NotificationRole;
  onSectionChange: (section: string) => void;
  variant?: 'desktop' | 'mobile';
  userId?: string;
}

export default function NotificationNav({
  role,
  onSectionChange,
  variant = 'desktop',
  userId,
}: NotificationNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const refreshNotifs = () => {
    setNotifications(loadNotifications(role, userId));
  };

  useEffect(() => {
    refreshNotifs();
    const handleUpdate = () => refreshNotifs();
    window.addEventListener('readbuddy_notifications_updated', handleUpdate);
    return () => window.removeEventListener('readbuddy_notifications_updated', handleUpdate);
  }, [role, userId]);

  // Click outside to close (Desktop popover)
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const unreadList = notifications.filter((n) => !n.read);
  const unreadCount = unreadList.length;

  const displayedNotifications = filter === 'unread' ? unreadList : notifications;

  const handleItemClick = (notif: AppNotification) => {
    markNotificationAsRead(role, notif.id, userId);
    refreshNotifs();
    if (notif.actionSection) {
      onSectionChange(notif.actionSection);
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsAsRead(role, userId);
    refreshNotifs();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(role, id, userId);
    refreshNotifs();
  };

  const handleClearAll = () => {
    clearAllNotifications(role, userId);
    refreshNotifs();
  };

  const handleViewAllSection = () => {
    setIsOpen(false);
    onSectionChange('notifications');
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'assignment':
        return <BookOpen className="w-3.5 h-3.5 text-[#3D6B8A]" />;
      case 'assessment':
        return <Award className="w-3.5 h-3.5 text-[#2E7D4F]" />;
      case 'milestone':
        return <Sparkles className="w-3.5 h-3.5 text-[#E8873A]" />;
      case 'class':
        return <Users className="w-3.5 h-3.5 text-[#7A4A6B]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#1F4D3A]" />;
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

  return (
    <div className="relative inline-block">
      {/* ─── Trigger Button ─── */}
      {variant === 'mobile' ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl text-[#FBF7EE] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/10 flex items-center justify-center"
          title="Notifications & Alerts"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#E8873A] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#1F4D3A] shadow-[1px_1px_0px_#1F4D3A] font-mono animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          id="tour-notifications-nav"
          data-tour="notifications-nav"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 rounded-xl bg-[#FFFDF8] hover:bg-[#FCEDDE] text-[#1F4D3A] font-bold text-xs font-sans border-2 border-[#1F4D3A] shadow-[2px_2px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1F4D3A] transition-all flex items-center gap-1.5 cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E8873A] text-white border border-[#1F4D3A] font-mono leading-tight">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ─── Notification Dropdown (Desktop: Absolute Floating Popover | Mobile: Fixed Bottom Sheet) ─── */}
      {isOpen && (
        <>
          {/* Mobile Backdrop (only in mobile variant) */}
          {variant === 'mobile' && (
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            ref={popoverRef}
            className={
              variant === 'mobile'
                ? 'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-[#FFFDF8] rounded-t-3xl border-t-3 border-x-3 border-[#1F4D3A] shadow-[0_-8px_30px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden'
                : 'absolute right-0 top-full mt-2 z-50 w-96 max-h-[520px] bg-[#FFFDF8] rounded-2xl border-2 border-[#1F4D3A] shadow-[4px_4px_0px_#1F4D3A] flex flex-col overflow-hidden'
            }
            style={{ fontFamily: FONT_SANS }}
          >
            {/* Mobile Grab Handle Bar */}
            {variant === 'mobile' && (
              <div className="w-12 h-1.5 bg-[#1F4D3A]/25 rounded-full mx-auto mt-2 mb-1 shrink-0" />
            )}

            {/* Header */}
            <div
              className="p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 bg-[#FFFDF8]"
              style={{ borderColor: TAN_BORDER }}
            >
              <div className="flex items-center gap-2">
                <h3
                  className="text-sm sm:text-base font-bold flex items-center gap-1.5"
                  style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}
                >
                  <Bell className="w-4 h-4 text-[#1F4D3A]" />
                  <span>Notifications</span>
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FCEDDE] text-[#B4602E] border border-[#F0C99A] font-mono">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-[#1F4D3A] hover:text-[#E8873A] flex items-center gap-1 cursor-pointer transition-colors p-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close notifications"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div
              className="px-3.5 py-2 border-b flex items-center justify-between gap-2 shrink-0 bg-[#FAF7F0]"
              style={{ borderColor: TAN_BORDER }}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-[#1F4D3A] text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.2)]'
                      : 'bg-white/80 text-[#1F4D3A] hover:bg-white border border-[#1F4D3A]/20'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filter === 'unread'
                      ? 'bg-[#1F4D3A] text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.2)]'
                      : 'bg-white/80 text-[#1F4D3A] hover:bg-white border border-[#1F4D3A]/20'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Notifications Scrollable List */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 max-h-[50vh] sm:max-h-[360px]">
              {displayedNotifications.length === 0 ? (
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4EDE0] border border-[#DED2B4] flex items-center justify-center mb-3 text-gray-400">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4
                    className="text-sm font-bold mb-1"
                    style={{ fontFamily: FONT_SERIF, color: CHALK_GREEN }}
                  >
                    You're all caught up!
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs">
                    {filter === 'unread'
                      ? 'No unread notifications at the moment.'
                      : 'No notifications right now. Alerts for tests, streaks, and scores will show here.'}
                  </p>
                </div>
              ) : (
                displayedNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3.5 sm:p-3 hover:bg-[#F9F5EB] active:bg-[#F3EFE6] transition-colors cursor-pointer flex gap-3 relative group ${
                      !notif.read ? 'bg-[#FCFAF5]' : ''
                    }`}
                  >
                    {/* Unread Accent Bar */}
                    {!notif.read && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#E8873A] rounded-r-full" />
                    )}

                    {/* Category Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border shadow-[1px_1px_0px_rgba(0,0,0,0.05)] mt-0.5 ${getCategoryBadgeClass(
                        notif.category
                      )}`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <h4
                          className={`text-xs leading-snug truncate ${
                            !notif.read ? 'font-bold text-[#1F4D3A]' : 'font-semibold text-gray-800'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span
                          className="text-[10px] text-gray-400 shrink-0 font-mono flex items-center gap-0.5"
                          title={notif.timestamp}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mb-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        {notif.actionLabel && notif.actionSection ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3D6B8A] hover:text-[#2C4E66] transition-colors group-hover:underline">
                            <span>{notif.actionLabel}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(role, notif.id, userId);
                                refreshNotifs();
                              }}
                              className="p-1 text-gray-400 hover:text-[#1F4D3A] hover:bg-black/5 rounded transition-colors"
                              title="Mark read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, notif.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="p-3 border-t bg-[#FAF7F0] flex items-center justify-between gap-2 shrink-0"
              style={{ borderColor: TAN_BORDER }}
            >
              <button
                type="button"
                onClick={handleViewAllSection}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FCEDDE] text-[#1F4D3A] text-xs font-bold border border-[#1F4D3A]/30 shadow-[1.5px_1.5px_0px_#1F4D3A] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Full Notification Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
