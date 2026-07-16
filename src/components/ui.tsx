import { type ReactNode } from 'react';
import { STATUS_META } from '../types';
import type { ReservationStatus, NoticeType } from '../types';
import { NOTICE_META } from '../types';

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`chip ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function NoticeBadge({ type }: { type: NoticeType }) {
  const m = NOTICE_META[type];
  return <span className={`chip ${m.cls}`}>{type}</span>;
}

export function Pill({
  children,
  active,
  onClick,
  className = '',
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip transition-all ${
        active
          ? 'bg-navy-900 text-white shadow-navy'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon}
      </div>
      <p className="font-bold text-navy-800">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-xl font-bold text-navy-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
