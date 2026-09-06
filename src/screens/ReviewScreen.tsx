import { useState, useRef, useCallback } from 'react';
import {
  Star,
  ImagePlus,
  X,
  Loader2,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../store';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { SectionTitle, EmptyState } from '../components/ui';

const MAX_WIDTH = 1200;
const MAX_IMAGES = 5;

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

function StarRating({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n}점`}
        >
          <Star
            size={size}
            className={
              (hover || value) >= n
                ? 'text-amber-400'
                : 'text-slate-300'
            }
            fill={(hover || value) >= n ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewScreen() {
  const { reviews, createReview } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleReviews = reviews.filter((r) => !r.isDeleted);
  const avgRating =
    visibleReviews.length > 0
      ? (visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleReviews.length).toFixed(1)
      : '0';

  const onPickImages = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) {
      alert(`사진은 최대 ${MAX_IMAGES}장입니다.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const blob = await resizeImage(file);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        if (!supabaseConfigured) throw new Error('Supabase가 설정되지 않았습니다.');
        const { error: upErr } = await supabase.storage
          .from('reviews')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('reviews').getPublicUrl(fileName);
        uploaded.push(pub.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      alert('사진 업로드 실패: ' + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [images.length]);

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setAuthorName('');
    setContent('');
    setRating(5);
    setImages([]);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const result = await createReview({
      authorName,
      content,
      rating,
      imageUrls: images,
    });
    if (result.ok) {
      resetForm();
    } else {
      alert(result.error || '등록 실패');
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="이용후기"
        subtitle="플테하 이용 후 남겨주신 소중한 후기입니다"
        right={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="btn-primary text-sm whitespace-nowrap"
          >
            {showForm ? '취소' : '후기 작성'}
          </button>
        }
      />

      {/* Summary */}
      {visibleReviews.length > 0 && (
        <div className="card p-4 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star size={28} className="text-amber-400" fill="currentColor" />
            <span className="text-2xl font-extrabold text-navy-900">{avgRating}</span>
          </div>
          <div className="text-sm text-slate-500">
            <span className="font-bold text-navy-800">{visibleReviews.length}</span>개의 후기
          </div>
        </div>
      )}

      {/* Write Form */}
      {showForm && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="label">이름</label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={20}
              className="input"
            />
          </div>
          <div>
            <label className="label">별점</label>
            <StarRating value={rating} onChange={setRating} size={32} />
          </div>
          <div>
            <label className="label">후기 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이용하신 후기를 자유롭게 남겨주세요"
              maxLength={500}
              rows={4}
              className="input resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-right">{content.length}/500</p>
          </div>
          <div>
            <label className="label">사진 (최대 {MAX_IMAGES}장)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickImages}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt={`사진 ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow"
                    aria-label="삭제"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-volt-400 hover:text-volt-500 transition disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <ImagePlus size={20} />
                      <span className="text-[10px] font-semibold">추가</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              가로 1200px로 자동 리사이즈되어 업로드됩니다.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={uploading || !authorName.trim() || !content.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 업로드 중...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> 후기 등록
              </>
            )}
          </button>
        </div>
      )}

      {/* Review List */}
      {visibleReviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="아직 후기가 없어요"
          description="첫 번째 후기를 남겨주세요!"
        />
      ) : (
        <div className="space-y-3">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="card p-4 space-y-3 animate-slide-up"
            >
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
                <StarRating value={review.rating} size={16} />
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
                      className="block"
                    >
                      <img
                        src={url}
                        alt={`후기 사진 ${idx + 1}`}
                        loading="lazy"
                        className="w-24 h-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition"
                      />
                    </a>
                  ))}
                </div>
              )}

              {/* Admin Reply */}
              {review.adminReply && (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
