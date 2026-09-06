import { useState } from 'react';
import { Star, Trash2, MessageSquare, Reply, X } from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle, EmptyState } from '../../components/ui';

export function AdminReviewScreen() {
  const { reviews, replyReview, deleteReview } = useApp();
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const visibleReviews = reviews.filter((r) => !r.isDeleted);
  const avgRating =
    visibleReviews.length > 0
      ? (visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleReviews.length).toFixed(1)
      : '0';

  const startReply = (id: string) => {
    setReplyingId(id);
    const existing = visibleReviews.find((r) => r.id === id);
    setReplyText(existing?.adminReply || '');
  };

  const submitReply = (id: string) => {
    if (!replyText.trim()) return;
    replyReview(id, replyText);
    setReplyingId(null);
    setReplyText('');
  };

  const confirmDelete = (id: string) => {
    deleteReview(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="이용후기 관리"
        subtitle={`총 ${visibleReviews.length}개의 후기 · 평균 별점 ${avgRating}점`}
      />

      {visibleReviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="등록된 후기가 없어요"
        />
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((review) => (
            <div key={review.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm">
                    {review.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm">{review.authorName}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        className={review.rating >= n ? 'text-amber-400' : 'text-slate-300'}
                        fill={review.rating >= n ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>

              {review.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.imageUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={url}
                        alt={`후기 사진 ${idx + 1}`}
                        loading="lazy"
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Admin Reply Display */}
              {review.adminReply && replyingId !== review.id && (
                <div className="rounded-xl bg-navy-50 border border-navy-100 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-bold text-navy-600">관리자 답변</span>
                    {review.adminReplyAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(review.adminReplyAt).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-wrap">
                    {review.adminReply}
                  </p>
                </div>
              )}

              {/* Reply Form */}
              {replyingId === review.id && (
                <div className="space-y-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-700">답변 작성</span>
                    <button
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변을 입력하세요"
                    rows={3}
                    maxLength={500}
                    className="input resize-none text-sm"
                  />
                  <button
                    onClick={() => submitReply(review.id)}
                    disabled={!replyText.trim()}
                    className="btn-primary w-full text-sm disabled:opacity-50"
                  >
                    답변 등록
                  </button>
                </div>
              )}

              {/* Delete Confirm */}
              {deleteConfirmId === review.id && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-2">
                  <p className="text-sm font-bold text-rose-700">
                    정말 이 후기를 삭제하시겠습니까?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmDelete(review.id)}
                      className="flex-1 py-2 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-300 transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {replyingId !== review.id && deleteConfirmId !== review.id && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => startReply(review.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-100 text-navy-700 text-xs font-bold hover:bg-navy-200 transition"
                  >
                    <Reply size={14} />
                    {review.adminReply ? '답변 수정' : '답변 작성'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(review.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 text-xs font-bold hover:bg-rose-200 transition"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
