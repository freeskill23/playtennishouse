import { Image as ImageIcon } from 'lucide-react';
import { useApp } from '../store';
import { SectionTitle, EmptyState } from '../components/ui';

export function GalleryScreen() {
  const { galleryItems } = useApp();

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
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 transition hover:shadow-lg hover:-translate-y-0.5"
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
    </div>
  );
}
