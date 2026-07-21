import { useState, useEffect } from 'react';
import {
  Megaphone,
  PartyPopper,
  CloudRain,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Send,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../lib/auth';
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
  const { notices, noticeComments, loadNoticeComments, addNoticeComment, deleteNoticeComment } = useApp();
  const { user, isGuest } = useAuth();
  const [selected, setSelected] = useState<Notice | null>(null);
  const [filter, setFilter] = useState<NoticeType | 'all'>('all');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = filter === 'all' ? notices : notices.filter((n) => n.type === filter);

  useEffect(() => {
    if (selected) {
      setCommentText('');
      void loadNoticeComments(selected.id);
    }
  }, [selected, loadNoticeComments]);

  const handleAddComment = async () => {
    if (!selected || !commentText.trim()) return;
    setSubmitting(true);
    const res = await addNoticeComment(selected.id, commentText);
    setSubmitting(false);
    if (res.ok) {
      setCommentText('');
    } else {
      alert(res.error || '댓글 작성에 실패했습니다.');
    }
  };

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
                <div className="flex-1 min-w-0 space-y-1">
                  <span className={`chip ${NOTICE_META[n.type].cls}`}>{n.type}</span>
                  <p className="font-bold text-navy-900 truncate">{n.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{n.content}</p>
                </div>
                {n.imageUrl && (
                  <img
                    src={n.imageUrl}
                    alt={n.title}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                )}
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
            {selected.imageUrl && (
              <img
                src={selected.imageUrl}
                alt={selected.title}
                className="w-full rounded-xl border border-slate-200 max-h-80 object-cover"
              />
            )}
            <p className="text-navy-800 whitespace-pre-wrap leading-relaxed">{selected.content}</p>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare size={14} className="text-slate-400" />
                <span className="text-sm font-bold text-navy-900">댓글</span>
                <span className="text-xs text-slate-400">({noticeComments.length})</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {noticeComments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">댓글이 없습니다.</p>
                ) : (
                  noticeComments.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-start gap-2 rounded-lg p-2.5 ${
                        c.isAdmin ? 'bg-volt-50 ring-1 ring-volt-200' : 'bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          c.isAdmin
                            ? 'bg-navy-900 text-volt-400'
                            : 'bg-navy-100 text-navy-700'
                        }`}
                      >
                        {c.isAdmin ? <ShieldAlert size={14} /> : c.userName.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-navy-900">{c.userName}</span>
                          {c.isAdmin && (
                            <span className="chip bg-navy-900 text-volt-400 text-[10px] py-0 px-1.5">
                              관리자
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-navy-800 break-words mt-0.5">{c.content}</p>
                      </div>
                      {user && c.userId === user.id && (
                        <button
                          onClick={() => deleteNoticeComment(c.id)}
                          className="text-rose-400 hover:text-rose-600 p-1 shrink-0"
                          aria-label="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {isGuest ? (
                <p className="text-xs text-slate-400 text-center py-2 mt-2">
                  댓글은 회원만 작성할 수 있습니다.
                </p>
              ) : user ? (
                <div className="flex gap-2 mt-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleAddComment();
                      }
                    }}
                    placeholder="한줄 댓글을 입력하세요"
                    maxLength={100}
                    className="input flex-1 py-2"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !commentText.trim()}
                    className="btn-primary px-3 disabled:opacity-50"
                    aria-label="댓글 등록"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
