import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Vote,
  Hammer,
  Wallet,
  Info,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import type { Notification } from '../../shared/types';
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_PRIORITY_COLORS } from '../../shared/types';
import api from '../lib/apiClient';
import { useUIStore } from '../store/ui';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS = {
  vote_result: Vote,
  progress_node: Hammer,
  payment_reminder: Wallet,
  system: Info,
} as const;

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const currentHouseholdId = useUIStore((s) => s.currentHouseholdId);
  const setHouseholdId = useUIStore((s) => s.setCurrentHouseholdId);
  const showToast = useUIStore((s) => s.showToast);

  const householdId = currentHouseholdId || 'demo-household';

  useEffect(() => {
    if (!currentHouseholdId) {
      setHouseholdId('demo-household');
    }
  }, [currentHouseholdId, setHouseholdId]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.getUnreadCount(householdId);
      setUnreadCount(res.count);
    } catch (e) {
      console.error('[notif] fetch count failed', e);
    }
  }, [householdId]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getNotifications(householdId, { limit: 50 });
      setNotifications(list);
    } catch (e) {
      console.error('[notif] fetch list failed', e);
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleMarkAsRead(n: Notification) {
    if (n.readBy.includes(householdId)) return;
    try {
      await api.markNotificationRead(n.id, householdId);
      setNotifications((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, readBy: [...x.readBy, householdId] } : x
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('[notif] mark read failed', e);
    }
  }

  async function handleMarkAll() {
    if (unreadCount === 0) return;
    try {
      const res = await api.markAllNotificationsRead(householdId);
      setNotifications((prev) =>
        prev.map((x) =>
          x.readBy.includes(householdId) ? x : { ...x, readBy: [...x.readBy, householdId] }
        )
      );
      setUnreadCount(0);
      showToast(res.message, 'success');
    } catch (e) {
      console.error('[notif] mark all failed', e);
    }
  }

  function handleNotificationClick(n: Notification) {
    handleMarkAsRead(n);
    setOpen(false);
    if (n.proposalId) {
      navigate(`/proposals/${n.proposalId}`);
    }
  }

  function formatTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHr < 24) return `${diffHr}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return date.toLocaleDateString('zh-CN');
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost relative"
        aria-label="消息通知"
      >
        <Bell className={cn('w-4 h-4 transition-colors', open && 'text-primary-600')} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-slide-up z-[60]"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-slate-800">消息通知</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 text-xs font-semibold">
                  {unreadCount}条未读
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMarkAll}
                disabled={unreadCount === 0}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  unreadCount > 0
                    ? 'text-primary-600 hover:bg-primary-50'
                    : 'text-slate-400 cursor-not-allowed'
                )}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                全部已读
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <span className="text-sm text-slate-500">加载中...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Trash2 className="w-7 h-7" />
                </div>
                <p className="text-sm">暂无消息通知</p>
                <p className="text-xs text-slate-300">新消息将在这里显示</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  const isUnread = !n.readBy.includes(householdId);
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          'w-full text-left px-5 py-4 transition-all group',
                          isUnread ? 'bg-primary-50/40 hover:bg-primary-50' : 'hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                              NOTIFICATION_PRIORITY_COLORS[n.priority]
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-semibold text-slate-800', isUnread && 'text-slate-900')}>
                                  {n.title}
                                </span>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">
                                {formatTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">
                              {n.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                                {NOTIFICATION_TYPE_LABELS[n.type]}
                              </span>
                              <span className="inline-flex items-center text-[11px] text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                查看详情
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/proposals');
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-primary-600 font-medium transition-colors"
              >
                查看全部提案 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
