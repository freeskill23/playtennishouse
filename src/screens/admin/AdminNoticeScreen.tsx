import { useState, useRef, Fragment } from 'react';
import {
  Megaphone,
  PartyPopper,
  CloudRain,
  RotateCcw,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  GripVertical,
  ImagePlus,
  X,
  Loader2,
  MessageSquare,
  Send,
  ShieldAlert,
  Reply,
} from 'lucide-react';
import { useApp } from '../../store';
import { supabase, supabaseConfigured } from '../../lib/supabase';
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

const MAX_WIDTH = 500;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export function AdminNoticeScreen() {
  const { notices, createNotice, deleteNotice, reorderNotices, noticeComments, addAdminNoticeComment, deleteAdminNoticeComment, loadNoticeComments } = useApp();
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: '일반공지' as NoticeType,
    imageUrl: '' as string,
  });
  const [showForm, setShowForm] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteComment = async (commentId: string) => {
    if (deleting) return;
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    setDeleting(commentId);
    const r = await deleteAdminNoticeComment(commentId, 'admin123');
    setDeleting(null);
    if (!r.ok) alert(r.error || '댓글 삭제에 실패했습니다.');
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearPick = () => {
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    let imageUrl = form.imageUrl;
    if (pendingFile) {
      setUploading(true);
      try {
        const blob = await resizeImage(pendingFile);
        const fileName = `notice-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        if (!supabaseConfigured) throw new Error('Supabase가 설정되지 않았습니다.');
        const { error: upErr } = await supabase.storage
          .from('gallery')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('gallery').getPublicUrl(fileName);
        imageUrl = pub.publicUrl;
      } catch (err) {
        alert('이미지 업로드 실패: ' + (err as Error).message);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }
    createNotice({
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      imageUrl: imageUrl || undefined,
    });
    setForm({ title: '', content: '', type: '일반공지', imageUrl: '' });
    clearPick();
    setShowForm(false);
  };

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== idx) setOverIndex(idx);
  };

  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...notices];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    reorderNotices(next.map((n) => n.id));
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
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
          {form.type === '이벤트' && (
            <div>
              <label className="label">이벤트 이미지 (선택)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPick}
                className="hidden"
              />
              {previewUrl ? (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="미리보기"
                    className="w-40 h-40 object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={clearPick}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg"
                    aria-label="취소"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-40 h-40 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-volt-400 hover:text-volt-500 transition"
                >
                  <ImagePlus size={28} />
                  <span className="text-xs font-semibold">이미지 선택</span>
                </button>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                가로 500px로 자동 리사이즈되어 저장됩니다.
              </p>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 업로드 중...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> 등록하기
              </>
            )}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notices.length === 0 ? (
          <EmptyState icon={<Megaphone size={28} />} title="등록된 공지가 없어요" />
        ) : (
          notices.map((n, idx) => {
            const Icon = ICONS[NOTICE_META[n.type].icon] || Megaphone;
            const isDragging = dragIndex === idx;
            const isOver = overIndex === idx && dragIndex !== idx;
            return (
              <Fragment key={n.id}>
              <div
                draggable
                onDragStart={handleDragStart(idx)}
                onDragOver={handleDragOver(idx)}
                onDrop={handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`card p-4 flex items-start gap-3 transition ${
                  isDragging ? 'opacity-40 scale-[0.99]' : ''
                } ${isOver ? 'ring-2 ring-volt-400' : ''}`}
              >
                <div
                  className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing pt-1 shrink-0 touch-none"
                  aria-label="순서 변경"
                >
                  <GripVertical size={18} />
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${NOTICE_META[n.type].cls}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`chip ${NOTICE_META[n.type].cls}`}>{n.type}</span>
                    <p className="font-bold text-navy-900 truncate">{n.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.content}</p>
                  {n.imageUrl && (
                    <img
                      src={n.imageUrl}
                      alt={n.title}
                      className="mt-2 w-24 h-24 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => deleteNotice(n.id)}
                    className="text-rose-500 hover:bg-rose-50 rounded-lg p-1.5 transition shrink-0"
                    aria-label="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const next = replyOpen === n.id ? null : n.id;
                      setReplyOpen(next);
                      setReplyText('');
                      setReplyTarget(null);
                      if (next) loadNoticeComments(n.id);
                    }}
                    className="text-navy-600 hover:bg-navy-50 rounded-lg p-1.5 transition shrink-0"
                    aria-label="댓글 관리"
                    title="댓글 관리"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
              {replyOpen === n.id && (
                <div className="ml-14 mr-2 mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {noticeComments
                      .filter((c) => c.noticeId === n.id && !c.parentId)
                      .sort((a, b) => a.createdAt - b.createdAt)
                      .map((c) => {
                        const replies = noticeComments
                          .filter((r) => r.parentId === c.id)
                          .sort((a, b) => a.createdAt - b.createdAt);
                        return (
                          <div key={c.id} className="space-y-1.5">
                            <div
                              className={`flex items-start gap-2 rounded-lg p-2 ${
                                c.isAdmin ? 'bg-volt-50 ring-1 ring-volt-200' : 'bg-white'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                  c.isAdmin ? 'bg-navy-900 text-volt-400' : 'bg-navy-100 text-navy-700'
                                }`}
                              >
                                {c.isAdmin ? <ShieldAlert size={12} /> : c.userName.slice(0, 1)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-navy-900">{c.userName}</span>
                                  {c.isAdmin && (
                                    <span className="chip bg-navy-900 text-volt-400 text-[9px] py-0 px-1">
                                      관리자
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(c.createdAt).toLocaleString('ko-KR')}
                                  </span>
                                </div>
                                <p className="text-xs text-navy-800 break-words mt-0.5">{c.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {!c.isAdmin && (
                                    <button
                                      onClick={() => {
                                        setReplyTarget(replyTarget === c.id ? null : c.id);
                                        setReplyText('');
                                      }}
                                      className="text-[10px] text-navy-500 hover:text-navy-800 font-semibold flex items-center gap-0.5"
                                    >
                                      <Reply size={10} /> 답글
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    disabled={deleting === c.id}
                                    className="text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-0.5 disabled:opacity-40"
                                  >
                                    {deleting === c.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} 삭제
                                  </button>
                                </div>
                              </div>
                            </div>
                            {replies.map((r) => (
                              <div
                                key={r.id}
                                className={`flex items-start gap-2 rounded-lg p-2 ml-6 ${
                                  r.isAdmin ? 'bg-volt-50 ring-1 ring-volt-200' : 'bg-white'
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                                    r.isAdmin ? 'bg-navy-900 text-volt-400' : 'bg-navy-100 text-navy-700'
                                  }`}
                                >
                                  {r.isAdmin ? <ShieldAlert size={10} /> : r.userName.slice(0, 1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-navy-900">{r.userName}</span>
                                    {r.isAdmin && (
                                      <span className="chip bg-navy-900 text-volt-400 text-[9px] py-0 px-1">
                                        관리자
                                      </span>
                                    )}
                                    <span className="text-[9px] text-slate-400">
                                      {new Date(r.createdAt).toLocaleString('ko-KR')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-navy-800 break-words mt-0.5">{r.content}</p>
                                  <button
                                    onClick={() => handleDeleteComment(r.id)}
                                    disabled={deleting === r.id}
                                    className="mt-1 text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-0.5 disabled:opacity-40"
                                  >
                                    {deleting === r.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />} 삭제
                                  </button>
                                </div>
                              </div>
                            ))}
                            {replyTarget === c.id && (
                              <div className="flex gap-2 ml-6">
                                <input
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`${c.userName}님에게 답글`}
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-100"
                                  autoFocus
                                />
                                <button
                                  onClick={async () => {
                                    if (!replyText.trim() || replying) return;
                                    setReplying(true);
                                    const r2 = await addAdminNoticeComment(n.id, replyText, 'admin123', c.id);
                                    setReplying(false);
                                    if (!r2.ok) {
                                      alert(r2.error || '관리자 댓글 등록에 실패했습니다.');
                                      return;
                                    }
                                    setReplyText('');
                                    setReplyTarget(null);
                                  }}
                                  disabled={!replyText.trim() || replying}
                                  className="rounded-lg bg-navy-900 text-white px-2.5 py-1.5 text-xs font-bold hover:bg-navy-800 transition disabled:opacity-40 flex items-center gap-1"
                                >
                                  {replying ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                  등록
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {noticeComments.filter((c) => c.noticeId === n.id && !c.parentId).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">댓글이 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
