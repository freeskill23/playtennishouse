import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { fetchVisiblePortfolio } from "@/lib/api";
import type { PortfolioRow } from "@/types/database";
import { PORTFOLIO_ITEMS } from "@/config/portfolio";

export function PortfolioSection() {
  const [items, setItems] = useState<PortfolioRow[] | null>(null);

  useEffect(() => {
    fetchVisiblePortfolio()
      .then(setItems)
      .catch(() => setItems(null));
  }, []);

  const displayItems = items ?? PORTFOLIO_ITEMS.map((p, i) => ({
    id: String(i),
    dog_name: p.dogName,
    breed: p.breed,
    weight: p.weight,
    size: p.size,
    note: p.note,
    image_url: null,
    display_order: i,
    is_visible: true,
    created_at: "",
  }));

  return (
    <section id="portfolio" className="bg-white section-padding">
      <div className="container-wide">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            PORTFOLIO
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
            오늘의 코코스핏
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-charcoal-muted">
            실제 고객의 주문 사례입니다. 각 사례는 입력한 사이즈에 맞춰 제작되었습니다.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 100}>
              <article className="group overflow-hidden rounded-3xl border border-birch-200 bg-birch-50 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(184,160,126,0.1)]">
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-birch-100 to-birch-200">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.dog_name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-charcoal-muted">
                        <div className="h-24 w-24 rounded-full border-2 border-birch-300 bg-birch-50/50" />
                        <span className="text-xs">실제 사진 준비 중</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-charcoal/90 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-sm">
                    {item.dog_name}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-charcoal-muted">
                    <span>{item.breed}</span>
                    <span className="h-1 w-1 rounded-full bg-charcoal-muted/40" />
                    <span>{item.weight}</span>
                  </div>
                  <p className="mt-2 font-mono text-sm font-semibold text-charcoal">{item.size}</p>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">{item.note}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
