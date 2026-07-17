import { useState, useRef } from 'react';
import { ImagePlus, Trash2, Loader2, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../store';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { SectionTitle, EmptyState } from '../../components/ui';

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

export function AdminGalleryScreen() {
  const { galleryItems, createGalleryItem, deleteGalleryItem } = useApp();
  const [summary, setSummary] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!pendingFile || !summary.trim()) return;
    setUploading(true);
    try {
      const blob = await resizeImage(pendingFile);
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      if (!supabaseConfigured) {
        throw new Error('Supabase가 설정되지 않았습니다.');
      }
      const { error: upErr } = await supabase.storage
        .from('gallery')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('gallery').getPublicUrl(fileName);
      createGalleryItem({ imageUrl: pub.publicUrl, summary: summary.trim() });
      setSummary('');
      clearPick();
    } catch (err) {
      alert('업로드 실패: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="갤러리 관리"
        subtitle="사진과 한줄 요약을 등록하세요"
      />

      <div className="card p-5 space-y-4 animate-slide-up">
        <div>
          <label className="label">사진 선택</label>
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
              <span className="text-xs font-semibold">사진 선택</span>
            </button>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            가로 500px로 자동 리사이즈되어 업로드됩니다.
          </p>
        </div>
        <div>
          <label className="label">한줄 요약</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="사진에 대한 한줄 요약을 입력하세요"
            maxLength={60}
            className="input"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={uploading || !pendingFile || !summary.trim()}
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

      <div className="space-y-2">
        {galleryItems.length === 0 ? (
          <EmptyState icon={<ImagePlus size={28} />} title="등록된 사진이 없어요" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {galleryItems.map((item) => (
              <figure
                key={item.id}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.summary}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-2.5">
                  <p className="text-xs font-semibold text-navy-900 line-clamp-2 leading-snug">
                    {item.summary}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </figcaption>
                <button
                  onClick={() => deleteGalleryItem(item.id)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
