import { useState, useEffect, useRef } from 'react';
import type { GalleryItem } from '../types';

interface Props {
  slides: GalleryItem[];
  aspectClass?: string;
}

export function GallerySlideshow({ slides, aspectClass = 'aspect-[16/10] sm:aspect-[16/8]' }: Props) {
  const slideCount = slides.length;
  const extendedSlides = slideCount > 1 ? [slides[slideCount - 1], ...slides, slides[0]] : slides;
  const [displayIndex, setDisplayIndex] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [noTransition, setNoTransition] = useState(false);
  const dragStartRef = useRef<{ x: number } | null>(null);

  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = setInterval(() => {
      setDragOffset(0);
      setDisplayIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [slideCount]);

  const onTransitionEnd = () => {
    if (slideCount <= 1) return;
    if (displayIndex === 0) {
      setNoTransition(true);
      setDisplayIndex(slideCount);
    } else if (displayIndex === slideCount + 1) {
      setNoTransition(true);
      setDisplayIndex(1);
    }
  };

  useEffect(() => {
    if (noTransition) {
      requestAnimationFrame(() => setNoTransition(false));
    }
  }, [noTransition]);

  useEffect(() => {
    setDisplayIndex(slideCount > 0 ? 1 : 0);
  }, [slideCount]);

  const realIndex = (() => {
    if (slideCount <= 1) return 0;
    if (displayIndex === 0) return slideCount - 1;
    if (displayIndex === slideCount + 1) return 0;
    return displayIndex - 1;
  })();

  const onPointerDown = (e: React.PointerEvent) => {
    if (slideCount <= 1) return;
    dragStartRef.current = { x: e.clientX };
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    setDragOffset(e.clientX - dragStartRef.current.x);
  };

  const onPointerUp = () => {
    if (!isDragging || !dragStartRef.current) return;
    const containerWidth = window.innerWidth;
    const threshold = containerWidth * 0.15;
    const delta = dragOffset;
    setDragOffset(0);
    setIsDragging(false);
    dragStartRef.current = null;
    if (delta < -threshold) {
      setDisplayIndex((prev) => prev + 1);
    } else if (delta > threshold) {
      setDisplayIndex((prev) => prev - 1);
    }
  };

  if (slideCount === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-navy touch-pan-y select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className={`flex ${isDragging || noTransition ? '' : 'transition-transform duration-700 ease-out'}`}
        style={{
          transform: `translateX(calc(-${displayIndex * 100}% + ${dragOffset}px))`,
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {extendedSlides.map((slide, i) => (
          <div key={`${slide.id}-${i}`} className={`relative w-full shrink-0 ${aspectClass} pointer-events-none`}>
            <img
              src={slide.imageUrl}
              alt={slide.summary}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {slide.summary && (
              <p className="absolute bottom-3 right-4 text-sm font-semibold text-white text-right drop-shadow-lg max-w-[70%]">
                {slide.summary}
              </p>
            )}
          </div>
        ))}
      </div>
      {slideCount > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDragOffset(0); setDisplayIndex(i + 1); }}
              className={`h-1.5 rounded-full transition-all ${i === realIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
              aria-label={`슬라이드 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
