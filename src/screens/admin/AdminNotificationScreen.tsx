import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Megaphone,
  TrendingUp,
  Hand,
  RotateCcw,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle, EmptyState } from '../../components/ui';
import type { NotificationKind } from '../../types';
import type { LucideIcon } from 'lucide-react';

const KIND_META: Record<NotificationKind, { icon: LucideIcon; color: string }> = {
  reservation_new: { icon: Clock, color: 'bg-sky-100 text-sky-700' },
  reservation_approved: { icon: CheckCircle2, color: 'bg-volt-100 text-volt-700' },
  reservation_rejected: { icon: XCircle, color: 'bg-rose-100 text-rose-600' },
  reservation_cancelled: { icon: RotateCcw, color: 'bg-slate-100 text-slate-600' },
  waiting_promoted: { icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
  waiting_timeout: { icon: Clock, color: 'bg-rose-100 text-rose-600' },
  matching_new: { icon: Users, color: 'bg-navy-100 text-navy-700' },
  matching_approved: { icon: Hand, color: 'bg-volt-100 text-volt-700' },
  matching_completed: { icon: CheckCircle2, color: 'bg-volt-100 text-volt-700' },
  notice_new: { icon: Megaphone, color: 'bg-clay-100 text-clay-500' },
};

export function AdminNotificationScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead, getUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="알림 로그"
        subtitle="발송된 Push 알림 히스토리"
        right={
          <div className="flex items-center gap-2">
            <span className="chip bg-rose-100 text-rose-600">{unreadCount} 안 읽음</span>
            <button onClick={markAllNotificationsRead} className="chip bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
              <CheckCheck size={12} /> 전체 읽음
            </button>
          </div>
        }
      />

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`chip transition ${filter === 'all' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          전체 ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`chip transition ${filter === 'unread' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          안 읽음 ({unreadCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Bell size={28} />} title="알림 내역이 없어요" />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = KIND_META[n.kind];
            const Icon = meta.icon;
            const targetUser = n.targetUserId ? getUser(n.targetUserId) : null;
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`card w-full p-4 flex items-start gap-3 text-left transition ${
                  n.read ? 'opacity-60' : 'hover:border-navy-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy-900 text-sm">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString('ko-KR')}
                    </span>
                    {targetUser && (
                      <span className="text-[10px] text-slate-400">· {targetUser.name}</span>
                    )}
                  </div>
                </div>
                {n.read && <Check size={16} className="text-slate-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
