import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { fetchVisibleReviews } from "@/lib/api";
import type { ReviewRow } from "@/types/database";
import { REVIEWS } from "@/config/reviews";

export function ReviewSection() {
  const [items, setItems] = useState<ReviewRow[] | null>(null);

  useEffect(() => {
    fetchVisibleReviews()
      .then(setItems)
      .catch(() => setItems(null));
  }, []);

  const displayItems = items ?? REVIEWS.map((r, i) => ({
    id: String(i),
    dog_name: r.dogName,
    breed: r.breed,
    weight: r.weight,
    size: r.size,
    review: r.review,
    author: r.author,
    display_order: i,
    is_visible: true,
    created_at: "",
  }));

  return (
    <section id="reviews" className="bg-white section-padding">
      <div className="container-wide">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            REVIEWS
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
            맞춤 제작을 경험한 고객의 이야기
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {displayItems.map((review, i) => (
            <Reveal key={review.id} delay={i * 120}>
              <article className="flex h-full flex-col rounded-3xl border border-birch-200 bg-birch-50 p-6">
                <div className="flex gap-1 text-birch-400">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-birch-200 text-sm font-bold text-charcoal">
                    {review.dog_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{review.dog_name}</p>
                    <p className="text-xs text-charcoal-muted">{review.breed} · {review.weight}</p>
                  </div>
                </div>

                <p className="mt-4 font-mono text-xs font-medium text-charcoal-light">{review.size}</p>

                <p className="mt-4 flex-1 text-sm leading-relaxed text-charcoal-light">
                  "{review.review}"
                </p>

                <p className="mt-4 border-t border-birch-200 pt-4 text-xs text-charcoal-muted">
                  {review.author}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
