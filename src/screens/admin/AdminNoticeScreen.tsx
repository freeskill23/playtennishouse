import { useState } from 'react';
import {
  Megaphone,
  PartyPopper,
  CloudRain,
  RotateCcw,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle, EmptyState } from '../../components/ui';
import { NOTICE_META } from '../../types';
import type { NoticeType } from '../../types';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Megaphone,
  PartyPopper,
  CloudRain,
  RotateCcw,
  ShieldCheck,
};

export function AdminNoticeScreen() {
  const { notices, createNotice, deleteNotice } = useApp();
  const [form, setForm] = useState({ title: '', content: '', type: '이벤트' as NoticeType });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    createNotice(form);
    setForm({ title: '', content: '', type: '이벤트' });
    setShowForm(false);
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="공지사항 관리"
        subtitle="신규 공지 등록 및 삭제"
        right={
          <button
            onClick={() => setShowForm((s) => !s)}
            className={`chip transition ${showForm ? 'bg-navy-900 text-white' : 'bg-volt-500 text-navy-950'}`}
          >
            <Plus size={14} /> {showForm ? '닫기' : '공지 등록'}
          </button>
        }
      />

      {showForm && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">공지 유형</label>
            <div className="flex flex-wrap gap-1.5">
              {(['일반공지', '이벤트', '우천', '환불', '이용수칙'] as NoticeType[]).map((t) => {
                const Icon = ICONS[NOTICE_META[t].icon];
                return (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`chip transition ${form.type === t ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    <Icon size={12} /> {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label">제목</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="공지 제목을 입력하세요"
              className="input"
            />
          </div>
          <div>
            <label className="label">내용</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="공지 내용을 입력하세요"
              className="input min-h-[100px]"
            />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">
            <CheckCircle2 size={18} /> 등록하기
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notices.length === 0 ? (
          <EmptyState icon={<Megaphone size={28} />} title="등록된 공지가 없어요" />
        ) : (
          notices.map((n) => {
            const Icon = ICONS[NOTICE_META[n.type].icon] || Megaphone;
            return (
              <div key={n.id} className="card p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${NOTICE_META[n.type].cls}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`chip ${NOTICE_META[n.type].cls}`}>{n.type}</span>
                    <p className="font-bold text-navy-900 truncate">{n.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={() => deleteNotice(n.id)}
                  className="text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0"
                  aria-label="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
