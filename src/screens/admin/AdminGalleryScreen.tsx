import { useState, useRef } from 'react';
import { ImagePlus, Trash2, Loader2, CheckCircle2, X, Star, CalendarRange, BedDouble, Pencil, ImageUp, GripVertical } from 'lucide-react';
import { useApp } from '../../store';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { SectionTitle, EmptyState } from '../../components/ui';

const MAX_WIDTH = 1200;

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
        0.9,
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
  const { galleryItems, createGalleryItem, deleteGalleryItem, toggleGalleryFeatured, toggleGalleryShowOnCourt, toggleGalleryShowOnPension, updateGalleryItem, setGalleryOrder } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [editPendingFile, setEditPendingFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const onEditPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setEditPendingFile(f);
    setEditPreviewUrl(URL.createObjectURL(f));
  };

  const clearEditPick = () => {
    setEditPendingFile(null);
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  const handleEditSave = async (itemId: string) => {
    if (!editSummary.trim()) return;
    let newImageUrl: string | undefined;
    if (editPendingFile) {
      setEditUploading(true);
      try {
        const blob = await resizeImage(editPendingFile);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        if (!supabaseConfigured) throw new Error('Supabase가 설정되지 않았습니다.');
        const { error: upErr } = await supabase.storage
          .from('gallery')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('gallery').getPublicUrl(fileName);
        newImageUrl = pub.publicUrl;
      } catch (err) {
        alert('사진 업로드 실패: ' + (err as Error).message);
        setEditUploading(false);
        return;
      }
      setEditUploading(false);
    }
    updateGalleryItem(itemId, { summary: editSummary.trim(), imageUrl: newImageUrl });
    setEditingId(null);
    clearEditPick();
  };

  const startEdit = (itemId: string, currentSummary: string) => {
    setEditingId(itemId);
    setEditSummary(currentSummary);
    clearEditPick();
  };

  const cancelEdit = () => {
    setEditingId(null);
    clearEditPick();
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
        subtitle="사진을 드래그하여 순서를 변경할 수 있습니다 · 좌측 상단이 첫번째 · 별표: 메인 슬라이드 · 코트/펜션 아이콘: 각 예약 화면 슬라이드"
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
            가로 1200px로 자동 리사이즈되어 업로드됩니다.
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
            {[...galleryItems]
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((item, idx, arr) => (
              <figure
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedId(item.id);
                }}
                onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (item.id !== draggedId) setDragOverId(item.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedId || draggedId === item.id) return;
                  const sorted = [...galleryItems].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                  const ids = sorted.map((g) => g.id);
                  const fromIdx = ids.indexOf(draggedId);
                  const toIdx = ids.indexOf(item.id);
                  if (fromIdx === -1 || toIdx === -1) return;
                  ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
                  setGalleryOrder(ids);
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition-all ${draggedId === item.id ? 'opacity-40 scale-95' : ''} ${dragOverId === item.id ? 'ring-2 ring-volt-400 ring-offset-1 scale-[1.02]' : ''}`}
              >
                <div className="aspect-square overflow-hidden pointer-events-none">
                  <img
                    src={item.imageUrl}
                    alt={item.summary}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                <figcaption className="p-2.5">
                  {editingId === item.id ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        onChange={onEditPick}
                        className="hidden"
                      />
                      {editPreviewUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={editPreviewUrl}
                            alt="새 사진 미리보기"
                            className="w-full h-24 object-cover rounded-lg border border-volt-300"
                          />
                          <button
                            onClick={clearEditPick}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow"
                            aria-label="사진 취소"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => editFileRef.current?.click()}
                          className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-volt-400 hover:text-volt-500 transition py-2"
                        >
                          <ImageUp size={16} />
                          <span className="text-xs font-semibold">사진 변경</span>
                        </button>
                      )}
                      <input
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        maxLength={60}
                        className="input py-1.5 text-xs"
                        placeholder="한줄 요약"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditSave(item.id)}
                          disabled={!editSummary.trim() || editUploading}
                          className="flex-1 rounded-lg bg-volt-500 text-navy-900 text-xs font-bold py-1.5 disabled:opacity-50"
                        >
                          {editUploading ? <Loader2 size={14} className="animate-spin mx-auto" /> : '저장'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-lg bg-slate-100 text-slate-600 text-xs font-bold py-1.5 px-3"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-navy-900 line-clamp-2 leading-snug">
                        {item.summary}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </>
                  )}
                </figcaption>
                <button
                  onClick={() => toggleGalleryFeatured(item.id)}
                  className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow transition ${item.isFeatured ? 'bg-volt-400 text-navy-900 opacity-100' : 'bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-volt-500'}`}
                  aria-label={item.isFeatured ? '추천 해제' : '추천 설정'}
                >
                  <Star size={14} fill={item.isFeatured ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => toggleGalleryShowOnCourt(item.id)}
                  className={`absolute top-9 left-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow transition ${item.showOnCourt ? 'bg-navy-700 text-white opacity-100' : 'bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-navy-700'}`}
                  aria-label={item.showOnCourt ? '코트 화면 해제' : '코트 화면 설정'}
                  title="코트 예약 화면 슬라이드"
                >
                  <CalendarRange size={14} />
                </button>
                <button
                  onClick={() => toggleGalleryShowOnPension(item.id)}
                  className={`absolute top-[4rem] left-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow transition ${item.showOnPension ? 'bg-volt-500 text-navy-900 opacity-100' : 'bg-white/90 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-volt-600'}`}
                  aria-label={item.showOnPension ? '펜션 화면 해제' : '펜션 화면 설정'}
                  title="펜션 예약 화면 슬라이드"
                >
                  <BedDouble size={14} />
                </button>
                <button
                  onClick={() => deleteGalleryItem(item.id)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-rose-500 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => startEdit(item.id, item.summary)}
                  className="absolute top-9 right-1.5 w-7 h-7 rounded-full bg-white/90 text-navy-700 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition hover:bg-navy-100"
                  aria-label="수정"
                >
                  <Pencil size={14} />
                </button>
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-white/90 rounded-full px-1.5 py-1 shadow cursor-grab active:cursor-grabbing">
                  <GripVertical size={14} className="text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-500">{idx + 1}</span>
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
