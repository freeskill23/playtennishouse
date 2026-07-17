import { useState } from 'react';
import {
  Megaphone,
  PartyPopper,
  CloudRain,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../store';
import { SectionTitle, EmptyState } from '../components/ui';
import { Modal } from '../components/Modal';
import { NOTICE_META } from '../types';
import type { Notice, NoticeType } from '../types';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Megaphone,
  PartyPopper,
  CloudRain,
  RotateCcw,
  ShieldCheck,
};

export function NoticesScreen() {
  const { notices } = useApp();
  const [selected, setSelected] = useState<Notice | null>(null);
  const [filter, setFilter] = useState<NoticeType | 'all'>('all');

  const filtered = filter === 'all' ? notices : notices.filter((n) => n.type === filter);

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle title="공지사항" subtitle="일반공지 · 이벤트 · 우천 · 환불 · 이용수칙 안내" />

      <div className="flex flex-wrap gap-1.5">
        {(['all', '일반공지', '이벤트', '우천', '환불', '이용수칙'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`chip transition ${filter === t ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {t === 'all' ? '전체' : t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Megaphone size={28} />} title="공지사항이 없어요" />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = ICONS[NOTICE_META[n.type].icon] || Megaphone;
            return (
              <button
                key={n.id}
                onClick={() => setSelected(n)}
                className="card w-full p-4 flex items-center gap-3 text-left hover:border-navy-200 transition"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${NOTICE_META[n.type].cls}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`chip ${NOTICE_META[n.type].cls}`}>{n.type}</span>
                    <p className="font-bold text-navy-900 truncate">{n.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{n.content}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        footer={<button className="btn-primary" onClick={() => setSelected(null)}>확인</button>}
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`chip ${NOTICE_META[selected.type].cls}`}>{selected.type}</span>
              <span className="text-xs text-slate-400">
                {new Date(selected.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <p className="text-navy-800 whitespace-pre-wrap leading-relaxed">{selected.content}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
