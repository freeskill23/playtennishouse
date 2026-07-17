import { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { useApp } from '../store';
import { SectionTitle, EmptyState } from '../components/ui';

export function GalleryScreen() {
  const { galleryItems } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = selectedId
    ? galleryItems.find((i) => i.id === selectedId) ?? null
    : null;

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="갤러리"
        subtitle="플테하의 순간들을 확인해보세요"
      />

      {galleryItems.length === 0 ? (
        <EmptyState icon={<ImageIcon size={28} />} title="아직 등록된 사진이 없어요" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {galleryItems.map((item) => (
            <figure
              key={item.id}
              onClick={() =>
                setSelectedId((prev) => (prev === item.id ? null : item.id))
              }
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.summary}
                  loading="lazy"
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
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
            </figure>
          ))}
        </div>
      )}

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedId(null)}
        >
          <button
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(null);
            }}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
          <figure
            className="mx-4 max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.summary}
              className="max-h-[80vh] w-full object-contain"
            />
            <figcaption className="p-4">
              <p className="text-sm font-semibold text-navy-900">
                {selectedItem.summary}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(selectedItem.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
